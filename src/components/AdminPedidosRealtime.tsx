"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Volume2 } from "lucide-react";

export default function AdminPedidosRealtime() {
  const router = useRouter();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

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
              console.error("Error al reproducir sonido:", error);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Si el usuario no ha interactuado, mostramos un botón flotante para incitar el clic
  if (!hasInteracted) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button className="bg-[#C5A059] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[#b38f4d] transition-colors">
          <Volume2 size={18} />
          Activar Sonido
        </button>
      </div>
    );
  }

  return null;
}