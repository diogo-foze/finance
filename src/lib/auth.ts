import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log("Tentativa de login para:", credentials?.email);
          
          if (!credentials?.email || !credentials?.password) {
            console.log("Credenciais ausentes");
            return null;
          }

          await connectToDatabase();
          console.log("MongoDB conectado para login");

          const user = await User.findOne({ email: credentials.email }).select("+password");

          if (!user || !user.password) {
            console.log("Usuário não encontrado ou sem senha");
            return null;
          }

          const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordMatch) {
            console.log("Senha incorreta");
            return null;
          }

          console.log("Login bem-sucedido para:", user.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || "user",
          };
        } catch (error) {
          console.error("Erro no authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      try {
        if (account?.provider === "google") {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              role: "user",
            });
          }
        }
        return true;
      } catch (error) {
        console.error("Erro no signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }: any) {
      if (token?.id && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        if (account?.provider === "google") {
          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role || "user";
          }
        } else {
          token.id = user.id;
          token.role = user.role;
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
