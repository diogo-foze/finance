import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email e código são obrigatórios" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+verificationCode");
    
    if (user.isEmailVerified) {
      return NextResponse.json({ message: "E-mail já verificado." });
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return NextResponse.json({ error: "Código de verificação inválido." }, { status: 400 });
    }

    // Mark as verified and clear code
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    await user.save();

    return NextResponse.json({ message: "E-mail verificado com sucesso! Sua conta está ativa." });
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
