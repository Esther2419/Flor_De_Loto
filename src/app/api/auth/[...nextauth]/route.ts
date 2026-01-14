import { handlers } from "@/auth";
export const { GET, POST } = handlers;
export const runtime = "edge"; // Esto es lo que Cloudflare necesita
export const dynamic = "force-dynamic"; // Forzar contenido dinámico