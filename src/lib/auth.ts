import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import connectToDatabase from "@/lib/mongodb"
import User from "@/models/User"
import Config from "@/models/Config"
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
            const blockConfig = await Config.findOne({ key: "block_google_registration" });
            if (blockConfig?.value === true) {
              const msgConfig = await Config.findOne({ key: "google_registration_blocked_message" });
              const message = msgConfig?.value || "O cadastro de novos usuários está temporariamente bloqueado pelo administrador.";
              return `/login?error=GoogleRegistrationBlocked&message=${encodeURIComponent(message)}`;
            }

            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: "google",
              role: "user",
            });
          } else if (!existingUser.image && user.image) {
            // Synchronize Google image if the user doesn't have a profile picture yet
            existingUser.image = user.image;
            await existingUser.save();
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
        if (token.picture) session.user.image = token.picture;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }: any) {
      // Handle client-side session update
      if (trigger === "update" && session) {
        if (session.image) token.picture = session.image;
        if (session.name) token.name = session.name;
      }

      if (user) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role || "user";
          token.picture = dbUser.image || null;
          token.name = dbUser.name;
        } else {
          // Fallback if somehow missing
          token.id = user.id;
          token.role = user.role;
          if (user.image) token.picture = user.image;
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
