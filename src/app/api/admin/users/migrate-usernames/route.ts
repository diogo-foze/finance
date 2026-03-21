import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({ username: { $exists: false } });
    
    let updatedCount = 0;
    for (const user of users) {
      if (!user.username) {
        let baseUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        let finalUsername = baseUsername;
        let counter = 1;

        // Ensure uniqueness
        while (await User.findOne({ username: finalUsername, _id: { $ne: user._id } })) {
          finalUsername = `${baseUsername}${counter}`;
          counter++;
        }

        user.username = finalUsername;
        await user.save();
        updatedCount++;
      }
    }

    return NextResponse.json({ message: `Migração concluída. ${updatedCount} usuários atualizados.` });
  } catch (error) {
    console.error("Erro na migração de usernames:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
