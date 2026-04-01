"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Truck, LayoutGrid, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierTable } from "@/components/suppliers/SupplierTable";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FornecedoresPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fornecedores?all=${showInactive}`);
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data);
      }
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsFormOpen(true);
  };

  const activeSuppliers = suppliers.filter((s: any) => Number(s.ativo) !== 0);
  const totalCreditLimit = activeSuppliers.reduce((acc: number, s: any) => acc + (s.limiteCredito || 0), 0);
  const totalUsedCredit = activeSuppliers.reduce((acc: number, s: any) => acc + (s.creditoUtilizado || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 font-roboto">Fornecedores</h1>
            <p className="text-sm text-muted-foreground font-medium">Gestão de parceiros e provisões de pagamento</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl border">
            <input
              type="checkbox"
              id="show-inactive-suppliers"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 cursor-pointer accent-primary"
            />
            <label htmlFor="show-inactive-suppliers" className="text-xs font-medium cursor-pointer select-none">
              Mostrar Desativados
            </label>
          </div>
          <Button 
            onClick={handleAddNew} 
            className="gap-2 px-6 h-11 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2 text-primary-foreground">
            <CardDescription className="text-primary-foreground/70 font-medium">Fornecedores Ativos</CardDescription>
            <CardTitle className="text-3xl font-bold">{activeSuppliers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 opacity-80 font-medium">
              <Users className="w-3 h-3" />
              Parceiros registrados e ativos
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-100/70 font-medium">Limite de Crédito Total</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {formatCurrency(totalCreditLimit)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 opacity-80 font-medium">
              <LayoutGrid className="w-3 h-3" />
              Soma total de crédito concedido
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 transition-transform hover:scale-[1.02] duration-300">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-medium">Débito em Aberto</CardDescription>
            <CardTitle className="text-3xl font-bold text-destructive-foreground">
              {formatCurrency(totalUsedCredit)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 text-zinc-500 font-medium">
              <DollarSign className="w-3 h-3" />
              Total de despesas em aberto
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      ) : (
        <SupplierTable 
          suppliers={suppliers} 
          onEdit={handleEdit} 
          onRefresh={fetchSuppliers} 
        />
      )}

      <SupplierForm 
        supplier={editingSupplier} 
        isOpen={isFormOpen} 
        setOpen={setIsFormOpen} 
        onSuccess={fetchSuppliers} 
      />
    </div>
  );
}
