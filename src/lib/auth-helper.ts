import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev-only";

export async function getAuthSession(request: Request) {
  // 1. Try to get standard NextAuth session (cookies)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return { user: session.user };
  }

  // 2. Try to get Bearer Token from Authorization Header
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return { 
        user: { 
          id: decoded.id, 
          name: decoded.name || "",
          email: decoded.email, 
          role: decoded.role || "user",
          username: decoded.username || "",
          isEmailVerified: !!decoded.isEmailVerified
        } 
      };
    } catch (error) {
      console.error("Erro na verificação do JWT:", error);
      return null;
    }
  }

  if (!session?.user) {
    console.log("[Auth-Helper] No session or token found for request:", request.url);
  }

  return null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
