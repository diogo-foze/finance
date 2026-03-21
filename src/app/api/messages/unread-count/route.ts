import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import Message from "@/models/Message";
import connectToDatabase from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const unreadCount = await Message.countDocuments({
      receiverId: session.user.id,
      isRead: false,
      isDeleted: { $ne: true }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
