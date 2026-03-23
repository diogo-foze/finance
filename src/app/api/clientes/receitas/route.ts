import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Receita from "@/models/Receita";
import Cliente from "@/models/Cliente";
import ReceitaCliente from "@/models/ReceitaCliente";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");

    if (!clienteId) {
      return NextResponse.json({ error: "ID do cliente ausente" }, { status: 400 });
    }

    await connectToDatabase();

    // Buscar todos os IDs de receitas vinculadas a este cliente
    const links = await ReceitaCliente.find({ 
      userId: session.user.id,
      clienteId: clienteId 
    }).select("receitaId");

    const receitaIds = links.map(l => l.receitaId);

    // Buscar as receitas correspondentes (apenas Planejado como solicitado)
    const receitas = await Receita.find({
      _id: { $in: receitaIds },
      userId: session.user.id,
      status: "Planejado"
    }).sort({ dataRecebimento: -1 }).lean();

    // Buscar os dados do cliente para anexar (população manual)
    const result = receitas.map(r => ({
      ...r,
      clienteId: { _id: clienteId, nome: "" } // O nome será carregado pelo TransactionForm se necessário, ou podemos buscar aqui
    }));

    // Para pegar o nome também e ficar 100% preenchido:
    const cliente = await Cliente.findById(clienteId).select("nome cpf");
    
    const finalResult = receitas.map(r => ({
      ...r,
      clienteId: cliente ? { _id: cliente._id, nome: cliente.nome, cpf: cliente.cpf } : undefined
    }));

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Erro ao buscar receitas do cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
