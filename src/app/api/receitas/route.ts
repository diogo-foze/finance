import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Receita from "@/models/Receita";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await connectToDatabase();
    const receitas = await Receita.find({ userId: session.user.id }).sort({ dataRecebimento: -1 });

    return NextResponse.json(receitas);
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
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
    const novaReceita = await Receita.create({
      userId: session.user.id,
      descricao,
      valor: Number(valor.toString().replace(/\./g, "").replace(",", ".")),
      dataRecebimento: new Date(data),
      categoria,
      tipoMovimentacao,
    });

    return NextResponse.json(novaReceita, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar receita:", error);
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
    const updatedReceita = await Receita.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        descricao,
        valor: typeof valor === 'string' ? Number(valor.replace(/\./g, "").replace(",", ".")) : valor,
        dataRecebimento: new Date(data),
        categoria,
        tipoMovimentacao,
      },
      { new: true }
    );

    if (!updatedReceita) {
      return NextResponse.json({ error: "Receita não encontrada ou não autorizada" }, { status: 404 });
    }

    return NextResponse.json(updatedReceita);
  } catch (error) {
    console.error("Erro ao atualizar receita:", error);
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
    const deletedReceita = await Receita.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!deletedReceita) {
      return NextResponse.json({ error: "Receita não encontrada ou não autorizada" }, { status: 404 });
    }

    return NextResponse.json({ message: "Receita excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir receita:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
