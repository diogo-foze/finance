"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner";
import { PlusCircle, Trash2 } from "lucide-react";

interface TransactionFormProps {
  type: "Receita" | "Despesa";
  onSuccess?: () => void;
  transaction?: Transaction | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

import { Transaction } from "./TransactionTable";

export function TransactionForm({ type, onSuccess, transaction, isOpen: externalOpen, onOpenChange: setExternalOpen }: TransactionFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0],
    categoria: "",
    tipoMovimentacao: "Fixo" as "Fixo" | "Variável",
    status: "Planejado" as "Planejado" | "Consolidado",
    valorConsolidado: "",
    dataConsolidacao: new Date().toISOString().split('T')[0]
  });

  const formatInitialValue = (val: number) => {
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  };

  const syncFormWithTransaction = (t: Transaction | null | undefined) => {
    if (t) {
      setFormData({
        descricao: t.descricao,
        valor: formatInitialValue(t.valor),
        data: new Date(t.data).toISOString().split('T')[0],
        categoria: t.categoria,
        tipoMovimentacao: t.tipoMovimentacao,
        status: t.status || "Planejado",
        valorConsolidado: t.valorConsolidado ? formatInitialValue(t.valorConsolidado) : "",
        dataConsolidacao: t.dataConsolidacao ? new Date(t.dataConsolidacao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        descricao: "",
        valor: "",
        data: new Date().toISOString().split('T')[0],
        categoria: "",
        tipoMovimentacao: "Fixo",
        status: "Planejado",
        valorConsolidado: "",
        dataConsolidacao: new Date().toISOString().split('T')[0]
      });
    }
  };

  // Sync when transaction prop changes
  useEffect(() => {
    syncFormWithTransaction(transaction);
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === "Receita" ? "/api/receitas" : "/api/despesas";
      const isEdit = !!transaction?._id;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEdit ? { ...formData, id: transaction._id } : formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar dados");
      }

      toast.success(`${type} ${isEdit ? 'atualizada' : 'adicionada'} com sucesso!`);
      setOpen(false);

      if (!isEdit) {
        setFormData({
          descricao: "",
          valor: "",
          data: new Date().toISOString().split('T')[0],
          categoria: "",
          tipoMovimentacao: "Fixo",
          status: "Planejado",
          valorConsolidado: "",
          dataConsolidacao: new Date().toISOString().split('T')[0]
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction?._id) return;
    if (!confirm(`Tem certeza que deseja excluir esta ${type.toLowerCase()}?`)) return;

    setDeleteLoading(true);
    try {
      const endpoint = type === "Receita" ? `/api/receitas?id=${transaction._id}` : `/api/despesas?id=${transaction._id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) throw new Error("Erro ao excluir");

      toast.success(`${type} excluída com sucesso!`);
      setOpen(false);
      if (onSuccess) onSuccess();
      else router.refresh();
    } catch (error) {
      toast.error("Erro ao excluir!");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setFormData({ ...formData, valor: "" });
      return;
    }
    const formatted = (Number(rawValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    setFormData({ ...formData, valor: formatted });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {externalOpen === undefined && (
        <DialogTrigger render={<Button />}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova {type}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar' : 'Adicionar Nova'} {type}</DialogTitle>
        </DialogHeader>

        {transaction && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteLoading}
            className="absolute top-2 right-10 h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            {deleteLoading ? "..." : <Trash2 className="w-4 h-4" />}
            <span className="sr-only">Excluir</span>
          </Button>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              required
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Salário, Aluguel..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input
              required
              value={formData.valor}
              onChange={handleValueChange}
              placeholder="0,00"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <Input
                type="date"
                required
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Lazer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Movimentação</label>
            <Select
              value={formData.tipoMovimentacao}
              onValueChange={(val) => setFormData({ ...formData, tipoMovimentacao: val as "Fixo" | "Variável" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixo">Fixo</SelectItem>
                <SelectItem value="Variável">Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4 pt-2 border-t mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val as "Planejado" | "Consolidado" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Consolidado">Consolidado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === "Consolidado" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Consolidado (R$)</label>
                  <Input
                    value={formData.valorConsolidado}
                    onChange={(e) => {
                      let rawValue = e.target.value.replace(/\D/g, "");
                      if (!rawValue) {
                        setFormData({ ...formData, valorConsolidado: "" });
                        return;
                      }
                      const formatted = (Number(rawValue) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      });
                      setFormData({ ...formData, valorConsolidado: formatted });
                    }}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Consolidação</label>
                  <Input
                    type="date"
                    value={formData.dataConsolidacao}
                    onChange={(e) => setFormData({ ...formData, dataConsolidacao: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : (transaction ? "Atualizar" : "Salvar")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
