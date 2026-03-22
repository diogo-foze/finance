"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Transaction } from "./TransactionTable";

interface ConsolidationModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: "Receita" | "Despesa";
  onSuccess: () => void;
}

export function ConsolidationModal({ 
  transaction, 
  isOpen, 
  onOpenChange, 
  type,
  onSuccess 
}: ConsolidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [valorConsolidado, setValorConsolidado] = useState("");
  const [dataConsolidacao, setDataConsolidacao] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [parcelarRestante, setParcelarRestante] = useState(false);
  const [numeroParcelas, setNumeroParcelas] = useState("1");

  useEffect(() => {
    if (transaction) {
      setValorConsolidado(transaction.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      setDataConsolidacao(new Date().toISOString().split("T")[0]);
      setParcelarRestante(false);
      setNumeroParcelas("1");
    }
  }, [transaction]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setValorConsolidado("");
      return;
    }
    const formatted = (Number(rawValue) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    });
    setValorConsolidado(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);
    try {
      const endpoint = type === "Receita" ? "/api/receitas" : "/api/despesas";
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...transaction,
          id: transaction._id,
          status: "Consolidado",
          valorConsolidado: valorConsolidado,
          dataConsolidacao: dataConsolidacao,
          parcelarRestante: parcelarRestante,
          numeroParcelas: parseInt(numeroParcelas) || 1,
          // Map data back for the API
          data: transaction.data 
        }),
      });

      if (!response.ok) throw new Error("Erro ao consolidar");

      toast.success(`${type} consolidada com sucesso!`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao consolidar:", error);
      toast.error("Erro ao realizar a consolidação.");
    } finally {
      setLoading(false);
    }
  };

  const diff = transaction ? transaction.valor - Number(valorConsolidado.replace(/\./g, "").replace(",", ".")) : 0;
  const showPartialOptions = diff > 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Consolidação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground italic">
              {transaction?.descricao} - Valor Planejado: {transaction?.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Efetivado (R$)</label>
            <Input 
              required 
              value={valorConsolidado}
              onChange={handleValueChange}
              placeholder="0,00"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Consolidação</label>
            <Input 
              type="date" 
              required 
              value={dataConsolidacao}
              onChange={(e) => setDataConsolidacao(e.target.value)}
            />
          </div>

          {showPartialOptions && (
            <div className="space-y-4 pt-2 border-t mt-2 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-900">Restante em aberto: {diff.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                  <p className="text-[10px] text-amber-700">O valor restante será {parcelarRestante ? "parcelado" : "lançado como nova pendência"}.</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold uppercase text-amber-800">Parcelar?</span>
                  <Switch checked={parcelarRestante} onCheckedChange={setParcelarRestante} />
                </div>
              </div>

              {parcelarRestante && (
                <div className="space-y-2 px-1">
                  <label className="text-xs font-semibold">Número de Parcelas do Restante</label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="24"
                    value={numeroParcelas}
                    onChange={(e) => setNumeroParcelas(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processando..." : "Confirmar Consolidação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
