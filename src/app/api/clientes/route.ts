import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Cliente from "@/models/Cliente";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get("all") === "true";

    // Match customers for the current user
    const matchQuery: any = { 
      userId: new mongoose.Types.ObjectId(session.user.id),
    };

    // If not showing all, only show active ones
    if (!showAll) {
      matchQuery.ativo = { $ne: false };
    }

    // Aggregation to get customers with their used credit (sum of non-consolidated revenues)
    const clientes = await Cliente.aggregate([
      { $match: matchQuery },
      { $sort: { nome: 1 } },
      {
        $lookup: {
          from: "receitaclientes",
          localField: "_id",
          foreignField: "clienteId",
          as: "links"
        }
      },
      {
        $lookup: {
          from: "receitas",
          let: { receitaIds: "$links.receitaId" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $in: ["$_id", "$$receitaIds"] },
                    { $eq: ["$status", "Planejado"] }
                  ]
                }
              } 
            }
          ],
          as: "plannedRevenues"
        }
      },
      {
        $addFields: {
          creditoUtilizado: { $sum: "$plannedRevenues.valor" }
        }
      },
      {
        $project: {
          links: 0,
          plannedRevenues: 0
        }
      }
    ]);

    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const body = await request.json();
    const { nome, cpf, dataNascimento, email, telefone, limiteCredito, ativo } = body;

    if (!nome || !cpf || !telefone) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Check if CPF already exists for THIS user
    const existingCpf = await Cliente.findOne({ userId: session.user.id, cpf });
    if (existingCpf) {
      return NextResponse.json({ error: "Você já possui um cliente cadastrado com este CPF/CNPJ" }, { status: 400 });
    }

    const novoCliente = await Cliente.create({
      userId: session.user.id,
      nome,
      cpf,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
      email,
      telefone,
      limiteCredito: Number(limiteCredito) || 0,
      ativo: ativo === undefined ? true : Boolean(ativo),
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user) return unauthorizedResponse();

    const body = await request.json();
    const { id, nome, cpf, dataNascimento, email, telefone, limiteCredito, ativo } = body;

    if (!id || !nome || !cpf || !telefone) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    await connectToDatabase();

    // Find the customer first to check ownership and existence
    const cliente = await Cliente.findById(id);
    
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado no banco de dados", id }, { status: 404 });
    }

    if (cliente.userId.toString() !== session.user.id) {
      return NextResponse.json({ 
        error: "Você não tem permissão para editar este cliente",
        debug: { dbUser: cliente.userId.toString(), sessionUser: session.user.id }
      }, { status: 403 });
    }

    // Check if new CPF already exists for THIS user in another record
    const duplicateCpf = await Cliente.findOne({ 
      userId: session.user.id, 
      cpf, 
      _id: { $ne: id } 
    });

    if (duplicateCpf) {
      return NextResponse.json({ error: "Outro cliente seu já utiliza este CPF/CNPJ" }, { status: 400 });
    }

    // Update fields
    cliente.nome = nome;
    cliente.cpf = cpf;
    cliente.dataNascimento = dataNascimento ? new Date(dataNascimento) : undefined;
    cliente.email = email;
    cliente.telefone = telefone;
    cliente.limiteCredito = Number(limiteCredito) || 0;
    cliente.ativo = ativo === undefined ? true : Boolean(ativo);

    const savedCliente = await cliente.save();
    return NextResponse.json(savedCliente);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
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
    // Soft delete: just set ativo: false
    const deleted = await Cliente.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { ativo: false },
      { returnDocument: 'after' }
    );

    if (!deleted) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    return NextResponse.json({ message: "Cliente desativado com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
