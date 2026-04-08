"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface SupplierFormProps {
  supplier?: any;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SupplierForm({ supplier, isOpen, setOpen, onSuccess }: SupplierFormProps) {
  const [loading, setLoading] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    telefone: "",
    limiteCredito: "0,00",
    ativo: true,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        nome: supplier.nome,
        cpf: supplier.cpf || "",
        email: supplier.email || "",
        telefone: supplier.telefone || "",
        limiteCredito: supplier.limiteCredito?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00",
        ativo: Number(supplier.ativo) !== 0,
      });
    } else {
      setFormData({
        nome: "",
        cpf: "",
        email: "",
        telefone: "",
        limiteCredito: "0,00",
        ativo: true,
      });
    }
    setCpfError("");
  }, [supplier, isOpen]);

  const fetchCnpjData = async (cnpj: string) => {
    const cleanCnpj = cnpj.replace(/\D/g, "");
    if (cleanCnpj.length !== 14) return;

    try {
      const response = await fetch(`https://open.cnpja.com/office/${cleanCnpj}`);
      if (!response.ok) {
        toast.info("Tente novamente em alguns instantes...");
        return;
      }
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        nome: data.alias || data.company.name || prev.nome,
        email: data.emails?.[0]?.address || data.email || prev.email,
        telefone: data.phones?.[0] ? `(${data.phones[0].area}) ${data.phones[0].number}` : prev.telefone,
      }));
      toast.info("Dados do CNPJ preenchidos automaticamente");
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
    }
  };

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 14) value = value.slice(0, 14);

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4");
      value = value.replace(/(\d{4})(\d{1,2})$/, "$1-$2");

      if (value.replace(/\D/g, "").length === 14) {
        fetchCnpjData(value);
      }
    }

    setFormData({ ...formData, cpf: value });

    const clean = value.replace(/\D/g, "");
    if (clean.length > 0 && clean.length !== 11 && clean.length !== 14) {
      setCpfError("Incompleto");
    } else {
      setCpfError("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 5) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else if (value.length > 0) {
      value = value.replace(/^(\d*)/, "($1");
    }

    setFormData({ ...formData, telefone: value });
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setFormData({ ...formData, limiteCredito: "0,00" });
      return;
    }
    const formatted = (Number(rawValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    setFormData({ ...formData, limiteCredito: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!supplier?._id;
      const response = await fetch("/api/fornecedores", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: supplier?._id,
          nome: formData.nome,
          cpf: formData.cpf,
          email: formData.email,
          telefone: formData.telefone,
          limiteCredito: Number(formData.limiteCredito.replace(/\./g, "").replace(",", ".")),
          ativo: formData.ativo ? 1 : 0,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao salvar fornecedor");

      toast.success(`Fornecedor ${isEdit ? "atualizado" : "cadastrado"} com sucesso!`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{supplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Fornecedor / Empresa</label>
            <Input
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Armazém Central LTDA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium">CPF/CNPJ</label>
              <Input
                required
                value={formData.cpf}
                onChange={handleCpfCnpjChange}
                placeholder="00.000.000/0001-00"
                className={cpfError && cpfError !== "Incompleto" ? "border-destructive" : ""}
              />
              {cpfError && (
                <span className="text-[10px] absolute -bottom-4 left-0 text-destructive font-medium">
                  {cpfError}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input
                required
                value={formData.telefone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail (opcional)</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contato@fornecedor.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Limite de Crédito Disponível (R$)</label>
            <Input
              value={formData.limiteCredito}
              onChange={handleLimitChange}
              placeholder="0,00"
            />
          </div>

          {supplier && (
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold">Status do Fornecedor</label>
                <p className="text-xs text-muted-foreground">
                  {formData.ativo ? "Fornecedor está ativo" : "Fornecedor está inativo"}
                </p>
              </div>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Fornecedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
