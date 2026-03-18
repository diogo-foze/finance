import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useVisibility } from "@/components/providers/VisibilityProvider"
import { EyeOff } from "lucide-react"

export interface Transaction {
  _id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  tipoMovimentacao: "Fixo" | "Variável";
}

interface TransactionTableProps {
  transactions: Transaction[];
  type: "Receita" | "Despesa";
  onRowClick?: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, type, onRowClick }: TransactionTableProps) {
  const { isVisible } = useVisibility();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    // Handling timezone issues with ISO strings by appending T12:00:00 or creating from UTC is safer, but new Date(dateString) usually is ok if formatted as YYYY-MM-DD
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Fix off-by-one day issues
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Movimentação</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum dado disponível.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow 
                key={transaction._id}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                onClick={() => onRowClick && onRowClick(transaction)}
              >
                <TableCell className="font-medium">{transaction.descricao}</TableCell>
                <TableCell>{transaction.categoria}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={transaction.tipoMovimentacao === "Fixo" ? "bg-accent" : ""}>
                    {transaction.tipoMovimentacao}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(transaction.data)}</TableCell>
                <TableCell className={`text-right font-medium ${type === "Receita" ? "text-emerald-500" : "text-destructive"}`}>
                  {isVisible ? `${type === "Receita" ? "+" : "-"} ${formatCurrency(transaction.valor)}` : <EyeOff className="h-4 w-4 inline-block ml-auto text-zinc-400" />}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
