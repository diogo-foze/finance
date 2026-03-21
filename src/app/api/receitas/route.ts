import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Receita from "@/models/Receita";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session || !session.user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    await connectToDatabase();
    
    let query: any = { userId: session.user.id };
    
    if (startDate || endDate) {
      query.dataRecebimento = {};
      if (startDate) query.dataRecebimento.$gte = new Date(startDate);
      if (endDate) query.dataRecebimento.$lte = new Date(endDate);
    }

    const receitas = await Receita.find(query).sort({ dataRecebimento: -1 });

    return NextResponse.json(receitas);
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session || !session.user) {
      return unauthorizedResponse();
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

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json(novaReceita, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar receita:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session || !session.user) {
      return unauthorizedResponse();
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

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json(updatedReceita);
  } catch (error) {
    console.error("Erro ao atualizar receita:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);

    if (!session || !session.user) {
      return unauthorizedResponse();
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

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json({ message: "Receita excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir receita:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
