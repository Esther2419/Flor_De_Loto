import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/admin?error=NoEmail";

      try {
        const dbUser = await prisma.usuarios.findFirst({
          where: { email: user.email },
        });

        if (dbUser) return true;

        return "/admin?error=AccessDenied";
      } catch (error) {
        console.error("Error verificando usuario en BD:", error);
        return "/admin?error=ServerError";
      }
    },
  },
  pages: {
    error: "/admin",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };