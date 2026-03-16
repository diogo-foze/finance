import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  // Return all users except the current one
  const users = await User.find({ _id: { $ne: session.user.id } }).select("name email image");

  return NextResponse.json(users);
}
