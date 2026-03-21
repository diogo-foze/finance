import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import Message from "@/models/Message";
import connectToDatabase from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageIds } = await req.json();
    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: "messageIds array is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Only update messages where the current user is the receiver
    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: session.user.id },
      { $set: { status: "read", isRead: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
