"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, DollarSign, EyeOff, CheckCircle2, ReceiptText } from "lucide-react";
import { useVisibility } from "@/components/providers/VisibilityProvider";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Transaction } from "../transactions/TransactionTable";

interface SupplierExpensesModalProps {
  supplier: {
    _id: string;
    nome: string;
  } | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onConsolidate: (transaction: Transaction) => void;
}

export function SupplierExpensesModal({ supplier, isOpen, onOpenChange, onEdit, onConsolidate }: SupplierExpensesModalProps) {
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { isVisible } = useVisibility();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const fetchExpenses = async () => {
    if (!supplier?._id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/fornecedores/despesas?id=${supplier._id}`);
      const data = await response.json();
      if (response.ok) {
        // Map dataVencimento to data for compatibility with Transaction interface
        const mapped = data.map((d: any) => ({
          ...d,
          data: d.dataVencimento
        }));
        setExpenses(mapped);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas do fornecedor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchExpenses();
    }
  }, [isOpen, supplier?._id]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ReceiptText className="w-5 h-5 text-primary" />
            Despesas Planejadas de {supplier?.nome}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground animate-pulse font-medium">
              Carregando despesas vinculadas...
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground italic border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
              Este fornecedor ainda não possui despesas vinculadas.
            </div>
          ) : (
            <div className="grid gap-3">
              {expenses.map((expense) => (
                <div 
                  key={expense._id} 
                  className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm hover:shadow-md"
                  onClick={() => onEdit(expense)}
                >
                  <div className="flex flex-col gap-1.5 w-full pr-4">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors line-clamp-1">{expense.descricao}</span>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(expense.data), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      </span>
                      <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded font-medium">{expense.categoria}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-destructive text-base tabular-nums">
                        - {isVisible ? formatCurrency(expense.valor) : <EyeOff className="h-4 w-4 inline-block text-zinc-400" />}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] h-5 px-2 gap-1.5 font-semibold transition-all",
                          expense.status === "Consolidado" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}
                      >
                        {expense.status === "Consolidado" ? <DollarSign className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {expense.status}
                      </Badge>
                    </div>

                    {expense.status === "Planejado" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConsolidate(expense);
                        }}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </Button>
                    )}
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
