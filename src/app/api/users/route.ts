import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function GET(request: Request) {
  const session = await getAuthSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  // Return all users except the current one
  const users = await User.find({ _id: { $ne: session.user.id } }).select("name email image username");

  return NextResponse.json(users);
}
