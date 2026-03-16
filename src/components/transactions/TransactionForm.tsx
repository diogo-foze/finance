"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

interface TransactionFormProps {
  type: "Receita" | "Despesa";
  onSuccess?: () => void;
}

export function TransactionForm({ type, onSuccess }: TransactionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split('T')[0],
    categoria: "",
    tipoMovimentacao: "Fixo"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = type === "Receita" ? "/api/receitas" : "/api/despesas";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar dados");
      }

      toast.success(`${type} adicionada com sucesso!`);
      setOpen(false);
      setFormData({
        descricao: "",
        valor: "",
        data: new Date().toISOString().split('T')[0],
        categoria: "",
        tipoMovimentacao: "Fixo"
      });
      
      // Refresh the page or trigger a data reload
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
      <DialogTrigger render={<Button />}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Nova {type}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova {type}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input 
              required 
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
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
                onChange={(e) => setFormData({...formData, data: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input 
                required 
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                placeholder="Ex: Lazer"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Movimentação</label>
            <Select 
              value={formData.tipoMovimentacao} 
              onValueChange={(val) => setFormData({...formData, tipoMovimentacao: val as "Fixo" | "Variável"})}
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
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
