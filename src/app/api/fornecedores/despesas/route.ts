import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Despesa from "@/models/Despesa";
import DespesaFornecedor from "@/models/DespesaFornecedor";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("id");

    if (!supplierId) {
      return NextResponse.json({ error: "ID do fornecedor ausente" }, { status: 400 });
    }

    await connectToDatabase();

    // Buscar todos os vínculos para este fornecedor
    const links = await DespesaFornecedor.find({
      userId: session.user.id,
      fornecedorId: new mongoose.Types.ObjectId(supplierId)
    });

    const despesaIds = links.map(l => l.despesaId);

    // Buscar as despesas correspondentes
    const despesas = await Despesa.find({
      _id: { $in: despesaIds },
      userId: session.user.id,
      status: "Planejado"
    }).sort({ dataVencimento: -1 });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error("Erro ao buscar despesas do fornecedor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
