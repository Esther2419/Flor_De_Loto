import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";

export default async function DetallePage({ params }: { params: { type: string, id: string } }) {
  const { type, id } = params;
  const numericId = BigInt(id);

  let data: any = null;

  // Carga de datos según el tipo de producto
  if (type === 'ramo') {
    data = await prisma.ramos.findUnique({ 
      where: { id: numericId },
      include: {
        ramo_envolturas: { include: { envolturas: true } },
        ramo_detalle: { include: { flores: true } }
      }
    });
  } else if (type === 'flor') {
    data = await prisma.flores.findUnique({ where: { id: numericId } });
  } else if (type === 'envoltura') {
    data = await prisma.envolturas.findUnique({ where: { id: numericId } });
  }

  if (!data) return notFound();

  const precio = data.precio_base || data.precio_unitario || data.precio || 0;
  const foto = data.foto_principal || data.foto;
  const descripcion = data.descripcion || `Selección de alta calidad: ${data.nombre}.`;

  const floresRaw = data.ramo_detalle?.map((d: any) => ({ ...d.flores, cantidad: d.cantidad || 1 })) || [];
  const envolturasRaw = data.ramo_envolturas?.map((e: any) => ({ ...e.envolturas, cantidad: e.cantidad || 1 })) || [];

  const agruparItems = (items: any[]) => {
    const agrupados = items.reduce((acc: any, item: any) => {
      if (acc[item.id]) {
        acc[item.id].cantidad += item.cantidad;
      } else {
        acc[item.id] = { ...item };
      }
      return acc;
    }, {});
    return Object.values(agrupados);
  };

  const flores = agruparItems(floresRaw);
  const envolturas = agruparItems(envolturasRaw);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 pt-32 flex flex-col md:flex-row gap-12">
        {/* Galería de Imagen */}
        <div className="flex-1 aspect-square relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-100">
          {foto ? (
            <Image src={foto} alt={data.nombre} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400">Sin foto</div>
          )}
        </div>

        {/* Información del Producto */}
        <div className="flex-1 flex flex-col justify-center py-4">
          <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-4">
            <span>Catálogo</span>
            <span className="text-zinc-300">/</span>
            <span>{type}</span>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 uppercase tracking-tighter leading-none">
            {data.nombre}
          </h1>
          
          <p className="text-zinc-500 text-lg mb-8 leading-relaxed max-w-md">
            {descripcion}
          </p>

          {type === 'ramo' && (
            <div className="space-y-6 mb-8 border-t border-zinc-100 pt-6">
              
              {flores.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-400 uppercase font-bold tracking-widest mb-3">Flores</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {flores.map((flor: any) => (
                          <li key={`flor-${flor.id}`} className="flex items-center gap-3 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                              <div className="w-12 h-12 rounded-lg border border-white shadow-sm relative overflow-hidden flex-shrink-0 bg-white">
                                  {flor.foto ? (
                                      <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />
                                  ) : (
                                      <div className="flex items-center justify-center h-full text-lg">🌸</div>
                                  )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-zinc-700 font-medium">{flor.nombre}</span>
                                {flor.cantidad && <span className="text-[10px] text-zinc-500 font-bold">x{flor.cantidad}</span>}
                              </div>
                          </li>
                      ))}
                  </ul>
                </div>
              )}

              {envolturas.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-400 uppercase font-bold tracking-widest mb-3">Presentación</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {envolturas.map((env: any) => (
                          <li key={`env-${env.id}`} className="flex items-center gap-3 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                              <div className="w-12 h-12 rounded-lg border border-white shadow-sm relative overflow-hidden flex-shrink-0 bg-white">
                                  {env.foto ? (
                                      <Image src={env.foto} alt={env.nombre} fill className="object-cover" />
                                  ) : (
                                      <div className="flex items-center justify-center h-full text-lg">🎁</div>
                                  )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-zinc-700 font-medium">{env.nombre}</span>
                                {env.cantidad && <span className="text-[10px] text-zinc-500 font-bold">x{env.cantidad}</span>}
                              </div>
                          </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-10">
            <span className="text-sm text-zinc-400 uppercase font-bold block mb-1">Precio actual</span>
            <span className="text-4xl font-light text-zinc-900">Bs. {Number(precio).toFixed(2)}</span>
          </div>

          <AddToCartButton 
            id={id}
            nombre={data.nombre}
            precio={Number(precio)}
            foto={foto}
            type={type} 
            className="w-full md:w-max px-12 py-5 text-sm"
          />
        </div>
      </div>
    </main>
  );
}