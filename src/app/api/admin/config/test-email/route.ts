import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { host, port, user, pass, from } = await request.json();

    if (!host || !user || !pass) {
      return NextResponse.json({ error: "Dados SMTP incompletos para teste." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection first
    await transporter.verify();

    // Send a test email to the admin
    await transporter.sendMail({
      from: `"FinanSys Test" <${from || user}>`,
      to: session.user.email as string,
      subject: "Teste de Configuração SMTP - FinanSys",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #10b981; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">FinanSys</h1>
          </div>
          <div style="padding: 30px; text-align: center;">
            <h2 style="color: #10b981;">Conexão Bem-sucedida!</h2>
            <p style="color: #555; line-height: 1.5;">Este é um e-mail de teste para confirmar que as suas configurações de SMTP estão funcionando corretamente no sistema.</p>
            <div style="margin-top: 20px; font-size: 12px; color: #999;">
              Enviado em: ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      `
    });

    return NextResponse.json({ message: "Configuração válida! E-mail de teste enviado." });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    return NextResponse.json({ 
      error: "Falha na conexão SMTP: " + (error.message || "Erro desconhecido") 
    }, { status: 500 });
  }
}
