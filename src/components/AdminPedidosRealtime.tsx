"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export default function AdminPedidosRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Faltan credenciales de Supabase para Realtime");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const channel = supabase
      .channel("realtime-pedidos")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
        },
        (payload) => {
          // Al detectar un cambio, refrescamos los Server Components
          router.refresh();

          // Si es un nuevo pedido (INSERT), reproducir sonido
          if (payload.eventType === "INSERT") {
            console.log("🔔 Nuevo pedido detectado. Intentando reproducir sonido...");
            const audio = new Audio("/notification.mp3");
            audio.play().catch((error) => {
              console.error("Error al reproducir sonido (verificar archivo /public/notification.mp3):", error);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null; // Este componente no renderiza nada visualmente
}