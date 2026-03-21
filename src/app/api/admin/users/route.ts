import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

// Middleware-like role check
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
    const users = await User.find({}).select("-password");
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id, role, name, email, password, username } = await request.json();
    await connectToDatabase();

    const updateData: any = { role, name };

    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: id } });
      if (existingUsername) {
        return NextResponse.json({ error: "Este @user-name já está em uso" }, { status: 400 });
      }
      updateData.username = username.toLowerCase().replace("@", "");
    }

    if (email) {
      // Check if email is already taken by ANOTHER user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ error: "Este email já está em uso por outro usuário" }, { status: 400 });
      }
      updateData.email = email;
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).select("-password");

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID ausente" }, { status: 400 });

    await connectToDatabase();
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "Usuário excluído" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { name, email, password, role, username } = await request.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    await connectToDatabase();

    let finalUsername = username
      ? username.toLowerCase().replace("@", "")
      : email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");

    const existingUsername = await User.findOne({ username: finalUsername });
    if (existingUsername) {
      if (!username) {
        // Only auto-generate with random digits if user didn't provide one
        const randomDigits = Math.floor(100000 + Math.random() * 900000); // 6 digits
        finalUsername = `${finalUsername}-${randomDigits}`;
      } else {
        return NextResponse.json({ error: "Este @user-name já está em uso" }, { status: 400 });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      username: finalUsername,
      password: hashedPassword,
      role,
      provider: "credentials"
    });

    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
