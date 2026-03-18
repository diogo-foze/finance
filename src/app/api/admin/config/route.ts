import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Config from "@/models/Config";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await connectToDatabase();
    const configs = await Config.find({});
    
    // Seed default if empty
    if (configs.length === 0) {
      const googleConfig = await Config.create([
        {
          key: "google_login_enabled",
          value: true,
          isPublic: true,
          description: "Habilita o botão de login pelo Google na tela inicial"
        },
        {
          key: "block_google_registration",
          value: false,
          isPublic: false,
          description: "Bloqueia o cadastro de NOVOS usuários através do login do Google."
        },
        {
          key: "google_registration_blocked_message",
          value: "O cadastro de novos usuários está temporariamente bloqueado pelo administrador.",
          isPublic: false,
          description: "Mensagem exibida quando um novo usuário tenta se cadastrar pelo Google e o bloqueio está ativo."
        }
      ]);
      return NextResponse.json(googleConfig);
    }

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { key, value } = await request.json();
    await connectToDatabase();
    
    const config = await Config.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true }
    );
    
    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao atualizar configuração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
