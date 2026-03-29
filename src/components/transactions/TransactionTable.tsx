"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useVisibility } from "@/components/providers/VisibilityProvider"
import { EyeOff, Search, ChevronLeft, ChevronRight, Calendar, CheckCircle2, AlertCircle, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils";

export interface Transaction {
  _id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipoMovimentacao: "Fixo" | "Variável";
  status: "Planejado" | "Consolidado";
  valorConsolidado?: number;
  dataConsolidacao?: string;
  clienteId?: string | { _id: string; nome: string; cpf: string };
}

interface TransactionTableProps {
  transactions: Transaction[];
  type: "Receita" | "Despesa";
  onRowClick?: (transaction: Transaction) => void;
  onConsolidate?: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, type, onRowClick, onConsolidate }: TransactionTableProps) {
  const { isVisible } = useVisibility();

  // Estados de Filtro
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("Todos os Movimentos");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Estados de Paginação
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('pt-BR');
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // 1. Filtro de Texto (Descrição ou Categoria)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.descricao.toLowerCase().includes(lowerQuery) || 
        t.categoria.toLowerCase().includes(lowerQuery) ||
        (t.clienteId && typeof t.clienteId === 'object' && t.clienteId.nome.toLowerCase().includes(lowerQuery))
      );
    }

    // 2. Filtro de Período (Extrato)
    if (periodFilter !== "Todos os Movimentos" && filtered.length > 0) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      let startDate = new Date(0); // 1970
      let endDate = new Date("2100-01-01");

      if (periodFilter === "Mês Atual") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (periodFilter === "Últimos 3 Meses") {
        startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      } else if (periodFilter === "Este Ano") {
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (periodFilter === "Personalizado (Entre datas)") {
        if (customStartDate) {
          startDate = new Date(customStartDate);
          startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
          startDate.setHours(0, 0, 0, 0);
        }
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
          endDate.setHours(23, 59, 59, 999);
        }
      }

      filtered = filtered.filter(t => {
        const tDate = new Date(t.data);
        tDate.setMinutes(tDate.getMinutes() + tDate.getTimezoneOffset());
        return tDate.getTime() >= startDate.getTime() && tDate.getTime() <= endDate.getTime();
      });
    }

    // Reset page to 1 if filter changes reduces total pages below current page
    return filtered;
  }, [transactions, searchQuery, periodFilter, customStartDate, customEndDate]);

  // Aplica a paginação na lista filtrada
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Garante que a página atual não exceda o total
  const safeCurrentPage = Math.min(currentPage, totalPages);
  if (safeCurrentPage !== currentPage) {
    setCurrentPage(safeCurrentPage); // Atualiza num próximo ciclo
  }

  const paginatedTransactions = filteredTransactions.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Área de Filtros (Toolbar) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-end bg-card p-4 rounded-md border shadow-sm">
        
        <div className="flex flex-col gap-1.5 w-full sm:w-1/3">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Search className="w-3 h-3" /> Busca
          </label>
          <Input 
            placeholder="Buscar por descrição, categoria ou cliente..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full sm:w-1/4">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Período do Extrato
          </label>
          <Select value={periodFilter} onValueChange={(val) => setPeriodFilter(val || "Todos os Movimentos")}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os períodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos os Movimentos">Todos os Movimentos</SelectItem>
              <SelectItem value="Mês Atual">Mês Atual</SelectItem>
              <SelectItem value="Últimos 3 Meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="Este Ano">Este Ano</SelectItem>
              <SelectItem value="Personalizado (Entre datas)">Personalizado (Entre datas)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodFilter === "Personalizado (Entre datas)" && (
          <div className="flex flex-row gap-2 w-full sm:w-auto animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col gap-1.5 w-1/2 sm:w-auto">
              <label className="text-xs font-semibold text-muted-foreground">Data Inicial</label>
              <Input 
                type="date" 
                value={customStartDate} 
                onChange={(e) => setCustomStartDate(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-1.5 w-1/2 sm:w-auto">
              <label className="text-xs font-semibold text-muted-foreground">Data Final</label>
              <Input 
                type="date" 
                value={customEndDate} 
                onChange={(e) => setCustomEndDate(e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-md border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Movimentação</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground flex-col items-center justify-center">
                  <span className="block mb-1 text-base">Nenhuma movimentação encontrada.</span>
                  <span className="block text-xs font-normal opacity-70">Tente ajustar seus filtros.</span>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow 
                  key={transaction._id}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                  onClick={() => onRowClick && onRowClick(transaction)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{transaction.descricao}</span>
                      {transaction.clienteId && typeof transaction.clienteId === 'object' && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          Cliente: {transaction.clienteId.nome}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{transaction.categoria}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={transaction.tipoMovimentacao === "Fixo" ? "bg-accent" : ""}>
                      {transaction.tipoMovimentacao}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.data)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "gap-1",
                        transaction.status === "Consolidado" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {transaction.status === "Consolidado" ? <DollarSign className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${type === "Receita" ? "text-emerald-500" : "text-destructive"}`}>
                    <div className="flex flex-col items-end">
                      <span>{isVisible ? `${type === "Receita" ? "+" : "-"} ${formatCurrency(transaction.valor)}` : <EyeOff className="h-4 w-4 inline-block text-zinc-400" />}</span>
                      {transaction.status === "Consolidado" && transaction.valorConsolidado !== undefined && (
                        <span className="text-[10px] text-muted-foreground italic">
                          Consol: {formatCurrency(transaction.valorConsolidado)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.status === "Planejado" && (
                       <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onConsolidate) onConsolidate(transaction);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé - Paginação */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2 border-t mt-4">
        
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground font-medium">Itens por página</p>
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(val) => {
              setItemsPerPage(Number(val || "20"));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[20, 50, 100].map(size => (
                <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
            Pág {safeCurrentPage} de {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
            >
              <span className="sr-only">Primeira página</span>
              <ChevronLeft className="h-4 w-4" />
              <ChevronLeft className="h-4 w-4 -ml-2" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
            >
              <span className="sr-only">Página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
            >
              <span className="sr-only">Próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
            >
              <span className="sr-only">Última página</span>
              <ChevronRight className="h-4 w-4" />
              <ChevronRight className="h-4 w-4 -ml-2" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
