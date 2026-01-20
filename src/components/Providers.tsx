"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext"; // <--- 1. Importa esto

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {/* 2. Envuelve los hijos con CartProvider */}
      <CartProvider>
        {children}
      </CartProvider>
    </SessionProvider>
  );
}