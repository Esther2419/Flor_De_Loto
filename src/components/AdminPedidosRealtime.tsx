"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Bell, Volume2, AlertCircle, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function AdminPedidosRealtime() {
  const router = useRouter();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [pendingCount, setPendingCount] = useState<number>(0);

  // 1. Registrar Service Worker y comprobar permisos de notificación
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      } else {
        setPermissionState("unsupported");
      }

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("No se pudo registrar el Service Worker:", err);
        });
      }
    }

    const handleInteraction = () => {
      setHasInteracted(true);
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().then((res) => setPermissionState(res));
      }
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

  const pedirPermisoNotificaciones = async () => {
    setHasInteracted(true);
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      setPermissionState(res);
      if (res === "granted") {
        new Notification("🌸 Notificaciones Activadas", {
          body: "¡Perfecto! Recibirás avisos de nuevos pedidos y recordatorios de pendientes.",
          icon: "/LogoSinLetra.png",
        });
      }
    }
  };

  // 2. Escuchar en tiempo real con Supabase los cambios en la tabla 'pedidos'
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Faltan credenciales de Supabase para Realtime");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Función para obtener la cantidad total de pedidos en estado 'pendiente'
    const actualizarConteoPendientes = async () => {
      try {
        const { count, error } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "pendiente");
        
        if (!error && typeof count === "number") {
          setPendingCount(count);
        }
      } catch (e) {
        console.error("Error obteniendo conteo de pedidos pendientes:", e);
      }
    };

    // Consulta inicial
    actualizarConteoPendientes();

    const channel = supabase
      .channel("realtime-pedidos-admin-v2")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
        },
        async (payload) => {
          // Refrescar conteo de pendientes y la vista de Next.js
          actualizarConteoPendientes();
          router.refresh();

          // Si es un nuevo pedido recibido (INSERT)
          if (payload.eventType === "INSERT") {
            console.log("🔔 Nuevo pedido recibido:", payload.new);

            // Reproducir sonido
            const audio = new Audio("/notification.mp3");
            audio.play().catch((err) => console.error("Error al reproducir sonido:", err));

            // Obtener conteo actualizado de pendientes para el recordatorio estilo WhatsApp
            const { count: totalPendientes } = await supabase
              .from("pedidos")
              .select("*", { count: "exact", head: true })
              .eq("estado", "pendiente");

            const countActual = totalPendientes || 1;
            const pendientesAnteriores = countActual - 1;

            const newOrder = payload.new as any;
            const orderId = newOrder?.id ? String(newOrder.id) : "";
            const targetUrl = orderId ? `/admin/pedidos/${orderId}` : "/admin/pedidos?filter=pendiente";

            const cliente = newOrder?.nombre_contacto || "Cliente";
            const telefono = newOrder?.telefono_contacto || "Sin número";
            const total = Number(newOrder?.total_pagar || 0).toFixed(2);
            const receptor = newOrder?.nombre_receptor || "No especificado";
            const fechaObj = newOrder?.fecha_entrega ? new Date(newOrder.fecha_entrega) : null;
            const fechaStr = fechaObj
              ? fechaObj.toLocaleString("es-BO", { timeZone: "America/La_Paz", dateStyle: "short", timeStyle: "short" })
              : "Pendiente";

            // Texto recordatorio de pedidos no leídos/pendientes previos
            const recordatorioPendientes = pendientesAnteriores > 0
              ? `\n📌 ¡Tienes ${pendientesAnteriores} pedido(s) pendiente(s) anterior(es) sin atender!`
              : "";

            const title = `🌸 ¡NUEVO PEDIDO #${orderId}! (Bs. ${total})`;
            const body = `👤 Cliente: ${cliente}\n📞 Tel: ${telefono}\n📦 Recoge/Recibe: ${receptor}\n📅 Fecha: ${fechaStr}${recordatorioPendientes}\n👉 Haz clic para ver e interactuar.`;

            // Lanzar Notificación Push
            if ("Notification" in window && Notification.permission === "granted") {
              try {
                let swReg: ServiceWorkerRegistration | null = null;
                if ("serviceWorker" in navigator) {
                  swReg = await navigator.serviceWorker.ready.catch(() => null);
                }

                if (swReg && "showNotification" in swReg) {
                  await swReg.showNotification(title, {
                    body,
                    icon: "/LogoSinLetra.png",
                    badge: "/LogoSinLetra.png",
                    tag: `pedido-${orderId}`,
                    renotify: true,
                    requireInteraction: true,
                    data: { url: targetUrl },
                  } as any);
                } else {
                  const notification = new Notification(title, {
                    body,
                    icon: "/LogoSinLetra.png",
                    requireInteraction: true,
                  });

                  notification.onclick = (e) => {
                    e.preventDefault();
                    window.focus();
                    router.push(targetUrl);
                  };
                }
              } catch (err) {
                console.error("Error al lanzar notificación push:", err);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Si no se han otorgado los permisos, mostrar el botón flotante para activarlos
  if (permissionState === "default" || (!hasInteracted && permissionState !== "granted")) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <button
          onClick={pedirPermisoNotificaciones}
          className="bg-[#C5A059] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-[#b38f4d] transition-all transform hover:scale-105"
        >
          <Bell size={18} className="animate-pulse" />
          <Volume2 size={18} />
          Activar Alertas de Pedidos
        </button>
      </div>
    );
  }

  // Si los permisos ya están concedidos y hay pedidos pendientes sin atender, mostrar insignia flotante (estilo WhatsApp unread badge)
  if (pendingCount > 0) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Link
          href="/admin/pedidos?filter=pendiente"
          className="bg-red-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all border-2 border-white transform hover:scale-105 animate-pulse"
        >
          <div className="relative">
            <ShoppingBag size={18} />
            <span className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-black">
              {pendingCount}
            </span>
          </div>
          <span>{pendingCount === 1 ? "1 Pedido Pendiente" : `${pendingCount} Pedidos Pendientes`}</span>
        </Link>
      </div>
    );
  }

  return null;
}