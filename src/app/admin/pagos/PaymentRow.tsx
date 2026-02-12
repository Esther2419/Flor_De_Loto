"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ZoomIn, MessageSquare, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentRow({ pedido }: { pedido: any }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!pedido.comprobante_pago) return null;

  return (
    <>
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center transition-all hover:shadow-md">
      {/* Imagen del Comprobante */}
      <div className="relative w-full md:w-32 h-48 md:h-32 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group">
        <Image 
          src={pedido.comprobante_pago} 
          alt="Comprobante" 
          fill 
          className="object-cover"
        />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
        >
          <ZoomIn size={20} />
        </button>
      </div>

      {/* Información */}
      <div className="flex-1 space-y-2 w-full">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Titular de Cuenta</p>
            <h3 className="font-bold text-gray-800 text-lg capitalize">{pedido.titular_cuenta || "No especificado"}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                pedido.pago_confirmado === 'pago total' ? 'bg-green-100 text-green-700' :
                pedido.pago_confirmado === 'pago parcial' ? 'bg-blue-100 text-blue-700' :
                pedido.pago_confirmado === 'rechazado' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
            }`}>
                {pedido.pago_confirmado || 'pendiente'}
            </div>
            <p className="text-[9px] text-gray-400 font-medium italic">
                Estado del pedido: {pedido.estado}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <p>Monto Transferido: <span className="font-bold text-[#C5A059]">Bs {Number(pedido.monto_transferencia || pedido.total_pagar).toFixed(2)}</span></p>
          <p>Fecha Pedido: {pedido.fecha_pedido ? format(new Date(pedido.fecha_pedido), "dd MMM, HH:mm", { locale: es }) : '-'}</p>
        </div>

        {/* Mensaje / Observación */}
        {pedido.observacion_pago && (
          <div className="bg-blue-50 p-3 rounded-xl text-xs text-blue-800 flex gap-2 items-start mt-2">
            <MessageSquare size={14} className="shrink-0 mt-0.5" />
            <p>{pedido.observacion_pago}</p>
          </div>
        )}
      </div>
    </div>

    {/* Modal de Comprobante */}
    <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
              >
                <X size={32} />
              </button>
              <div className="relative w-full h-full">
                 <Image 
                    src={pedido.comprobante_pago} 
                    alt="Comprobante Full" 
                    fill 
                    className="object-contain"
                 />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
