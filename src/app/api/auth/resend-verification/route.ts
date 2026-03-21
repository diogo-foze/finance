import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Config from "@/models/Config";

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    if (user.isEmailVerified) {
      return NextResponse.json({ message: "E-mail já verificado." });
    }

    // Generate new 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    await user.save();

    // Send email
    try {
      const configs = await Config.find({});
      const getConfig = (key: string) => configs.find(c => c.key === key)?.value;

      const host = getConfig("smtp_host");
      const port = getConfig("smtp_port");
      const smtpUser = getConfig("smtp_user");
      const smtpPass = getConfig("smtp_password");
      const fromEmail = getConfig("smtp_from_email");

      if (host && smtpUser && smtpPass) {
        const nodemailer = (await import("nodemailer")).default;
        const transporter = nodemailer.createTransport({
          host,
          port: Number(port) || 587,
          secure: Number(port) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"FinanSys" <${fromEmail || smtpUser}>`,
          to: user.email,
          subject: "Seu novo código de ativação - FinanSys",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">FinanSys</h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #333;">Olá, ${user.name}!</h2>
                <p style="color: #555; line-height: 1.5;">Você solicitou um novo código de ativação para sua conta no FinanSys. Utilize o código abaixo:</p>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${verificationCode}</span>
                </div>
                <p style="color: #555; font-size: 14px;">Se você não solicitou este código, ignore este e-mail.</p>
              </div>
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} FinanSys. Todos os direitos reservados.
              </div>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    return NextResponse.json({ message: "Código de verificação enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao reenviar código:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
