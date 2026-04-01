"use client";

import { useState, useEffect } from "react";
import { TransactionTable, Transaction } from "@/components/transactions/TransactionTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { ConsolidationModal } from "@/components/transactions/ConsolidationModal";

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [consolidatingTransaction, setConsolidatingTransaction] = useState<Transaction | null>(null);

  const fetchReceitas = async () => {
    try {
      const res = await fetch("/api/receitas");
      const data = await res.json();
      if (res.ok) {
        // Transform data from API format to Transaction format
        const transformed = data.map((item: any) => ({
          _id: item._id,
          descricao: item.descricao,
          valor: item.valor,
          data: item.data || item.dataRecebimento, // Tentar primeiro o campo padronizado 'data'
          categoria: item.categoria,
          tipoMovimentacao: item.tipoMovimentacao,
          status: item.status,
          valorConsolidado: item.valorConsolidado,
          dataConsolidacao: item.dataConsolidacao,
          clienteId: item.clienteId
        }));
        setReceitas(transformed);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar receitas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceitas();
  }, []);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Receitas</h2>
           <p className="text-muted-foreground">Gerencie suas entradas financeiras.</p>
        </div>
        <div className="flex items-center space-x-2">
          <TransactionForm type="Receita" onSuccess={fetchReceitas} />
        </div>
      </div>

      <TransactionForm 
        type="Receita"
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={fetchReceitas}
      />
      
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <TransactionTable 
          transactions={receitas} 
          type="Receita" 
          onRowClick={(t) => setEditingTransaction(t)}
          onConsolidate={(t) => setConsolidatingTransaction(t)}
        />
      )}

      <ConsolidationModal 
        transaction={consolidatingTransaction}
        isOpen={!!consolidatingTransaction}
        onOpenChange={(open) => !open && setConsolidatingTransaction(null)}
        type="Receita"
        onSuccess={fetchReceitas}
      />
    </div>
  );
}
