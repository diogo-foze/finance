import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email }).select("+resetCode +resetCodeExpiresAt").lean();
    
    if (!user || !user.resetCode || user.resetCode !== code.trim()) {
      return NextResponse.json({ error: "Código inválido." }, { status: 400 });
    }

    if (!user.resetCodeExpiresAt || new Date() > new Date(user.resetCodeExpiresAt)) {
      return NextResponse.json({ error: "Este código expirou." }, { status: 400 });
    }

    // Hash the new password and clean up the reset tokens
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword },
        $unset: { resetCode: 1, resetCodeExpiresAt: 1 } 
      },
      { strict: false }
    );

    return NextResponse.json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    console.error("Erro ao redefinir a senha:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
