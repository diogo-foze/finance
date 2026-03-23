"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, LayoutGrid, DollarSign } from "lucide-react";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clientes?all=${showInactive}`);
      const data = await response.json();
      if (response.ok) {
        setCustomers(data);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const activeCustomers = customers.filter((c: any) => c.ativo !== false);
  const totalCreditLimit = activeCustomers.reduce((acc: number, c: any) => acc + (c.limiteCredito || 0), 0);
  const totalUsedCredit = activeCustomers.reduce((acc: number, c: any) => acc + (c.creditoUtilizado || 0), 0);

  return (
    <div className="flex-1 space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Gestão de Clientes</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Gerencie sua base de clientes e limites de crédito em um só lugar.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-xl border">
            <input
              type="checkbox"
              id="show-inactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <label htmlFor="show-inactive" className="text-xs font-medium cursor-pointer select-none">
              Mostrar Inativos
            </label>
          </div>
          <Button onClick={handleCreate} className="rounded-xl shadow-lg shadow-primary/20 gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70">Clientes Ativos</CardDescription>
            <CardTitle className="text-3xl font-bold">{activeCustomers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 opacity-80">
              <Users className="w-3 h-3" />
              Base de dados ativa
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100/70">Exposição de Crédito</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCreditLimit)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 opacity-80">
              <LayoutGrid className="w-3 h-3" />
              Soma total de limites concedidos
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-zinc-900 text-white shadow-lg shadow-zinc-900/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400">Crédito Utilizado</CardDescription>
            <CardTitle className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalUsedCredit)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 text-zinc-500">
              <DollarSign className="w-3 h-3" />
              Total de receitas planejadas
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
        <CustomerTable 
          customers={customers} 
          onEdit={handleEdit} 
          onRefresh={fetchCustomers} 
        />
      )}

      <CustomerForm
        isOpen={isFormOpen}
        setOpen={setIsFormOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}
