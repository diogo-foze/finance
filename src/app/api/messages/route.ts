import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import Message from "@/models/Message";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function GET(request: Request) {
  const session = await getAuthSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");

  await connectToDatabase();

  let query: any = {
    $or: [{ senderId: session.user.id }, { receiverId: session.user.id }]
  };

  // If recipientId is provided, filter messages between the two users
  if (recipientId) {
    query = {
      $or: [
        { senderId: session.user.id, receiverId: recipientId },
        { senderId: recipientId, receiverId: session.user.id }
      ]
    };
  }

  const messages = await Message.find(query).sort({ createdAt: 1 }); // Sort by creation time ascending for chat flow

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getAuthSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, text } = await req.json();
  
  if (!receiverId || !text) {
    return NextResponse.json({ error: "Receiver ID and text are required" }, { status: 400 });
  }

  await connectToDatabase();

  // Validate receiver existence
  const receiverExists = await User.findById(receiverId);
  if (!receiverExists) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 });
  }

  const newMessage = await Message.create({
    senderId: session.user.id,
    receiverId,
    text,
    status: "sent",
    isRead: false,
    isEdited: false,
    isDeleted: false,
  });

  return NextResponse.json(newMessage);
}

