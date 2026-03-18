"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useVisibility } from "@/components/providers/VisibilityProvider";

const COLORS = ["#0070f3", "#10b981", "#FFBB28", "#FF8042"];

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ barData: any[], pieData: any[] }>({ barData: [], pieData: [] });
  const { isVisible } = useVisibility();

  useEffect(() => {
    async function fetchReports() {
      try {
        const [resReceitas, resDespesas] = await Promise.all([
          fetch("/api/receitas"),
          fetch("/api/despesas")
        ]);

        const receitas = await resReceitas.json();
        const despesas = await resDespesas.json();

        // Process Bar Chart (last 6 months)
        interface MonthlyData {
          name: string;
          month: number;
          year: number;
          receitas: number;
          despesas: number;
        }
        const last6Months: MonthlyData[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthName = d.toLocaleString("pt-BR", { month: "short" });
          last6Months.push({
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            month: d.getMonth(),
            year: d.getFullYear(),
            receitas: 0,
            despesas: 0
          });
        }

        receitas.forEach((r: any) => {
          const date = new Date(r.dataRecebimento);
          const monthData = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
          if (monthData) monthData.receitas += r.valor;
        });

        despesas.forEach((d: any) => {
          const date = new Date(d.dataVencimento);
          const monthData = last6Months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
          if (monthData) monthData.despesas += d.valor;
        });

        // Process Pie Chart (Expenses by Category - current month)
        const now = new Date();
        const currentMonthDespesas = despesas.filter((d: any) => {
          const date = new Date(d.dataVencimento);
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const categoriesMap: Record<string, number> = {};
        currentMonthDespesas.forEach((d: any) => {
          categoriesMap[d.categoria] = (categoriesMap[d.categoria] || 0) + d.valor;
        });

        const pieData = Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));

        setData({ barData: last6Months, pieData });
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[450px]" />
          <Skeleton className="col-span-3 h-[450px]" />
        </div>
      </div>
    );
  }

  const hasData = data.barData.some(m => m.receitas > 0 || m.despesas > 0) || data.pieData.length > 0;

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
           <p className="text-zinc-500">Analise suas finanças com gráficos detalhados e interativos.</p>
        </div>
      </div>
      
      {!hasData ? (
        <Card className="flex h-[400px] flex-col items-center justify-center p-8 text-center bg-white border-zinc-200">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-zinc-50 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-10 w-10 text-zinc-400"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">Nenhum dado disponível</h3>
            <p className="mb-4 mt-2 text-sm text-zinc-500">
              Você ainda não tem transações suficientes para gerar relatórios detalhados. Comece adicionando suas receitas e despesas.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="group col-span-4 shadow-sm border-zinc-200 bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Receitas vs Despesas</CardTitle>
              <CardDescription className="group-hover:text-zinc-600 transition-colors">
                Balanço financeiro dos últimos 6 meses.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={8}>
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
                    cursor={{ fill: 'rgba(0,0,0,0.02)', radius: 8 }}
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)", 
                      backdropFilter: "blur(12px)",
                      border: "1px solid #e4e4e7", 
                      borderRadius: "12px", 
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                      color: "#18181b" 
                    }}
                    itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                    formatter={(value: any) => isVisible ? formatCurrency(Number(value)) : "----"} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar 
                    dataKey="receitas" 
                    name="Receitas" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                    activeBar={{ 
                      fill: '#059669',
                      stroke: '#10b981', 
                      strokeWidth: 1,
                      filter: 'drop-shadow(0px 0px 8px rgba(16, 185, 129, 0.4))'
                    }}
                  />
                  <Bar 
                    dataKey="despesas" 
                    name="Despesas" 
                    fill="#ef4444" 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                    activeBar={{ 
                      fill: '#dc2626',
                      stroke: '#ef4444', 
                      strokeWidth: 1,
                      filter: 'drop-shadow(0px 0px 8px rgba(239, 68, 68, 0.4))'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="group col-span-3 shadow-sm border-zinc-200 bg-white hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="group-hover:text-primary transition-colors">Despesas por Categoria</CardTitle>
              <CardDescription className="group-hover:text-zinc-600 transition-colors">
                Distribuição no mês atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.pieData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        style={{ outline: 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.95)", 
                      backdropFilter: "blur(12px)",
                      border: "1px solid #e4e4e7", 
                      borderRadius: "12px",
                      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
                    }}
                    itemStyle={{ fontSize: "12px", fontWeight: "600" }}
                    formatter={(value: any) => isVisible ? formatCurrency(Number(value)) : "----"} 
                  />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
