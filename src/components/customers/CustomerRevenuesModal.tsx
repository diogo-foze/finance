"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, Calendar, AlertCircle, DollarSign, EyeOff } from "lucide-react";
import { useVisibility } from "@/components/providers/VisibilityProvider";
import { cn } from "@/lib/utils";

import { Transaction } from "../transactions/TransactionTable";

interface CustomerRevenuesModalProps {
  customer: {
    _id: string;
    nome: string;
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
}

export function CustomerRevenuesModal({ customer, isOpen, onOpenChange, onEdit }: CustomerRevenuesModalProps) {
  const [revenues, setRevenues] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { isVisible } = useVisibility();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  useEffect(() => {
    if (isOpen && customer?._id) {
      setLoading(true);
      fetch(`/api/clientes/receitas?clienteId=${customer._id}`)
        .then(res => res.json())
        .then(data => {
          // Map dataRecebimento to data for Compatibility with Transaction interface
          const mapped = data.map((r: any) => ({
            ...r,
            data: r.dataRecebimento
          }));
          setRevenues(mapped);
          setLoading(false);
        })
        .catch(err => {
          console.error("Erro ao buscar receitas do cliente:", err);
          setLoading(false);
        });
    }
  }, [isOpen, customer?._id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Receipt className="w-5 h-5 text-primary" />
            Receitas Planejadas de {customer?.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse">
              Carregando receitas...
            </div>
          ) : revenues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              Este cliente ainda não possui receitas vinculadas.
            </div>
          ) : (
            <div className="grid gap-3">
              {revenues.map((r) => (
                <div 
                  key={r._id} 
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm hover:shadow-md"
                  onClick={() => onEdit(r)}
                >
                  <div className="flex flex-col gap-1.5 w-full pr-4">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">{r.descricao}</span>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(r.data), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </span>
                      <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded font-medium">{r.categoria}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="font-bold text-emerald-500 text-base tabular-nums">
                      {isVisible ? formatCurrency(r.valor) : <EyeOff className="h-4 w-4 inline-block text-zinc-400" />}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] h-5 px-2 gap-1.5 font-semibold transition-all",
                        r.status === "Consolidado" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {r.status === "Consolidado" ? <DollarSign className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
