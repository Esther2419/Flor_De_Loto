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
    // 1. Obtenemos la fecha original
    const fechaBase = new Date(pedido.fecha_entrega);
    
    // 2. Corregimos el desfase de zona horaria para que sea 
    // exactamente igual a lo que el usuario ve en la tabla
    const zonaHorariaOffset = fechaBase.getTimezoneOffset();
    const fechaAjustada = addMinutes(fechaBase, zonaHorariaOffset);

    // 3. Formateamos con AM/PM
    const fechaFormateada = format(
      fechaAjustada, 
      "dd 'de' MMMM 'a las' hh:mm aa", 
      { locale: es }
    );

    const mensaje = `Hola! Soy ${pedido.nombre_contacto}. Acabo de realizar el pedido #${pedido.id}. 
Fecha de recojo: ${fechaFormateada}. 
Persona que recoge: ${pedido.nombre_receptor}. 
Total: Bs ${Number(pedido.total_pagar).toFixed(2)}. 
Por favor, confírmenme la recepción.`;

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