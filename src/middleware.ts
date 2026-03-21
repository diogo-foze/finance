import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/receitas/:path*", 
    "/despesas/:path*", 
    "/relatorios/:path*",
    "/admin/:path*",
    "/mensagens/:path*",
    "/perfil/:path*"
  ]
};


