import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Despesa from "@/models/Despesa";

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
      query.dataVencimento = {};
      if (startDate) query.dataVencimento.$gte = new Date(startDate);
      if (endDate) query.dataVencimento.$lte = new Date(endDate);
    }

    const despesas = await Despesa.find(query).sort({ dataVencimento: -1 });

    return NextResponse.json(despesas);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
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
    const novaDespesa = await Despesa.create({
      userId: session.user.id,
      descricao,
      valor: Number(valor.toString().replace(/\./g, "").replace(",", ".")),
      dataVencimento: new Date(data),
      categoria,
      tipoMovimentacao,
    });

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json(novaDespesa, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
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

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json(updatedDespesa);
  } catch (error) {
    console.error("Erro ao atualizar despesa:", error);
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
    const deletedDespesa = await Despesa.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!deletedDespesa) {
      return NextResponse.json({ error: "Despesa não encontrada ou não autorizada" }, { status: 404 });
    }

    if ((global as any).io) {
      (global as any).io.emit("data_updated", { userId: session.user.id });
    }

    return NextResponse.json({ message: "Despesa excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir despesa:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
