import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import Message from "@/models/Message";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const userId = session.user.id;

    // Aggregate to find unique conversations and their last message
    // 1. Find all messages involving the user
    // 2. Group by the 'other' user
    // 3. Get the latest message for each group
    
    // Using a simpler approach first: get all messages and process in JS if aggregation is complex
    // But for performance, aggregation is better.
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.senderId.toString() === userId ? msg.receiverId.toString() : msg.senderId.toString();
      if (!conversationsMap.has(otherUser)) {
        conversationsMap.set(otherUser, msg);
      }
    }

    const conversationList = Array.from(conversationsMap.entries());
    
    // Fetch user details for each conversation
    const detailedConversations = await Promise.all(
      conversationList.map(async ([otherUserId, lastMessage]) => {
        const user = await User.findById(otherUserId).select("name email image username");
        return {
          user,
          lastMessage,
        };
      })
    );

    return NextResponse.json(detailedConversations);
  } catch (error) {
    console.error("Error in conversations route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
