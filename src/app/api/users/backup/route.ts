import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Cliente from "@/models/Cliente";
import Fornecedor from "@/models/Fornecedor";
import Receita from "@/models/Receita";
import Despesa from "@/models/Despesa";
import ReceitaCliente from "@/models/ReceitaCliente";
import DespesaFornecedor from "@/models/DespesaFornecedor";
import Message from "@/models/Message";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user?.email) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const userId = dbUser._id;

    // Fetch all user-related data
    const [clientes, fornecedores, receitas, despesas, receitaClientes, despesaFornecedores, mensagens] = await Promise.all([
      Cliente.find({ userId }),
      Fornecedor.find({ userId }),
      Receita.find({ userId }),
      Despesa.find({ userId }),
      ReceitaCliente.find({ userId }),
      DespesaFornecedor.find({ userId }),
      Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] })
    ]);

    const backupData = {
      app: "FinanSys",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      user: {
        id: userId.toString(),
        name: dbUser.name,
        email: dbUser.email,
        username: dbUser.username
      },
      data: {
        clientes,
        fornecedores,
        receitas,
        despesas,
        receitaClientes,
        despesaFornecedores,
        mensagens
      }
    };

    const fileName = `finansys_backup_${dbUser.username || "user"}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ error: "Erro interno ao exportar backup: " + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user?.email) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const userId = dbUser._id;
    const body = await request.json();
    const { backupData, mode } = body;

    // Validation
    if (!backupData || backupData.app !== "FinanSys" || !backupData.data) {
      return NextResponse.json({ error: "Arquivo de backup inválido. Certifique-se de carregar um arquivo JSON gerado pelo FinanSys." }, { status: 400 });
    }

    const { clientes = [], fornecedores = [], receitas = [], despesas = [], receitaClientes = [], despesaFornecedores = [], mensagens = [] } = backupData.data;

    if (mode === "replace") {
      // Overwrite mode: delete existing records for this user
      await Promise.all([
        Cliente.deleteMany({ userId }),
        Fornecedor.deleteMany({ userId }),
        Receita.deleteMany({ userId }),
        Despesa.deleteMany({ userId }),
        ReceitaCliente.deleteMany({ userId }),
        DespesaFornecedor.deleteMany({ userId }),
        Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] })
      ]);

      // Bulk insert everything with new userId and preserved IDs
      if (clientes.length) {
        await Cliente.insertMany(clientes.map((item: any) => ({ ...item, userId })));
      }
      if (fornecedores.length) {
        await Fornecedor.insertMany(fornecedores.map((item: any) => ({ ...item, userId })));
      }
      if (receitas.length) {
        await Receita.insertMany(receitas.map((item: any) => ({ ...item, userId })));
      }
      if (despesas.length) {
        await Despesa.insertMany(despesas.map((item: any) => ({ ...item, userId })));
      }
      if (receitaClientes.length) {
        await ReceitaCliente.insertMany(receitaClientes.map((item: any) => ({ ...item, userId })));
      }
      if (despesaFornecedores.length) {
        await DespesaFornecedor.insertMany(despesaFornecedores.map((item: any) => ({ ...item, userId })));
      }
      if (mensagens.length) {
        await Message.insertMany(
          mensagens.map((item: any) => {
            const newSenderId = item.senderId === backupData.user.id || item.senderId === userId.toString() ? userId : item.senderId;
            const newReceiverId = item.receiverId === backupData.user.id || item.receiverId === userId.toString() ? userId : item.receiverId;
            return { ...item, senderId: newSenderId, receiverId: newReceiverId };
          })
        );
      }
    } else {
      // Merge mode
      // 1. Clientes (upsert by CPF/CNPJ to avoid index conflicts)
      for (const item of clientes) {
        const { _id, userId: oldUser, createdAt, updatedAt, ...rest } = item;
        await Cliente.updateOne(
          { userId, cpf: rest.cpf },
          { $set: rest },
          { upsert: true }
        );
      }

      // 2. Fornecedores (upsert by CPF/CNPJ to avoid index conflicts)
      for (const item of fornecedores) {
        const { _id, userId: oldUser, createdAt, updatedAt, ...rest } = item;
        await Fornecedor.updateOne(
          { userId, cpf: rest.cpf },
          { $set: rest },
          { upsert: true }
        );
      }

      // 3. Receitas & Despesas (insert them directly)
      if (receitas.length) {
        await Receita.insertMany(receitas.map(({ userId: oldUser, ...rest }: any) => ({ ...rest, userId })));
      }
      if (despesas.length) {
        await Despesa.insertMany(despesas.map(({ userId: oldUser, ...rest }: any) => ({ ...rest, userId })));
      }

      // 4. Relations
      // For relations in merge mode, we only insert if they don't exist
      for (const rc of receitaClientes) {
        const { userId: oldUser, ...rest } = rc;
        await ReceitaCliente.updateOne(
          { userId, receitaId: rest.receitaId, clienteId: rest.clienteId },
          { $set: rest },
          { upsert: true }
        );
      }
      for (const df of despesaFornecedores) {
        const { userId: oldUser, ...rest } = df;
        await DespesaFornecedor.updateOne(
          { userId, despesaId: rest.despesaId, fornecedorId: rest.fornecedorId },
          { $set: rest },
          { upsert: true }
        );
      }

      // 5. Messages
      if (mensagens.length) {
        await Message.insertMany(
          mensagens.map((item: any) => {
            const newSenderId = item.senderId === backupData.user.id || item.senderId === userId.toString() ? userId : item.senderId;
            const newReceiverId = item.receiverId === backupData.user.id || item.receiverId === userId.toString() ? userId : item.receiverId;
            return { ...item, senderId: newSenderId, receiverId: newReceiverId };
          })
        );
      }
    }

    return NextResponse.json({ message: "Dados restaurados com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao importar backup:", error);
    return NextResponse.json({ error: "Erro interno ao restaurar backup: " + error.message }, { status: 500 });
  }
}
