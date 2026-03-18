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

    const user = await User.findOne({ email }).select("+resetCode +resetCodeExpiresAt").lean();
    
    // lean() makes user a plain object, so we verify properties directly
    if (!user || !user.resetCode || user.resetCode !== code.trim()) {
      return NextResponse.json({ error: "Código inválido ou não encontrado." }, { status: 400 });
    }

    if (!user.resetCodeExpiresAt || new Date() > new Date(user.resetCodeExpiresAt)) {
      return NextResponse.json({ error: "Este código expirou. Solicite um novo." }, { status: 400 });
    }

    return NextResponse.json({ message: "Código validado com sucesso." });
  } catch (error) {
    console.error("Erro ao verificar código:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
