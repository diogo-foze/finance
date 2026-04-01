"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Truck, 
  Phone, 
  Mail, 
  CreditCard,
  DollarSign,
  Power
} from "lucide-react";
import { toast } from "sonner";
import { SupplierExpensesModal } from "./SupplierExpensesModal";
import { TransactionForm } from "../transactions/TransactionForm";
import { ConsolidationModal } from "../transactions/ConsolidationModal";
import { Transaction } from "../transactions/TransactionTable";

interface SupplierTableProps {
  suppliers: any[];
  onEdit: (supplier: any) => void;
  onRefresh: () => void;
}

export function SupplierTable({ suppliers, onEdit, onRefresh }: SupplierTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewExpensesSupplier, setViewExpensesSupplier] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [consolidatingTransaction, setConsolidatingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery) return suppliers;
    const lowerQuery = searchQuery.toLowerCase();
    return suppliers.filter(s => 
      s.nome.toLowerCase().includes(lowerQuery) || 
      s.cpf.includes(lowerQuery) || 
      (s.email && s.email.toLowerCase().includes(lowerQuery)) ||
      s.telefone.includes(lowerQuery)
    );
  }, [suppliers, searchQuery]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleToggleStatus = async (supplier: any) => {
    const isActivating = Number(supplier.ativo) === 0;
    if (!confirm(`Tem certeza que deseja ${isActivating ? 'ativar' : 'desativar'} este fornecedor?`)) return;

    try {
      const response = await fetch(`/api/fornecedores?id=${supplier._id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao alterar status");

      toast.success(data.message || `Fornecedor ${isActivating ? "ativado" : "desativado"} com sucesso!`);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-card p-4 rounded-xl border shadow-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CNPJ, e-mail ou telefone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none focus-visible:ring-0"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Fornecedor</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Limite de Crédito</TableHead>
              <TableHead>Débito em Aberto</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSuppliers.map((supplier) => (
                <TableRow key={supplier._id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(supplier.ativo) === 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div 
                        className="flex flex-col cursor-pointer hover:underline"
                        onClick={() => setViewExpensesSupplier(supplier)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{supplier.nome}</span>
                          {Number(supplier.ativo) === 0 && (
                            <Badge variant="outline" className="text-[9px] h-4">Desativado</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{supplier.telefone}</span>
                      </div>
                      {supplier.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">{supplier.cpf}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-zinc-50 text-zinc-700 border-zinc-200 gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      {formatCurrency(supplier.limiteCredito)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${supplier.creditoUtilizado > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'} gap-1.5`}>
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(supplier.creditoUtilizado || 0)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(supplier)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${Number(supplier.ativo) === 0 ? 'text-emerald-500' : 'text-zinc-500'}`}
                        onClick={() => handleToggleStatus(supplier)}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <SupplierExpensesModal 
        supplier={viewExpensesSupplier}
        isOpen={!!viewExpensesSupplier}
        onOpenChange={(open: boolean) => !open && setViewExpensesSupplier(null)}
        onEdit={(transaction: Transaction) => {
          setEditingTransaction(transaction);
          setViewExpensesSupplier(null);
        }}
        onConsolidate={(transaction: Transaction) => {
          setConsolidatingTransaction(transaction);
          setViewExpensesSupplier(null);
        }}
      />

      <TransactionForm 
        type="Despesa"
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null);
          onRefresh();
        }}
      />

      <ConsolidationModal 
        transaction={consolidatingTransaction}
        isOpen={!!consolidatingTransaction}
        onOpenChange={(open) => !open && setConsolidatingTransaction(null)}
        type="Despesa"
        onSuccess={() => {
          setConsolidatingTransaction(null);
          onRefresh();
        }}
      />
    </div>
  );
}
