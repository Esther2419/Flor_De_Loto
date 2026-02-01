import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ClipboardList, AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import OrderCard from "./OrderCard";

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
        include: { 
          ramos: { include: { ramo_imagenes: true } }, 
          flores: true 
        }
      }
    }
  });

  const [catalogoFlores, catalogoEnvolturas] = await Promise.all([
    prisma.flores.findMany({ select: { id: true, nombre: true, color: true, foto: true } }),
    prisma.envolturas.findMany({ select: { id: true, nombre: true, foto: true } })
  ]);

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
              <OrderCard 
                key={pedido.id.toString()} 
                pedido={pedido}
                catalogoFlores={catalogoFlores}
                catalogoEnvolturas={catalogoEnvolturas}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}