import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only";

export async function POST(request: Request) {
  try {
    const { email, password, code } = await request.json();

    if (!email || (!password && !code)) {
      return NextResponse.json(
        { error: "Email e senha (ou código) são obrigatórios" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user;

    if (code) {
      // Find user and include loginCode and loginCodeExpiresAt
      user = await User.findOne({ email }).select("+loginCode +loginCodeExpiresAt");

      if (!user || !user.loginCode) {
        return NextResponse.json(
          { error: "Nenhum código ativo encontrado para este e-mail" },
          { status: 401 }
        );
      }

      if (user.loginCode !== code.trim()) {
        return NextResponse.json(
          { error: "Código inválido" },
          { status: 401 }
        );
      }

      if (!user.loginCodeExpiresAt || new Date() > new Date(user.loginCodeExpiresAt)) {
        return NextResponse.json(
          { error: "Código expirado" },
          { status: 401 }
        );
      }

      // Code is valid! Clear it
      await User.updateOne(
        { _id: user._id },
        { $unset: { loginCode: "", loginCodeExpiresAt: "" } }
      );

      // Verify email if not verified
      if (!user.isEmailVerified) {
        await User.updateOne(
          { _id: user._id },
          { $set: { isEmailVerified: true } }
        );
      }
    } else {
      // Find user and include password field (which is select: false by default)
      user = await User.findOne({ email }).select("+password");

      if (!user || !user.password) {
        return NextResponse.json(
          { error: "Credenciais inválidas" },
          { status: 401 }
        );
      }

      // Check if user is a Google-only account (no password set)
      if (user.provider === "google" && !user.password) {
          return NextResponse.json(
            { error: "Esta conta utiliza login pelo Google. Por favor, use o botão de login social." },
            { status: 400 }
          );
      }

      // Compare passwords
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        return NextResponse.json(
          { error: "Credenciais inválidas" },
          { status: 401 }
        );
      }
    }

    // Create JWT Token
    const token = jwt.sign(
      { 
        id: user._id, 
        name: user.name,
        email: user.email, 
        role: user.role,
        username: user.username 
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Token valid for 7 days
    );

    // Return token and user info (excluding password)
    return NextResponse.json({
      message: "Login realizado com sucesso",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        image: user.image
      }
    });

  } catch (error: any) {
    console.error("Erro no login manual API:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
