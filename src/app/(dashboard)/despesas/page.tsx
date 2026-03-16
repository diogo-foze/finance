import { TransactionTable, Transaction } from "@/components/transactions/TransactionTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Despesa from "@/models/Despesa";

async function getDespesas(): Promise<Transaction[]> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return [];
  }

  await connectToDatabase();
  const data = await Despesa.find({ userId: session.user.id }).sort({ dataVencimento: -1 });
  
  return data.map(item => ({
    _id: item._id.toString(),
    descricao: item.descricao,
    valor: item.valor,
    data: item.dataVencimento.toISOString(),
    categoria: item.categoria,
    tipoMovimentacao: item.tipoMovimentacao
  }));
}

export default async function DespesasPage() {
  const despesas = await getDespesas();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Despesas</h2>
           <p className="text-muted-foreground">Gerencie suas saídas financeiras.</p>
        </div>
        <div className="flex items-center space-x-2">
          <TransactionForm type="Despesa" />
        </div>
      </div>
      
      <TransactionTable transactions={despesas} type="Despesa" />
    </div>
  );
}
