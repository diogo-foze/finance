import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Despesa from "@/models/Despesa";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectToDatabase();
    const despesas = await Despesa.find({ userId: session.user.id }).sort({ dataVencimento: -1 });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { descricao, valor, data, categoria, tipoMovimentacao } = await request.json();

    if (!descricao || !valor || !data || !categoria || !tipoMovimentacao) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();
    const novaDespesa = await Despesa.create({
      userId: session.user.id,
      descricao,
      valor: Number(valor.toString().replace(/\./g, "").replace(",", ".")),
      dataVencimento: new Date(data),
      categoria,
      tipoMovimentacao,
    });

    return NextResponse.json(novaDespesa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id, descricao, valor, data, categoria, tipoMovimentacao } = await request.json();

    if (!id || !descricao || !valor || !data || !categoria || !tipoMovimentacao) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();
    const updatedDespesa = await Despesa.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        descricao,
        valor: typeof valor === 'string' ? Number(valor.replace(/\./g, "").replace(",", ".")) : valor,
        dataVencimento: new Date(data),
        categoria,
        tipoMovimentacao,
      },
      { new: true }
    );

    if (!updatedDespesa) {
      return NextResponse.json({ error: "Despesa não encontrada ou não autorizada" }, { status: 404 });
    }

    return NextResponse.json(updatedDespesa);
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID ausente" }, { status: 400 });
    }

    await connectToDatabase();
    const deletedDespesa = await Despesa.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!deletedDespesa) {
      return NextResponse.json({ error: "Despesa não encontrada ou não autorizada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Despesa excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
