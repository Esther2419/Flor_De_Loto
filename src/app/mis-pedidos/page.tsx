import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Package, Calendar, Clock, ClipboardList, AlertCircle, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";

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
  });

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-32 pb-20 px-4 animate-in fade-in duration-700">
        <div className="mb-10">
          <h1 className="font-serif italic text-4xl text-gris flex items-center gap-4">
            <ClipboardList className="text-[#C5A059]" size={36} />
            Historial de Pedidos
          </h1>
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.3em] mt-2">Gestiona y revisa tus pedidos</p>
        </div>

        {/* Aviso de Prioridad WhatsApp */}
        <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 p-5 rounded-[1.5rem] flex gap-4 items-start shadow-sm mb-8">
          <AlertCircle className="text-[#C5A059] shrink-0 mt-0.5" size={22} />
          <p className="text-sm text-gris/80 leading-relaxed">
            <span className="font-bold text-[#C5A059] uppercase tracking-wider">Aviso importante:</span> Si quieres que tu pedido sea visto lo antes posible, notifica al administrador por WhatsApp usando el botón de cada pedido.
          </p>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Package className="text-gray-300" size={40} />
            </div>
            <p className="font-serif italic text-xl text-gray-400">Aún no has realizado ningún pedido.</p>
            <Link href="/#ramos" className="inline-block mt-8 bg-[#C5A059] text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-[#b38f4d] transition-all shadow-lg shadow-[#C5A059]/20">
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id.toString()} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 border border-gray-100 uppercase tracking-tighter">
                        Pedido #{pedido.id.toString()}
                      </span>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        pedido.estado === 'pendiente' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        pedido.estado === 'completado' ? 'bg-green-50 text-green-600 border-green-100' :
                        'bg-gray-50 text-gray-600 border-gray-100'
                      }`}>
                        {pedido.estado}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span className="text-xs font-medium">
                          {format(new Date(pedido.fecha_entrega), "dd 'de' MMMM", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} />
                        <span className="text-xs font-medium">
                          Hora: {format(new Date(pedido.fecha_entrega), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} />
                        <span className="text-xs font-medium">
                           Recoge: <span className="text-gray-600">{pedido.nombre_receptor}</span>
                        </span>
                      </div>
                    </div>

                    {/* Detalle de productos */}
                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-[10px] font-bold uppercase text-gray-300 tracking-widest mb-2">Productos:</p>
                      {pedido.detalle_pedidos.map((detalle) => (
                        <div key={detalle.id.toString()} className="flex justify-between text-sm py-1">
                          <span className="text-gris/70 flex items-center gap-2">
                            {detalle.cantidad}x {detalle.ramos.nombre}
                            {detalle.personalizacion && (
                               <span className="text-[9px] bg-yellow-50 text-yellow-700 px-1 rounded uppercase font-bold">Pers.</span>
                            )}
                          </span>
                          <span className="font-bold text-gris">Bs {Number(detalle.precio_unitario) * detalle.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between min-w-[200px] gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total a Pagar</p>
                      <p className="text-3xl font-bold text-[#C5A059] font-serif italic tracking-tighter">Bs {Number(pedido.total_pagar).toFixed(2)}</p>
                    </div>

                    <WhatsAppButton pedido={pedido} />
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