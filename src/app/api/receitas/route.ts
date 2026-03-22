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

    const body = await request.json();
    const { descricao, valor, data, categoria, tipoMovimentacao, status, valorConsolidado, dataConsolidacao } = body;

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
      status: status || "Planejado",
      valorConsolidado: (valorConsolidado !== undefined && valorConsolidado !== null && valorConsolidado !== "") 
        ? Number(valorConsolidado.toString().replace(/\./g, "").replace(",", ".")) 
        : undefined,
      dataConsolidacao: dataConsolidacao ? new Date(dataConsolidacao) : undefined,
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

    const body = await request.json();
    const { id, descricao, valor, data, categoria, tipoMovimentacao, status, valorConsolidado, dataConsolidacao } = body;

    if (!id || !descricao || !valor || !data || !categoria || !tipoMovimentacao) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Fetch original to check for partial consolidation
    const originalReceita = await Receita.findOne({ _id: id, userId: session.user.id });
    if (!originalReceita) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 });
    }

    const numericValor = typeof valor === 'string' ? Number(valor.replace(/\./g, "").replace(",", ".")) : valor;
    const numericValorConsolidado = (valorConsolidado !== undefined && valorConsolidado !== null && valorConsolidado !== "") 
      ? Number(valorConsolidado.toString().replace(/\./g, "").replace(",", ".")) 
      : undefined;

    // Use the consolidated value as the new 'valor' (planned) if we're splitting,
    // to avoid double-counting with the remainder transaction.
    const finalValor = (status === "Consolidado" && originalReceita.status === "Planejado" && numericValorConsolidado && numericValorConsolidado < originalReceita.valor)
      ? numericValorConsolidado
      : numericValor;

    const updatedReceita = await Receita.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        descricao,
        valor: finalValor,
        dataRecebimento: new Date(data),
        categoria,
        tipoMovimentacao,
        status,
        valorConsolidado: numericValorConsolidado,
        dataConsolidacao: dataConsolidacao ? new Date(dataConsolidacao) : undefined,
      },
      { new: true }
    );

    // Partial Consolidation Logic
    // Only trigger if we are moving from Planejado to Consolidado and there's a shortfall
    if (status === "Consolidado" && originalReceita.status === "Planejado" && numericValorConsolidado && numericValorConsolidado < originalReceita.valor) {
      const { parcelarRestante, numeroParcelas } = body;
      const diff = originalReceita.valor - numericValorConsolidado;

      if (parcelarRestante && numeroParcelas > 0) {
        const valorParcela = diff / numeroParcelas;
        const baseDate = new Date(originalReceita.dataRecebimento);
        
        for (let i = 1; i <= numeroParcelas; i++) {
          const parcelDate = new Date(baseDate);
          parcelDate.setMonth(parcelDate.getMonth() + i);
          
          await Receita.create({
            userId: session.user.id,
            descricao: `${descricao} (Parc ${i}/${numeroParcelas})`,
            valor: valorParcela,
            dataRecebimento: parcelDate,
            categoria,
            tipoMovimentacao,
            status: "Planejado"
          });
        }
      } else {
        // Just leave the remainder open
        await Receita.create({
          userId: session.user.id,
          descricao: `${descricao} (Restante)`,
          valor: diff,
          dataRecebimento: new Date(originalReceita.dataRecebimento),
          categoria,
          tipoMovimentacao,
          status: "Planejado"
        });
      }
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
