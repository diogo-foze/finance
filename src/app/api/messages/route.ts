import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Message from "@/models/Message";
import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  // Find all messages involving the user, excluding deleted ones
  const messages = await Message.find({
    $or: [{ senderId: session.user.id }, { receiverId: session.user.id }],
  }).sort({ createdAt: -1 });

  return NextResponse.json(messages);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiverId, text } = await req.json();
  await connectToDatabase();

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

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageIds, text, isDeleted, messageId } = await req.json();
  await connectToDatabase();

  // Case 1: Bulk update read status
  if (messageIds) {
    await Message.updateMany(
      { _id: { $in: messageIds }, receiverId: session.user.id },
      { $set: { status: "read", isRead: true } }
    );
    return NextResponse.json({ success: true });
  }

  // Case 2: Single message edit or delete
  if (messageId) {
    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (isDeleted) {
      console.log(`Attempting soft delete for message: ${messageId} by user: ${session.user.id}`);
      const updated = await Message.findOneAndUpdate(
        { _id: messageId, senderId: session.user.id },
        { $set: { isDeleted: true } },
        { new: true }
      );
      
      if (!updated) {
        console.error(`Message not found or unauthorized for deletion: ${messageId}`);
        return NextResponse.json({ error: "Message not found or unauthorized" }, { status: 404 });
      }

      console.log(`Message successfully soft-deleted: ${updated._id}`);
      return NextResponse.json({ success: true, isDeleted: true });
    }

    if (text) {
      const now = new Date();
      const diff = (now.getTime() - message.createdAt.getTime()) / 1000;
      if (diff > 120) {
        return NextResponse.json({ error: "Edit timeout (120s limit)" }, { status: 400 });
      }
      message.text = text;
      message.isEdited = true;
      await message.save();
      return NextResponse.json({ success: true, isEdited: true, text });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
