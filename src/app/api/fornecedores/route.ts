import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Fornecedor from "@/models/Fornecedor";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    const matchQuery: any = {
      userId: new mongoose.Types.ObjectId(session.user.id),
    };

    if (!showAll) {
      matchQuery.ativo = { $ne: 0 };
    }

    // Agregação para buscar fornecedores com crédito utilizado (soma de despesas planejadas)
    const suppliers = await Fornecedor.aggregate([
      { $match: matchQuery },
      { $sort: { nome: 1 } },
      {
        $lookup: {
          from: "despesafornecedors", // MongoDB collection name for DespesaFornecedor
          localField: "_id",
          foreignField: "fornecedorId",
          as: "links"
        }
      },
      {
        $lookup: {
          from: "despesas",
          let: { despesaIds: "$links.despesaId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ["$_id", "$$despesaIds"] },
                    { $eq: ["$status", "Planejado"] }
                  ]
                }
              }
            }
          ],
          as: "plannedExpenses"
        }
      },
      {
        $addFields: {
          creditoUtilizado: { $sum: "$plannedExpenses.valor" }
        }
      },
      {
        $project: {
          links: 0,
          plannedExpenses: 0
        }
      }
    ]);

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const body = await request.json();
    const { nome, cpf, email, telefone, limiteCredito, ativo } = body;

    if (!nome || !cpf || !telefone) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    await connectToDatabase();

    const existingFornecedor = await Fornecedor.findOne({ userId: session.user.id, cpf: cleanCpf });
    if (existingFornecedor) {
      return NextResponse.json({ error: "Você já possui um fornecedor cadastrado com este CPF/CNPJ" }, { status: 400 });
    }

    const novoFornecedor = new Fornecedor({
      userId: session.user.id,
      nome,
      cpf: cleanCpf,
      email,
      telefone,
      limiteCredito: Number(limiteCredito) || 0,
      ativo: (ativo === 0 || ativo === "0") ? 0 : 1,
    });

    await novoFornecedor.save();

    return NextResponse.json(novoFornecedor, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const body = await request.json();
    const { id, nome, cpf, email, telefone, limiteCredito, ativo } = body;

    if (!id || !nome || !cpf || !telefone) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, "");

    await connectToDatabase();

    const fornecedor = await Fornecedor.findById(id);
    if (!fornecedor) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });
    }

    if (fornecedor.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const duplicateCpf = await Fornecedor.findOne({
      userId: session.user.id,
      cpf: cleanCpf,
      _id: { $ne: id }
    });

    if (duplicateCpf) {
      return NextResponse.json({ error: "Outro fornecedor já utiliza este CPF/CNPJ" }, { status: 400 });
    }

    fornecedor.nome = nome;
    fornecedor.cpf = cleanCpf;
    fornecedor.email = email;
    fornecedor.telefone = telefone;
    fornecedor.limiteCredito = Number(limiteCredito) || 0;
    fornecedor.ativo = (ativo === 0 || ativo === "0") ? 0 : 1;

    await fornecedor.save();
    return NextResponse.json(fornecedor);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });

    await connectToDatabase();

    const fornecedor = await Fornecedor.findById(id);
    if (!fornecedor) return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 });

    if (fornecedor.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    fornecedor.ativo = Number(fornecedor.ativo) === 0 ? 1 : 0;
    await fornecedor.save();

    return NextResponse.json({
      message: `Fornecedor ${fornecedor.ativo === 1 ? "ativado" : "desativado"} com sucesso`,
      ativo: fornecedor.ativo
    });
  } catch (error) {
    console.error("Erro ao alterar status do fornecedor:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
