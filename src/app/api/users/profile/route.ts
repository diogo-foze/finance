import { NextResponse } from "next/server";
import { getAuthSession, unauthorizedResponse } from "@/lib/auth-helper";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user?.email) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session?.user?.email) {
      return unauthorizedResponse();
    }

    let name = "";
    let username = "";
    let file: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      name = body.name;
      username = body.username;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name") as string;
      username = formData.get("username") as string;
      file = formData.get("image") as File | null;
    } else {
      return NextResponse.json({ error: "Formato de requisição não suportado" }, { status: 415 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "O nome é obrigatório" }, { status: 400 });
    }

    let updatedImagePath = "";

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });
      
      // Clean up filename and append timestamp to avoid collisions
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
      const filename = `${Date.now()}-${sanitizedName}`;
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);
      updatedImagePath = `/uploads/avatars/${filename}`;
    }

    await connectToDatabase();
    
    // Prepare update object
    const updateData: any = { name: name.trim() };
    
    if (username) {
      const sanitizedUsername = username.toLowerCase().replace("@", "").trim();
      if (sanitizedUsername) {
        // Check if username is taken by another user
        const existingUser = await User.findOne({ 
          username: sanitizedUsername, 
          email: { $ne: session.user.email } 
        });
        if (existingUser) {
          return NextResponse.json({ error: "Este @nome já está em uso" }, { status: 400 });
        }
        updateData.username = sanitizedUsername;
      }
    }

    if (updatedImagePath) {
      updateData.image = updatedImagePath;
    }

    // Update user in DB
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      user: {
        name: updatedUser.name,
        image: updatedUser.image,
        username: updatedUser.username,
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
