import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Despesa from "@/models/Despesa";
import DespesaFornecedor from "@/models/DespesaFornecedor";
import Supplier from "@/models/Fornecedor";
import mongoose from "mongoose";

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

    const despesas = await Despesa.find(query).sort({ dataVencimento: -1 }).lean();

    // Manual population from link table
    const links = await DespesaFornecedor.find({
      userId: session.user.id,
      despesaId: { $in: despesas.map(d => d._id) }
    }).populate("fornecedorId", "nome cpf").lean();

    const result = despesas.map(d => {
      const despesaIdStr = d._id.toString();
      const link = links.find(l => l.despesaId.toString() === despesaIdStr);
      
      return {
        ...d,
        data: d.dataVencimento,
        fornecedorId: link ? link.fornecedorId : undefined
      };
    });

    return NextResponse.json(result);
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

    const body = await request.json();
    const { descricao, valor, data, categoria, tipoMovimentacao, status, valorConsolidado, dataConsolidacao, fornecedorId } = body;

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
      status: status || "Planejado",
      valorConsolidado: (valorConsolidado !== undefined && valorConsolidado !== null && valorConsolidado !== "") 
        ? Number(valorConsolidado.toString().replace(/\./g, "").replace(",", ".")) 
        : undefined,
      dataConsolidacao: dataConsolidacao ? new Date(dataConsolidacao) : undefined,
    });

    if (fornecedorId) {
      await DespesaFornecedor.create({
        userId: session.user.id,
        despesaId: novaDespesa._id,
        fornecedorId
      });
    }

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

    const body = await request.json();
    const { id, descricao, valor, data, categoria, tipoMovimentacao, status, valorConsolidado, dataConsolidacao, fornecedorId } = body;

    if (!id || !descricao || !valor || !data || !categoria || !tipoMovimentacao) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch original to check for partial consolidation
    const originalDespesa = await Despesa.findOne({ _id: id, userId: session.user.id });
    if (!originalDespesa) {
      return NextResponse.json({ error: "Despesa não encontrada" }, { status: 404 });
    }

    const numericValor = typeof valor === 'string' ? Number(valor.replace(/\./g, "").replace(",", ".")) : valor;
    const numericValorConsolidado = (valorConsolidado !== undefined && valorConsolidado !== null && valorConsolidado !== "") 
      ? Number(valorConsolidado.toString().replace(/\./g, "").replace(",", ".")) 
      : undefined;

    // Use the consolidated value as the new 'valor' (planned) if we're splitting,
    // to avoid double-counting with the remainder transaction.
    const finalValor = (status === "Consolidado" && originalDespesa.status === "Planejado" && numericValorConsolidado && numericValorConsolidado < originalDespesa.valor)
      ? numericValorConsolidado
      : numericValor;

    const updatedDespesa = await Despesa.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        descricao,
        valor: finalValor,
        dataVencimento: new Date(data),
        categoria,
        tipoMovimentacao,
        status,
        valorConsolidado: numericValorConsolidado,
        dataConsolidacao: dataConsolidacao ? new Date(dataConsolidacao) : undefined,
      },
      { returnDocument: 'after' }
    );

    // Update link
    if (fornecedorId) {
      await DespesaFornecedor.findOneAndUpdate(
        { userId: session.user.id, despesaId: id },
        { fornecedorId },
        { upsert: true }
      );
    } else {
      await DespesaFornecedor.findOneAndDelete({ userId: session.user.id, despesaId: id });
    }

    // Partial Consolidation Logic
    // Only trigger if we are moving from Planejado to Consolidado and there's a shortfall
    if (status === "Consolidado" && originalDespesa.status === "Planejado" && numericValorConsolidado && numericValorConsolidado < originalDespesa.valor) {
      const { parcelarRestante, numeroParcelas } = body;
      const diff = originalDespesa.valor - numericValorConsolidado;

      if (parcelarRestante && numeroParcelas > 0) {
        const valorParcela = diff / numeroParcelas;
        const baseDate = new Date(originalDespesa.dataVencimento);
        
        for (let i = 1; i <= numeroParcelas; i++) {
          const parcelDate = new Date(baseDate);
          parcelDate.setMonth(parcelDate.getMonth() + i);
          
          await Despesa.create({
            userId: session.user.id,
            descricao: `${descricao} (Parc ${i}/${numeroParcelas})`,
            valor: valorParcela,
            dataVencimento: parcelDate,
            categoria,
            tipoMovimentacao,
            status: "Planejado"
          });
        }
      } else {
        // Just leave the remainder open
        await Despesa.create({
          userId: session.user.id,
          descricao: `${descricao} (Restante)`,
          valor: diff,
          dataVencimento: new Date(originalDespesa.dataVencimento),
          categoria,
          tipoMovimentacao,
          status: "Planejado"
        });
      }
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
    
    // First delete links
    await DespesaFornecedor.findOneAndDelete({ despesaId: id, userId: session.user.id });
    
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
