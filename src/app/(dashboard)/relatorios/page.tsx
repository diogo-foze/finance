"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, TrendingUp, TrendingDown, Wallet, Calendar, Filter, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useVisibility } from "@/components/providers/VisibilityProvider";
import { useSocket } from "@/components/providers/SocketProvider";
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#0070f3", "#10b981", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

type PeriodType = "this-month" | "last-month" | "last-3-months" | "last-6-months" | "last-12-months" | "this-year" | "custom";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("this-month");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [data, setData] = useState<{
    barData: any[],
    pieData: any[],
    lineData: any[],
    summary: { receitas: number, despesas: number, saldo: number }
  }>({
    barData: [],
    pieData: [],
    lineData: [],
    summary: { receitas: 0, despesas: 0, saldo: 0 }
  });

  const { isVisible } = useVisibility();
  const { socket } = useSocket();

  const fetchReports = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      let start = startDate;
      let end = endDate;

      const now = new Date();
      if (period === "this-month") {
        start = format(startOfMonth(now), "yyyy-MM-dd");
        end = format(endOfMonth(now), "yyyy-MM-dd");
      } else if (period === "last-month") {
        const lastMonth = subMonths(now, 1);
        start = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        end = format(endOfMonth(lastMonth), "yyyy-MM-dd");
      } else if (period === "last-3-months") {
        start = format(subMonths(now, 3), "yyyy-MM-dd");
        end = format(now, "yyyy-MM-dd");
      } else if (period === "last-6-months") {
        start = format(subMonths(now, 6), "yyyy-MM-dd");
        end = format(now, "yyyy-MM-dd");
      } else if (period === "last-12-months") {
        start = format(subMonths(now, 12), "yyyy-MM-dd");
        end = format(now, "yyyy-MM-dd");
      } else if (period === "this-year") {
        start = format(startOfYear(now), "yyyy-MM-dd");
        end = format(endOfYear(now), "yyyy-MM-dd");
      }

      const [resReceitas, resDespesas] = await Promise.all([
        fetch(`/api/receitas?startDate=${start}&endDate=${end}`),
        fetch(`/api/despesas?startDate=${start}&endDate=${end}`)
      ]);

      const receitas = await resReceitas.json();
      const despesas = await resDespesas.json();

      const totalReceitas = receitas.reduce((acc: number, r: any) => acc + r.valor, 0);
      const totalDespesas = despesas.reduce((acc: number, d: any) => acc + d.valor, 0);

      const monthlyMap: Record<string, { name: string, receitas: number, despesas: number, timestamp: number }> = {};

      const processItem = (item: any, type: 'receitas' | 'despesas') => {
        const date = new Date(item.dataRecebimento || item.dataVencimento);
        const key = format(date, "MMM/yy", { locale: ptBR });
        if (!monthlyMap[key]) {
          monthlyMap[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            receitas: 0,
            despesas: 0,
            timestamp: date.getTime()
          };
        }
        monthlyMap[key][type] += item.valor;
      };

      receitas.forEach((r: any) => processItem(r, 'receitas'));
      despesas.forEach((d: any) => processItem(d, 'despesas'));

      const barData = Object.values(monthlyMap).sort((a, b) => a.timestamp - b.timestamp);

      const categoriesMap: Record<string, number> = {};
      despesas.forEach((d: any) => {
        categoriesMap[d.categoria] = (categoriesMap[d.categoria] || 0) + d.valor;
      });
      const pieData = Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));

      const dailyMap: Record<string, { date: string, saldo: number, timestamp: number }> = {};

      const processDaily = (item: any, multiplier: number) => {
        const date = format(new Date(item.dataRecebimento || item.dataVencimento), "yyyy-MM-dd");
        if (!dailyMap[date]) {
          dailyMap[date] = { date: format(new Date(date), "dd/MM"), saldo: 0, timestamp: new Date(date).getTime() };
        }
        dailyMap[date].saldo += (item.valor * multiplier);
      };

      receitas.forEach((r: any) => processDaily(r, 1));
      despesas.forEach((d: any) => processDaily(d, -1));

      let runningBalance = 0;
      const lineData = Object.values(dailyMap)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(day => {
          runningBalance += day.saldo;
          return { ...day, acumulado: runningBalance };
        });

      setData({
        barData,
        pieData,
        lineData,
        summary: { receitas: totalReceitas, despesas: totalDespesas, saldo: totalReceitas - totalDespesas }
      });
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real-time updates via Socket
  useEffect(() => {
    if (socket) {
      socket.on("data_updated", () => {
        console.log("Dados atualizados em tempo real, recarregando dashboard...");
        fetchReports(true); // Silent refresh
      });
      return () => {
        socket.off("data_updated");
      };
    }
  }, [socket, fetchReports]);

  const getPeriodLabel = (p: PeriodType) => {
    switch (p) {
      case "this-month": return "Este Mês";
      case "last-month": return "Mês Passado";
      case "last-3-months": return "Últimos 3 Meses";
      case "last-6-months": return "Últimos 6 Meses";
      case "last-12-months": return "Últimos 12 Meses";
      case "this-year": return "Este Ano";
      case "custom": return "Personalizado";
      default: return "Período";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      let periodLabel = getPeriodLabel(period);
      if (period === "custom") {
        periodLabel = `${format(new Date(startDate), "dd/MM/yyyy")} a ${format(new Date(endDate), "dd/MM/yyyy")}`;
      } else if (period === "this-month" || period === "last-month") {
        const date = period === "this-month" ? new Date() : subMonths(new Date(), 1);
        const monthName = format(date, "MMMM", { locale: ptBR });
        periodLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${format(date, "yyyy")}`;
      }

      const res = await fetch("/api/relatorios/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: periodLabel,
          totalReceitas: data.summary.receitas,
          totalDespesas: data.summary.despesas,
          saldo: data.summary.saldo
        })
      });

      if (!res.ok) throw new Error("Erro ao enviar e-mail.");
      toast.success("Relatório enviado com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const hasData = data.summary.receitas > 0 || data.summary.despesas > 0;

  return (
    <div className="flex-1 space-y-6 pb-10">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Relatório Financeiro</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Análise de desempenho e saúde financeira em tempo real.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 no-print">
          <Select value={period} onValueChange={(val: any) => val && setPeriod(val as PeriodType)}>
            <SelectTrigger className="w-[180px] border-none bg-transparent focus:ring-0 font-medium">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              <SelectValue>{getPeriodLabel(period)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Este Mês</SelectItem>
              <SelectItem value="last-month">Mês Passado</SelectItem>
              <SelectItem value="last-3-months">Últimos 3 Meses</SelectItem>
              <SelectItem value="last-6-months">Últimos 6 Meses</SelectItem>
              <SelectItem value="last-12-months">Últimos 12 Meses</SelectItem>
              <SelectItem value="this-year">Este Ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2 px-2 border-l border-zinc-200 dark:border-zinc-800">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-32 border-none bg-transparent text-xs focus-visible:ring-0"
              />
              <span className="text-zinc-400">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-32 border-none bg-transparent text-xs focus-visible:ring-0"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchReports()}
            disabled={loading}
            className="rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Filter className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-12 h-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-100/80 font-medium font-sans">Total de Receitas</CardDescription>
            <CardTitle className="text-3xl font-bold">{isVisible ? formatCurrency(data.summary.receitas) : "----"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-emerald-100 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
              Ganhos acumulados no período
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-rose-500 text-white shadow-lg shadow-rose-500/20 group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <TrendingDown className="w-12 h-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-rose-100/80 font-medium font-sans">Total de Despesas</CardDescription>
            <CardTitle className="text-3xl font-bold">{isVisible ? formatCurrency(data.summary.despesas) : "----"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-rose-100 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
              Gastos realizados no período
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 group hover:scale-[1.01] transition-transform duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
            <Wallet className="w-12 h-12" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-medium font-sans">Saldo Líquido</CardDescription>
            <CardTitle className={`text-3xl font-bold ${data.summary.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isVisible ? formatCurrency(data.summary.saldo) : "----"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-zinc-500 flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" />
              Resultado final do balanço
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[400px] col-span-2 rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
          <Skeleton className="h-[300px] col-span-3 rounded-3xl" />
        </div>
      ) : !hasData ? (
        <Card className="flex h-[450px] flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900 border-dashed border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl">
          <div className="p-6 rounded-full bg-zinc-50 dark:bg-zinc-800 mb-6">
            <Filter className="w-12 h-12 text-zinc-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Sem dados para este período</h3>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mt-2">
            Não encontramos transações registradas no intervalo selecionado. Tente mudar o filtro ou adicione novos registros.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6 items-start">
          {/* Gráfico de Barras - Comparativo Mensal */}
          <Card className="lg:col-span-4 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Entradas vs Saídas</CardTitle>
                <CardDescription>Balanço comparativo mensal</CardDescription>
              </div>
              <Button variant="outline" size="icon" className="rounded-xl no-print" onClick={handleSendEmail} disabled={emailLoading}>
                {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      tickFormatter={(val) => isVisible ? `R$${val > 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : '---'}
                    />
                    <Tooltip
                      cursor={{ fill: '#f4f4f5', radius: 10 }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(val) => isVisible ? formatCurrency(Number(val)) : '----'}
                    />
                    <Legend iconType="circle" verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                    <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                    <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Pizza - Categorias */}
          <Card className="lg:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-xl">Gastos por Categoria</CardTitle>
              <CardDescription>Distribuição proporcional das despesas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.pieData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                      formatter={(val) => isVisible ? formatCurrency(Number(val)) : '----'}
                    />
                    <Legend iconType="circle" verticalAlign="bottom" align="center" layout="horizontal" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Linha - Evolução do Saldo */}
          <Card className="lg:col-span-6 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl">Evolução do Patrimônio</CardTitle>
                <CardDescription>Tendência de saldo acumulado ao longo do tempo</CardDescription>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full no-print">
                <TrendingUp className="w-3 h-3" />
                Sincronização Ativa
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0070f3" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0070f3" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 10 }}
                      tickFormatter={(val) => isVisible ? `R$${val}` : '---'}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                      formatter={(val) => isVisible ? formatCurrency(Number(val)) : '----'}
                    />
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      name="Saldo Acumulado"
                      stroke="#0070f3"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAcumulado)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer Info & Export */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 px-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl no-print">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Integridade Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Tempo Real Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>Relatórios Auditáveis</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            disabled
          >
            Análise Avançada Protegida
          </Button>
        </div>
      </div>
    </div>
  );
}

