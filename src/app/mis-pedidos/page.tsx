import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Package, Calendar, Clock, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

export default async function MisPedidosPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/mis-pedidos");
  }

  const pedidos = await prisma.pedidos.findMany({
    where: {
      usuarios: { email: session.user?.email! }
    },
    orderBy: { fecha_pedido: 'desc' },
    include: {
      detalle_pedidos: {
        include: { ramos: true }
      }
    }
  }); //

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-32 pb-20 px-4 animate-in fade-in duration-700">
        <div className="mb-10">
          <h1 className="font-serif italic text-4xl text-gris flex items-center gap-4">
            <ClipboardList className="text-[#C5A059]" size={36} />
            Historial de Pedidos
          </h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] mt-2">Gestiona y revisa tus compras anteriores</p>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200">
            <Package className="mx-auto text-gray-200 mb-4" size={64} />
            <p className="font-serif italic text-xl text-gray-400">Aún no has realizado ningún pedido.</p>
            <Link href="/#ramos" className="inline-block mt-8 bg-[#C5A059] text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#b38f4d] transition-all shadow-lg shadow-[#C5A059]/20">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id.toString()} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 border border-gray-100 uppercase tracking-tighter">
                        Pedido #{pedido.id.toString()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        pedido.estado === 'pendiente' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                        pedido.estado === 'completado' ? 'bg-green-50 text-green-600 border border-green-100' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">{format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} />
                        <span className="text-xs font-medium">Recojo: {pedido.direccion_entrega?.split(' a las ')[1] || '--:--'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3 overflow-hidden">
                      {pedido.detalle_pedidos.map((detalle, idx) => (
                        <div key={detalle.id.toString()} className="relative w-12 h-12 rounded-full border-2 border-white bg-gray-100 overflow-hidden shadow-sm" style={{ zIndex: 10 - idx }}>
                          <Image 
                            src={detalle.ramos.foto_principal || "/portada.jpg"} 
                            alt={detalle.ramos.nombre} 
                            fill 
                            className="object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                    {pedido.detalle_pedidos.length > 3 && (
                      <span className="text-[10px] font-bold text-gray-400">+{pedido.detalle_pedidos.length - 3} más</span>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Pagado</p>
                    <p className="text-2xl font-bold text-[#C5A059] font-serif italic tracking-tighter">Bs {Number(pedido.total_pagar).toFixed(2)}</p>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}