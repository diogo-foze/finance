import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import Config from "@/models/Config";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Não autorizado ou e-mail indisponível." }, { status: 401 });
    }

    const { month, year, period: periodLabel, totalReceitas, totalDespesas, saldo } = await request.json();

    // Determine the period display text
    const displayPeriod = periodLabel || (month && year ? `${month} de ${year}` : "Período Personalizado");

    await connectToDatabase();

    const configs = await Config.find({});
    const getConfig = (key: string) => configs.find(c => c.key === key)?.value;

    const host = getConfig("smtp_host");
    const port = getConfig("smtp_port");
    const smtpUser = getConfig("smtp_user");
    const smtpPass = getConfig("smtp_password");
    const fromEmail = getConfig("smtp_from_email");

    if (!host || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: "O envio de email não está configurado." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const isPositive = saldo >= 0;

    await transporter.sendMail({
      from: `"FinanSys" <${fromEmail || smtpUser}>`,
      to: session.user.email as string,
      subject: `Relatório Financeiro: ${displayPeriod}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">FinanSys</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Olá, ${session.user.name || 'Usuário'}!</h2>
            <p style="color: #555; line-height: 1.5;">Aqui está o seu resumo financeiro referente ao período de <strong>${displayPeriod}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <table style="width: 100%; text-align: left; border-collapse: collapse;">
                <tr>
                  <th style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Total de Receitas</th>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: bold; text-align: right;">${formatCurrency(totalReceitas)}</td>
                </tr>
                <tr>
                  <th style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #475569;">Total de Despesas</th>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: bold; text-align: right;">${formatCurrency(totalDespesas)}</td>
                </tr>
                <tr>
                  <th style="padding: 15px 0 5px 0; color: #0f172a; font-size: 18px;">Saldo do Período</th>
                  <td style="padding: 15px 0 5px 0; color: ${isPositive ? '#10b981' : '#ef4444'}; font-weight: bold; font-size: 18px; text-align: right;">${formatCurrency(saldo)}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #555; font-size: 14px;">Para mais detalhes, acesse seu painel na aplicação.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            &copy; ${new Date().getFullYear()} FinanSys. Todos os direitos reservados.
          </div>
        </div>
      `
    });

    return NextResponse.json({ message: "Relatório enviado com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao enviar relatório:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor." }, { status: 500 });
  }
}
