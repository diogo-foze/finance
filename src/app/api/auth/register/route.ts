import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Config from "@/models/Config";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if registration is blocked
    const blockConfig = await Config.findOne({ key: "block_external_registration" });
    if (blockConfig?.value === true) {
      const msgConfig = await Config.findOne({ key: "external_registration_blocked_message" });
      const message = msgConfig?.value || "O cadastro de novos usuários está temporariamente desativado.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está sendo utilizado" }, { status: 400 });
    }

    // Generate unique username
    let baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let generatedUsername = baseUsername;
    let counter = 1;
    
    while (await User.findOne({ username: generatedUsername })) {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
      generatedUsername = `${baseUsername}-${randomSuffix}`;
      // Just in case of extreme bad luck, break after 5 attempts and use timestamp
      if (counter > 5) {
        generatedUsername = `${baseUsername}-${Date.now().toString().slice(-6)}`;
        break;
      }
      counter++;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      username: generatedUsername,
      provider: "credentials",
      role: "user",
      verificationCode,
    });

    // Send welcome email with verification code
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
          to: email,
          subject: "Bem-vindo ao FinanSys! Ative sua conta",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #0f172a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">FinanSys</h1>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #333;">Olá, ${name}!</h2>
                <p style="color: #555; line-height: 1.5;">Obrigado por se cadastrar no FinanSys! Para ativar sua conta e começar a gerenciar suas finanças, utilize o código de verificação abaixo:</p>
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a;">${verificationCode}</span>
                </div>
                <p style="color: #555; font-size: 14px;">Este código é necessário para confirmar que seu e-mail está correto e seguro.</p>
              </div>
              <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                &copy; ${new Date().getFullYear()} FinanSys. Todos os direitos reservados.
              </div>
            </div>
          `
        });
      } else {
        console.warn("SMTP not configured, welcome email skipped.");
      }
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // We don't block the registration if email fails, but it's not ideal
    }

    return NextResponse.json({ 
      message: "Usuário cadastrado com sucesso",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Erro no registro de usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
