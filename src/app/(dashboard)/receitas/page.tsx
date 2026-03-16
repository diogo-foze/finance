import { TransactionTable, Transaction } from "@/components/transactions/TransactionTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Receita from "@/models/Receita";

async function getReceitas(): Promise<Transaction[]> {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return [];
  }

  await connectToDatabase();
  const data = await Receita.find({ userId: session.user.id }).sort({ dataRecebimento: -1 });
  
  return data.map(item => ({
    _id: item._id.toString(),
    descricao: item.descricao,
    valor: item.valor,
    data: item.dataRecebimento.toISOString(),
    categoria: item.categoria,
    tipoMovimentacao: item.tipoMovimentacao
  }));
}

export default async function ReceitasPage() {
  const receitas = await getReceitas();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Receitas</h2>
           <p className="text-muted-foreground">Gerencie suas entradas financeiras.</p>
        </div>
        <div className="flex items-center space-x-2">
          <TransactionForm type="Receita" />
        </div>
      </div>
      
      <TransactionTable transactions={receitas} type="Receita" />
    </div>
  );
}
