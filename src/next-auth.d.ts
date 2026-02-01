import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      celular?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    rol: string;
    celular?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: string;
    celular?: string | null;
  }
}