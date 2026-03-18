import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Config from "@/models/Config";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      // Securiry: do not reveal if email exists, return success anyway
      return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá o código." });
    }

    // Google-only accounts might not have a password, but we let them reset it if they want
    
    // Generate 6 digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valid for 15 minutes

    // Save to User
    await User.updateOne(
      { _id: user._id },
      { $set: { resetCode, resetCodeExpiresAt: expiresAt } },
      { strict: false }
    );

    // Fetch SMTP Configuration
    const configs = await Config.find({});
    const getConfig = (key: string) => configs.find(c => c.key === key)?.value;

    const host = getConfig("smtp_host");
    const port = getConfig("smtp_port");
    const smtpUser = getConfig("smtp_user");
    const smtpPass = getConfig("smtp_password");
    const fromEmail = getConfig("smtp_from_email");

    if (!host || !smtpUser || !smtpPass) {
      console.error("Configuração SMTP incompleta no banco de dados");
      return NextResponse.json({ error: "O envio de email não está configurado." }, { status: 500 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"FinanSys" <${fromEmail || smtpUser}>`,
      to: user.email,
      subject: "Código de Recuperação de Senha",
      text: `Seu código de recuperação é: ${resetCode}. Ele expira em 15 minutos.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">FinanSys</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #333;">Olá, ${user.name}!</h2>
            <p style="color: #555; line-height: 1.5;">Você solicitou a recuperação de senha para a sua conta.</p>
            <p style="color: #555; line-height: 1.5;">Utilize o código de 6 dígitos abaixo para redefinir sua senha:</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${resetCode}</span>
            </div>
            
            <p style="color: #555; font-size: 14px;">Este código expira em <strong>15 minutos</strong>. Se você não solicitou esta alteração, por favor ignore este email.</p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            &copy; ${new Date().getFullYear()} FinanSys. Todos os direitos reservados.
          </div>
        </div>
      `
    });

    return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá o código." });
  } catch (error: any) {
    console.error("Erro ao solicitar recuperação:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor." }, { status: 500 });
  }
}
