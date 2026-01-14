import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; 

// Detectamos si estamos en la fase de construcción (build)
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Si estamos en build, no pasamos el adaptador para evitar que Prisma despierte
  // En producción (Cloudflare), funcionará normalmente.
  adapter: isBuildPhase ? undefined : PrismaAdapter(prisma as any), 
  
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return "/admin?error=NoEmail";
      
      // Solo ejecutamos la búsqueda si prisma tiene los métodos necesarios
      if (typeof prisma.usuarios !== 'undefined') {
        const dbUser = await prisma.usuarios.findFirst({
          where: { email: user.email },
        });
        return dbUser ? true : "/admin?error=AccessDenied";
      }
      
      return "/admin?error=ServerError";
    },
  },
  pages: { error: "/admin" },
});