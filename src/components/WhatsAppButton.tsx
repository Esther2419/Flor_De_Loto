"use client";

import { MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function WhatsAppButton({ pedido }: { pedido: any }) {
  const handleWhatsApp = () => {
    const numeroTienda = "59162646545";

    // Formateamos la hora desde la fecha de entrega
    const hora = format(new Date(pedido.fecha_entrega), "HH:mm");

    // Construcción del mensaje EXACTO solicitado
    let mensaje = `*NUEVO PEDIDO # ${pedido.id}*\n\n`;
    mensaje += `*Cliente:* ${pedido.nombre_contacto}\n`;
    mensaje += `*WhatsApp:* ${pedido.telefono_contacto}\n`;
    mensaje += `*Recoge:* ${pedido.nombre_receptor}\n`;
    mensaje += `*Hora:* ${hora}\n\n`;
    
    mensaje += `*PRODUCTOS:*\n`;
    
    pedido.detalle_pedidos.forEach((det: any) => {
      // Línea del producto: "- 1x Nombre (Bs Precio)"
      mensaje += `- ${det.cantidad}x ${det.ramos.nombre} (Bs ${det.precio_unitario})\n`;
      
      // Si tiene personalización, agregamos la línea debajo con sangría e itálica
      if (det.personalizacion) {
        mensaje += `  _Personalizado_\n`;
      }
    });

    mensaje += `\n*TOTAL: Bs ${pedido.total_pagar}*`;
    
    // Abrir WhatsApp
    window.open(`https://wa.me/${numeroTienda}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <button 
      onClick={handleWhatsApp}
      className="w-full md:w-auto bg-[#25D366] text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#20bd5a] transition-all shadow-lg shadow-[#25D366]/20"
    >
      <MessageCircle size={16} />
      Notificar WhatsApp
    </button>
  );
}