import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Package, Flower2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedidos.findMany({
    orderBy: { fecha_pedido: 'desc' },
    include: {
      usuarios: true,
      detalle_pedidos: {
        include: {
          ramos: true
        }
      }
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-serif italic text-gray-800">Pedidos Recientes</h2>
        <p className="text-sm text-gray-500">Gestión de pedidos entrantes.</p>
      </div>

      <div className="grid gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id.toString()} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            {/* Cabecera del Pedido */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 pb-4 border-b border-gray-50">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[#C5A059] font-bold text-lg">#{pedido.id.toString()}</span>
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                    pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                    pedido.estado === 'completado' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {pedido.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {/* HORA MODIFICADA A AM/PM */}
                  Creado el: {format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy - hh:mm aa", { locale: es })}
                </p>
              </div>
              <div className="text-right">
                 <p className="text-sm font-bold text-gray-800">{pedido.nombre_contacto}</p>
                 <p className="text-xs text-gray-500">{pedido.telefono_contacto}</p>
                 <div className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-600 inline-block max-w-xs text-left border border-gray-100">
                    <p><span className="font-bold">Recoge:</span> {pedido.nombre_receptor}</p>
                    {/* HORA MODIFICADA A AM/PM */}
                    <p className="mt-1"><span className="font-bold">Para el:</span> {format(new Date(pedido.fecha_entrega), "dd/MM/yyyy hh:mm aa")}</p>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              {pedido.detalle_pedidos.map((detalle) => (
                <div key={detalle.id.toString()} className="flex justify-between items-start text-sm bg-gray-50/50 p-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 relative overflow-hidden shrink-0 border border-gray-200">
                      {detalle.ramos.foto_principal ? (
                        <Image 
                          src={detalle.ramos.foto_principal} 
                          alt={detalle.ramos.nombre} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                           <Package size={16} />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-800">
                        {detalle.cantidad}x {detalle.ramos.nombre}
                      </p>
                      {detalle.personalizacion && (
                         <div className="text-[10px] text-gray-500 bg-white border border-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            🎨 Personalizado
                         </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-gray-600">Bs {Number(detalle.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-400 uppercase tracking-widest">Total a Pagar</span>
              <span className="text-xl font-bold text-[#C5A059] font-serif italic">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flower2 className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-400 font-serif italic">No hay pedidos registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}