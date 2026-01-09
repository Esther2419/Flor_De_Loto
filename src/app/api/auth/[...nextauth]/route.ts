import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importamos del nuevo archivo

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };