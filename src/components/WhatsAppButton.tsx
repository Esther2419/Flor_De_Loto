"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { formatInTimeZone } from 'date-fns-tz';
import { es } from "date-fns/locale";

interface WhatsAppButtonProps {
  pedido: any;
}

export default function WhatsAppButton({ pedido }: WhatsAppButtonProps) {
  const handleWhatsAppClick = () => {
    const fechaFormateada = formatInTimeZone(new Date(pedido.fecha_entrega), 'America/La_Paz', "dd 'de' MMMM 'de' yyyy", { locale: es });
    const horaFormateada = formatInTimeZone(new Date(pedido.fecha_entrega), 'America/La_Paz', 'hh:mm aa');

    const productosTexto = pedido.detalle_pedidos
      .map((detalle: any) => {
        const nombreProducto = detalle.ramos?.nombre || detalle.flores?.nombre || "Producto desconocido";
        
        // Verificamos si es oferta en la relación o en el JSON de personalización del detalle
        const esOferta = detalle.ramos?.es_oferta || (detalle.personalizacion as any)?.esOferta;
        const etiquetaOferta = esOferta ? " 🔥[OFERTA]🔥" : "";
        
        let itemStr = `- ${detalle.cantidad}x ${nombreProducto}${etiquetaOferta} (Bs ${Number(detalle.precio_unitario).toFixed(0)})`;
        
        const fotoRaw = detalle.ramos?.foto_principal || detalle.flores?.foto;
        if (fotoRaw) {
          let fotoUrl = "";
          if (fotoRaw.startsWith("http://") || fotoRaw.startsWith("https://")) {
            fotoUrl = fotoRaw;
          } else {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            fotoUrl = `${origin}${fotoRaw.startsWith("/") ? "" : "/"}${fotoRaw}`;
          }
          itemStr += `\n  🖼️ *Imagen del Arreglo:* ${fotoUrl}`;
        }

        let pers: any = null;
        if (detalle.personalizacion) {
          try {
            pers = typeof detalle.personalizacion === "string" 
              ? JSON.parse(detalle.personalizacion) 
              : detalle.personalizacion;
          } catch (e) {
            pers = detalle.personalizacion;
          }
        }

        if (pers) {
          itemStr += `\n  _Personalizado_`;
          const dedicatoria = pers.dedicatoria;
          if (dedicatoria && typeof dedicatoria === "string" && dedicatoria.trim() !== "") {
            itemStr += `\n  💌 *Dedicatoria:* "${dedicatoria.trim()}"`;
          }
        }
        return itemStr;
      })
      .join("\n");

    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const linkPedido = `${origin}/admin/pedidos/${pedido.id}`;

    let comprobanteTexto = "";
    if (pedido.comprobante_pago) {
      let comprobanteUrl = "";
      if (pedido.comprobante_pago.startsWith("http://") || pedido.comprobante_pago.startsWith("https://")) {
        comprobanteUrl = pedido.comprobante_pago;
      } else {
        comprobanteUrl = `${origin}${pedido.comprobante_pago.startsWith("/") ? "" : "/"}${pedido.comprobante_pago}`;
      }
      comprobanteTexto = `\n📸 *Comprobante de Pago:* ${comprobanteUrl}`;
    }

    const mensaje = `*NUEVO PEDIDO ${pedido.id}*

*Cliente:* ${pedido.nombre_contacto}
*WhatsApp:* ${pedido.telefono_contacto}
*Recoge:* ${pedido.nombre_receptor}
*Fecha de Recojo:* ${fechaFormateada}
*Hora:* ${horaFormateada}

*PRODUCTOS:*
${productosTexto}

*TOTAL: Bs ${Number(pedido.total_pagar).toFixed(0)}*

Revisa el comprobante en la app.${comprobanteTexto}
Ver pedido realizado: ${linkPedido}`;

    window.open(`https://wa.me/59179783761?text=${encodeURIComponent(mensaje)}`, "_blank");
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