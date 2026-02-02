"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ClientePedidosRealtime({ usuarioId }: { usuarioId: string }) {
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel(`pedidos_cliente_${usuarioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `usuario_id=eq.${usuarioId}`,
        },
        () => {
          // Actualiza los Server Components sin recargar la página
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [usuarioId, router]);

  return null;
}