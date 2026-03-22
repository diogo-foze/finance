"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Users, Receipt, Landmark, TrendingUp, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useVisibility } from "@/components/providers/VisibilityProvider";

interface DashboardData {
  summary: {
    saldo: number;
    receitas: number;
    despesas: number;
    receitasConsolidado: number;
    despesasConsolidado: number;
    quebraCaixa: number;
    imprevistos: number;
    atrasosReceita: number;
    atrasosDespesa: number;
  };
  chartData: any[];
  recentTransactions: any[];
  userStats: {
    totalUsers: number;
    onlineUsers: number;
  } | null;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="col-span-4 h-[400px]" />
        <Skeleton className="col-span-3 h-[400px]" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isVisible } = useVisibility();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (response.ok) {
          const stats = await response.json();
          setData(stats);
        }
      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p>Houve um erro ao carregar os dados.</p>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 group-hover:text-primary transition-colors">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold transition-colors ${data.summary.saldo >= 0 ? "text-zinc-900 group-hover:text-primary" : "text-destructive"}`}>
              {isVisible ? formatCurrency(data.summary.saldo) : <EyeOff className="h-6 w-6 inline-block text-zinc-400" />}
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 group-hover:text-zinc-600 transition-colors">
              <TrendingUp className="h-3 w-3" /> Balanço acumulado
            </p>
          </CardContent>
        </Card>
        
        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 group-hover:text-emerald-600 transition-colors">Receitas do Mês</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
              {isVisible ? formatCurrency(data.summary.receitasConsolidado) : <EyeOff className="h-6 w-6 inline-block text-zinc-400" />}
            </div>
            <p className="text-xs text-zinc-400 mt-1 group-hover:text-zinc-600 transition-colors">Previsto: {formatCurrency(data.summary.receitas)}</p>
            
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                <span className="text-emerald-600">Consolidado</span>
                <span className="text-zinc-400">{Math.round((data.summary.receitasConsolidado / data.summary.receitas) * 100 || 0)}%</span>
              </div>
              <Progress value={(data.summary.receitasConsolidado / data.summary.receitas) * 100} className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-500" />
              
              <div className="flex flex-col gap-1.5 pt-1">
                {data.summary.atrasosReceita > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-600 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-[11px] font-medium">Atrasos: {formatCurrency(data.summary.atrasosReceita)}</span>
                  </div>
                )}
                {data.summary.quebraCaixa > 0 && (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[11px] font-medium">Quebra de Caixa: {formatCurrency(data.summary.quebraCaixa)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 bg-white border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 group-hover:text-destructive transition-colors">Despesas do Mês</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive group-hover:brightness-110 transition-all">
              {isVisible ? formatCurrency(data.summary.despesasConsolidado) : <EyeOff className="h-6 w-6 inline-block text-zinc-400" />}
            </div>
            <p className="text-xs text-zinc-400 mt-1 group-hover:text-zinc-600 transition-colors">Previsto: {formatCurrency(data.summary.despesas)}</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                <span className="text-destructive">Consolidado</span>
                <span className="text-zinc-400">{Math.round((data.summary.despesasConsolidado / data.summary.despesas) * 100 || 0)}%</span>
              </div>
              <Progress value={(data.summary.despesasConsolidado / data.summary.despesas) * 100} className="h-1.5 bg-red-100 [&>div]:bg-destructive" />
              
              <div className="flex flex-col gap-1.5 pt-1">
                {data.summary.atrasosDespesa > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-600 animate-pulse">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-[11px] font-medium">Atrasos: {formatCurrency(data.summary.atrasosDespesa)}</span>
                  </div>
                )}
                {data.summary.imprevistos > 0 && (
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span className="text-[11px] font-medium">Imprevistos: {formatCurrency(data.summary.imprevistos)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="group col-span-4 shadow-sm border-zinc-200 bg-white hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="group-hover:text-primary transition-colors">Visão Geral (6 Meses)</CardTitle>
            <CardDescription className="group-hover:text-zinc-600 transition-colors">Comparativo de Receitas vs Despesas</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data.chartData} 
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#71717a' }}
                />
                <YAxis 
                  stroke="#a1a1aa" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => isVisible ? `R$${value}` : "----"}
                  tick={{ fill: '#71717a' }}
                />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.95)", 
                    backdropFilter: "blur(12px)",
                    border: "1px solid #e4e4e7", 
                    borderRadius: "12px", 
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    color: "#18181b" 
                  }}
                  itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                  formatter={(value: any) => isVisible ? formatCurrency(Number(value)) : "----"}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar 
                  dataKey="receita" 
                  fill="#0070f3" 
                  radius={[6, 6, 0, 0]} 
                  name="Receita" 
                  barSize={28}
                  activeBar={{ 
                    fill: '#0070f3',
                    stroke: '#005cc5', 
                    strokeWidth: 2,
                    filter: 'drop-shadow(0px 0px 8px rgba(0, 112, 243, 0.4))'
                  }}
                />
                <Bar 
                  dataKey="despesa" 
                  fill="#ef4444" 
                  radius={[6, 6, 0, 0]} 
                  name="Despesa" 
                  barSize={28}
                  activeBar={{ 
                    fill: '#ef4444',
                    stroke: '#dc2626', 
                    strokeWidth: 2,
                    filter: 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.4))'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card className="group shadow-sm border-zinc-200 bg-white hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="group-hover:text-primary transition-colors">Movimentações Recentes</CardTitle>
                <CardDescription className="group-hover:text-zinc-600 transition-colors">Últimos 5 registros</CardDescription>
              </div>
              <Receipt className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between group/item">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full transition-colors ${t.type === "Receita" ? "bg-emerald-50 group-hover/item:bg-emerald-100" : "bg-red-50 group-hover/item:bg-red-100"}`}>
                          {t.type === "Receita" ? <Landmark className="h-4 w-4 text-emerald-500" /> : <Receipt className="h-4 w-4 text-destructive" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium leading-none text-zinc-900 group-hover/item:text-primary transition-colors">{t.descricao}</p>
                          <p className="text-xs text-zinc-500 mt-1">{format(new Date(t.data), "dd 'de' MMM", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className={`text-sm font-bold transition-colors ${t.type === "Receita" ? "text-emerald-500 group-hover/item:text-emerald-600" : "text-destructive group-hover/item:text-red-600"}`}>
                        {isVisible ? `${t.type === "Receita" ? "+" : "-"} ${formatCurrency(t.valor)}` : <EyeOff className="h-4 w-4 inline-block text-zinc-400" />}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center text-zinc-400 py-8">Nenhuma transação recente encontrada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {isAdmin && data.userStats && (
            <Card className="group shadow-sm border-2 border-primary/10 bg-white hover:border-primary/30 transition-all duration-300 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg text-zinc-900 group-hover:text-primary transition-colors">Gestão de Usuários</CardTitle>
                  <CardDescription className="group-hover:text-zinc-600 transition-colors">Estatísticas do sistema</CardDescription>
                </div>
                <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 group-hover:bg-primary/5 transition-colors">
                    <span className="text-2xl font-bold text-zinc-900">{data.userStats.totalUsers}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Cadastrados</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors relative overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-emerald-600">{data.userStats.onlineUsers}</span>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">Online Agora</span>
                  </div>
                </div>
                <Link 
                  href="/admin/users" 
                  className={cn(buttonVariants({ variant: "link" }), "w-full text-xs h-auto p-0 mt-4 text-primary hover:text-primary/80")}
                >
                  Ir para gestão completa →
                </Link>
                <Link 
                  href="/admin/settings" 
                  className={cn(buttonVariants({ variant: "link" }), "w-full text-xs h-auto p-0 mt-2 text-zinc-500 hover:text-primary")}
                >
                  Configurações do Sistema →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
