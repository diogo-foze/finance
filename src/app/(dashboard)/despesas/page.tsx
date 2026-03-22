"use client";

import { useState, useEffect } from "react";
import { TransactionTable, Transaction } from "@/components/transactions/TransactionTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ConsolidationModal } from "@/components/transactions/ConsolidationModal";

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [consolidatingTransaction, setConsolidatingTransaction] = useState<Transaction | null>(null);

  const fetchDespesas = async () => {
    try {
      const res = await fetch("/api/despesas");
      const data = await res.json();
      if (res.ok) {
        // Transform data from API format to Transaction format
        const transformed = data.map((item: any) => ({
          _id: item._id,
          descricao: item.descricao,
          valor: item.valor,
          data: item.dataVencimento,
          categoria: item.categoria,
          tipoMovimentacao: item.tipoMovimentacao,
          status: item.status,
          valorConsolidado: item.valorConsolidado,
          dataConsolidacao: item.dataConsolidacao
        }));
        setDespesas(transformed);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDespesas();
  }, []);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
           <p className="text-muted-foreground">Gerencie suas saídas financeiras.</p>
        </div>
        <div className="flex items-center space-x-2">
          <TransactionForm type="Despesa" onSuccess={fetchDespesas} />
        </div>
      </div>

      <TransactionForm 
        type="Despesa"
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={fetchDespesas}
      />
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <TransactionTable 
          transactions={despesas} 
          type="Despesa" 
          onRowClick={(t) => setEditingTransaction(t)}
          onConsolidate={(t) => setConsolidatingTransaction(t)}
        />
      )}

      <ConsolidationModal 
        transaction={consolidatingTransaction}
        isOpen={!!consolidatingTransaction}
        onOpenChange={(open) => !open && setConsolidatingTransaction(null)}
        type="Despesa"
        onSuccess={fetchDespesas}
      />
    </div>
  );
}
