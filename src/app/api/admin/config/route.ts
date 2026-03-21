import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Config from "@/models/Config";

async function isAdmin(request: Request) {
  const session = await getAuthSession(request);
  return session?.user?.role === "admin";
}

export async function GET(request: Request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await connectToDatabase();
    const configs = await Config.find({});
    
    // Mapeamento das configurações padrão do sistema
    const defaultConfigs = [
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
      },
      {
        key: "smtp_host",
        value: "smtp.example.com",
        isPublic: false,
        description: "Servidor SMTP para envio de e-mails."
      },
      {
        key: "smtp_port",
        value: "587",
        isPublic: false,
        description: "Porta do servidor SMTP (ex: 587, 465)."
      },
      {
        key: "smtp_user",
        value: "seu-email@dominio.com",
        isPublic: false,
        description: "Usuário de autenticação do SMTP."
      },
      {
        key: "smtp_password",
        value: "sua-senha",
        isPublic: false,
        description: "Senha de autenticação do SMTP."
      },
      {
        key: "smtp_from_email",
        value: "nao-responda@dominio.com",
        isPublic: false,
        description: "Endereço de e-mail do remetente enviado aos clientes."
      },
      {
        key: "block_external_registration",
        value: false,
        isPublic: true,
        description: "Bloqueia a criação de novas contas pelo formulário de cadastro."
      },
      {
        key: "external_registration_blocked_message",
        value: "O cadastro de novos usuários está temporariamente desativado.",
        isPublic: true,
        description: "Mensagem exibida quando um usuário tenta se cadastrar e o bloqueio está ativo."
      }
    ];

    const missingConfigs = defaultConfigs.filter(dc => !configs.some(c => c.key === dc.key));

    if (missingConfigs.length > 0) {
      const created = await Config.insertMany(missingConfigs);
      configs.push(...created);
    }

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdmin(request))) {
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
