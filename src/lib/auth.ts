import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const usuario = await prisma.usuarios.findUnique({
          where: { email: credentials.email }
        });

        if (!usuario) throw new Error("Usuario no encontrado");

        const passwordMatch = await bcrypt.compare(credentials.password, usuario.password);
        if (!passwordMatch) throw new Error("Contraseña incorrecta");

        return {
          id: usuario.id.toString(),
          name: usuario.nombre_completo,
          email: usuario.email,
          role: usuario.rol || "cliente", 
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider === "google") {
        const usuarioBD = await prisma.usuarios.findUnique({
          where: { email: user.email }
        });
        if (!usuarioBD) return false; 
        return true;
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      } else if (token.email) {
        const usuarioBD = await prisma.usuarios.findUnique({
          where: { email: token.email }
        });
        if (usuarioBD) {
          token.role = usuarioBD.rol || "cliente";
          token.name = usuarioBD.nombre_completo;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "cliente";
        session.user.name = token.name;
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};