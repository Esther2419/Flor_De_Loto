import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Flower2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedidos.findMany({
    orderBy: { fecha_pedido: 'desc' },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-serif italic text-gray-800">Panel de Pedidos</h2>
        <p className="text-sm text-gray-500">Gestión simplificada de pedidos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id.toString()} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4 font-sans hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-serif italic text-gray-800">Pedido #{pedido.id.toString()}</h2>
                    <div className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 
                    pedido.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                    }`}>
                    {pedido.estado}
                    </div>
                </div>
            </div>

            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Solicitado el:</p>
                <p className="text-xs text-gray-700 font-medium">
                {format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                </p>
            </div>

            <div className="space-y-0.5">
                <p className="text-base font-bold text-gray-800">{pedido.nombre_contacto}</p>
                <p className="text-xs text-gray-500 font-mono">{pedido.telefono_contacto}</p>
            </div>

            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Entrega:</p>
                <p className="text-xs text-gray-700 font-medium">
                {format(new Date(pedido.fecha_entrega), "dd/MM/yyyy - HH:mm")}
                </p>
            </div>

            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                <Link href={`/admin/pedidos/${pedido.id}`} className="text-[#C5A059] font-bold text-xs hover:underline uppercase tracking-wider">
                Ver Detalles
                </Link>
                <span className="text-sm font-serif italic text-gray-400">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flower2 className="text-gray-200" size={40} />
            </div>
            <p className="text-gray-400 font-serif italic text-xl">No hay pedidos registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
}