"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { es } from "date-fns/locale";

interface WhatsAppButtonProps {
  pedido: any;
}

export default function WhatsAppButton({ pedido }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const fechaBase = new Date(pedido.fecha_entrega);
    const zonaHorariaOffset = fechaBase.getTimezoneOffset();
    const fechaAjustada = addMinutes(fechaBase, zonaHorariaOffset);
    const horaFormateada = format(fechaAjustada, "hh:mm aa");

    const productosTexto = pedido.detalle_pedidos
      .map((detalle: any) => {
        let itemStr = `- ${detalle.cantidad}x ${detalle.ramos.nombre} (Bs ${Number(detalle.precio_unitario).toFixed(0)})`;
        if (detalle.personalizacion) {
          itemStr += `\n  _Personalizado_`;
        }
        return itemStr;
      })
      .join("\n");

    const mensaje = `*NUEVO PEDIDO ${pedido.id}*

*Cliente:* ${pedido.nombre_contacto}
*WhatsApp:* ${pedido.telefono_contacto}
*Recoge:* ${pedido.nombre_receptor}
*Hora:* ${horaFormateada}

*PRODUCTOS:*
${productosTexto}

*TOTAL: Bs ${Number(pedido.total_pagar).toFixed(0)}*`;

    const mensajeCodificado = encodeURIComponent(mensaje);
    
    window.open(`https://wa.me/59162646545?text=${mensajeCodificado}`, "_blank");
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#128C7E] transition-all shadow-lg shadow-green-500/20"
    >
      <MessageCircle size={16} />
      Notificar por WhatsApp
    </button>
  );
}