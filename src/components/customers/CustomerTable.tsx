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
  Trash2, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { CustomerRevenuesModal } from "./CustomerRevenuesModal";
import { TransactionForm } from "../transactions/TransactionForm";
import { Transaction } from "../transactions/TransactionTable";

interface CustomerTableProps {
  customers: any[];
  onEdit: (customer: any) => void;
  onRefresh: () => void;
}

export function CustomerTable({ customers, onEdit, onRefresh }: CustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRevenuesCustomer, setViewRevenuesCustomer] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const lowerQuery = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.nome.toLowerCase().includes(lowerQuery) || 
      c.cpf.includes(lowerQuery) || 
      (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
      c.telefone.includes(lowerQuery)
    );
  }, [customers, searchQuery]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este cliente?")) return;

    try {
      const response = await fetch(`/api/clientes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir cliente");

      toast.success("Cliente desativado com sucesso!");
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
          placeholder="Buscar por nome, CPF, e-mail ou telefone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-none focus-visible:ring-0"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>CPF/CNPJ</TableHead>
              <TableHead>Limite de Crédito</TableHead>
              <TableHead>Crédito Utilizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCustomers.map((customer) => (
                <TableRow key={customer._id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3 text-pretty">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div 
                        className="flex flex-col cursor-pointer hover:underline"
                        onClick={() => setViewRevenuesCustomer(customer)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{customer.nome}</span>
                          {customer.ativo === false && (
                            <Badge variant="outline" className="text-[9px] h-4 bg-zinc-100 text-zinc-500 border-zinc-200">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        {customer.dataNascimento && (
                          <span className="text-[10px] text-muted-foreground">
                            Nasc: {new Date(customer.dataNascimento).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{customer.telefone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono text-muted-foreground">{customer.cpf}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      {formatCurrency(customer.limiteCredito)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${customer.creditoUtilizado > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'} gap-1.5`}>
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(customer.creditoUtilizado || 0)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-primary hover:bg-primary/10"
                        onClick={() => onEdit(customer)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(customer._id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomerRevenuesModal 
        customer={viewRevenuesCustomer}
        isOpen={!!viewRevenuesCustomer}
        onOpenChange={(open) => !open && setViewRevenuesCustomer(null)}
        onEdit={(transaction) => {
          setEditingTransaction(transaction);
          setViewRevenuesCustomer(null);
        }}
      />

      <TransactionForm 
        type="Receita"
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null);
          onRefresh();
        }}
      />
    </div>
  );
}
