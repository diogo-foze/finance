import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import Message from "@/models/Message";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageId, text } = await req.json();
    if (!messageId || !text) {
      return NextResponse.json({ error: "Message ID and text are required" }, { status: 400 });
    }

    await connectToDatabase();

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // Verify ownership
    if (message.senderId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Enforce 120s rule
    const now = new Date();
    const diffSeconds = (now.getTime() - message.createdAt.getTime()) / 1000;
    if (diffSeconds > 120) {
      return NextResponse.json({ error: "Edit timeout (120s limit)" }, { status: 400 });
    }

    message.text = text;
    message.isEdited = true;
    await message.save();

    return NextResponse.json({ success: true, isEdited: true, text });
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
