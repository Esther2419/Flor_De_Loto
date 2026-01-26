import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import Image from "next/image";

export default async function DetallePage({ params }: { params: { type: string, id: string } }) {
  const { type, id } = params;
  const numericId = BigInt(id);

  let data: any = null;

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

  const flores = data.ramo_detalle?.map((d: any) => ({ 
    ...d.flores, 
    cantidad: d.cantidad_base || 1 
  })) || [];

  const envolturas = data.ramo_envolturas?.map((e: any) => ({ 
    ...e.envolturas, 
    cantidad: e.cantidad || 1 
  })) || [];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      {/* Ajuste de contenedor: flex-row siempre, con gap reducido en móvil */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-24 md:pt-32 flex flex-row gap-4 md:gap-12 items-start">
        
        {/* Galería de Imagen: Tamaño reducido en móvil (w-1/3) y fijo en escritorio */}
        <div className="w-1/3 md:flex-1 aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg md:shadow-2xl border border-zinc-100 flex-shrink-0">
          {foto ? (
            <Image src={foto} alt={data.nombre} fill className="object-cover" priority />
          ) : (
            <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs">Sin foto</div>
          )}
        </div>

        {/* Información del Producto: w-2/3 en móvil para compensar la imagen */}
        <div className="w-2/3 md:flex-1 flex flex-col justify-start py-0 md:py-4">
          <nav className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2 md:mb-4">
            <span>Catálogo</span>
            <span className="text-zinc-300">/</span>
            <span>{type}</span>
          </nav>
          
          <h1 className="text-xl md:text-5xl font-black text-zinc-900 mb-2 md:mb-6 uppercase tracking-tighter leading-tight md:leading-none">
            {data.nombre}
          </h1>
          
          <p className="text-zinc-500 text-xs md:text-lg mb-4 md:mb-8 leading-relaxed max-w-md line-clamp-3 md:line-clamp-none">
            {descripcion}
          </p>

          {/* Detalles de Flores y Presentación (Ocultos o compactos en móvil para mantener el diseño) */}
          {type === 'ramo' && (
            <div className="hidden md:block space-y-6 mb-8 border-t border-zinc-100 pt-6">
              {flores.length > 0 && (
                <div>
                  <h3 className="text-sm text-zinc-400 uppercase font-bold tracking-widest mb-3">Flores</h3>
                  <ul className="grid grid-cols-2 gap-3">
                      {flores.map((flor: any) => (
                          <li key={`flor-${flor.id}`} className="flex items-center gap-3 bg-zinc-50 p-2 rounded-xl border border-zinc-100">
                              <div className="w-10 h-10 rounded-lg border border-white shadow-sm relative overflow-hidden flex-shrink-0 bg-white">
                                  {flor.foto ? <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" /> : <div className="text-center">🌸</div>}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-700 font-medium">{flor.nombre}</span>
                                <span className="text-[8px] text-zinc-500 font-bold">x{flor.cantidad}</span>
                              </div>
                          </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-4 md:mb-10">
            <span className="text-[8px] md:text-sm text-zinc-400 uppercase font-bold block mb-1">Precio</span>
            <span className="text-lg md:text-4xl font-light text-zinc-900">Bs. {Number(precio).toFixed(2)}</span>
          </div>

          <AddToCartButton 
            id={id}
            nombre={data.nombre}
            precio={Number(precio)}
            foto={foto}
            type={type} 
            className="w-full md:w-max px-4 md:px-12 py-3 md:py-5 text-[10px] md:text-sm"
          />
        </div>
      </div>
    </main>
  );
}