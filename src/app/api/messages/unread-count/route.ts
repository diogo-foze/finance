import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Message from "@/models/Message";
import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const unreadCount = await Message.countDocuments({
      receiverId: session.user.id,
      isRead: false,
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
