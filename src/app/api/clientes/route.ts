import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Cliente from "@/models/Cliente";
import mongoose from "mongoose";

// Ensure model is refreshed with new schema if it was already registered
if (mongoose.models.Cliente) {
  delete mongoose.models.Cliente;
  // Re-importing might help if it was a file cache, but we just want to re-register
}
// We will still import it at the top, but the re-import in the handler might be safer.

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
      matchQuery.ativo = { $ne: 0 };
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

    const cleanCpf = cpf.replace(/\D/g, "");

    await connectToDatabase();

    // Check if CPF already exists for THIS user
    const existingCpf = await Cliente.findOne({ userId: session.user.id, cpf: cleanCpf });
    if (existingCpf) {
      return NextResponse.json({ error: "Você já possui um cliente cadastrado com este CPF/CNPJ" }, { status: 400 });
    }

    const novoCliente = new Cliente({
      userId: session.user.id,
      nome,
      cpf: cleanCpf,
      dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
      email,
      telefone,
      limiteCredito: Number(limiteCredito) || 0,
      ativo: (ativo === 0 || ativo === "0") ? 0 : 1,
    });

    await novoCliente.save();

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

    const cleanCpf = cpf.replace(/\D/g, "");

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
      cpf: cleanCpf,
      _id: { $ne: id }
    });

    if (duplicateCpf) {
      return NextResponse.json({ error: "Outro cliente seu já utiliza este CPF/CNPJ" }, { status: 400 });
    }

    // Update fields
    cliente.nome = nome;
    cliente.cpf = cleanCpf;
    cliente.dataNascimento = dataNascimento ? new Date(dataNascimento) : undefined;
    cliente.email = email;
    cliente.telefone = telefone;
    cliente.limiteCredito = Number(limiteCredito) || 0;
    cliente.ativo = (ativo === 0 || ativo === "0") ? 0 : 1;

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

    // Find the customer first to check ownership and existence
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
    }

    if (cliente.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Você não tem permissão para desativar este cliente" }, { status: 403 });
    }

    // Toggle status: flip between 1 and 0
    cliente.ativo = Number(cliente.ativo) === 0 ? 1 : 0;
    await cliente.save();

    return NextResponse.json({
      message: `Cliente ${cliente.ativo === 1 ? "ativado" : "desativado"} com sucesso`,
      ativo: cliente.ativo
    });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
