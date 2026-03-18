import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const file = formData.get("image") as File | null;

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
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
