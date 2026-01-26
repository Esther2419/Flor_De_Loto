"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Ramo {
  id: string;
  nombre: string;
  precio_base: number;
  es_oferta: boolean;
  precio_oferta: number | null;
  foto_principal: string | null;
  activo: boolean;
}

export default function NuestrosRamos({ ramos }: { ramos: Ramo[] }) {
  const [visibleCount, setVisibleCount] = useState(15);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleCardClick = (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    router.push(`/detalles/ramo/${id}`);
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 15);
  };

  const visibleRamos = ramos.slice(0, visibleCount);

  return (
    <section id="ramos" className="pt-0 -mt-2 pb-8 px-2 md:px-4 bg-white scroll-mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#C5A059] uppercase mb-0 block">
            Catálogo Completo
          </span>
          <h2 className="font-serif text-xl md:text-2xl text-[#0A0A0A] italic drop-shadow-sm">
            Nuestros Ramos
          </h2>
          <div className="w-8 h-0.5 bg-[#C5A059] mx-auto rounded-full mt-1" />
        </div>

        {ramos.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-xs">
            <p>No hay ramos disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
              {visibleRamos.map((ramo) => (
                <div 
                  key={ramo.id} 
                  onClick={() => handleCardClick(ramo.id)}
                  className={`group relative bg-white rounded-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg block cursor-pointer ${!ramo.activo ? 'opacity-80' : 'hover:-translate-y-1'}`}
                >
                  {/* Imagen */}
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    {ramo.foto_principal ? (
                      <Image 
                        src={ramo.foto_principal} 
                        alt={ramo.nombre} 
                        fill 
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                        className={`object-cover transition-transform duration-700 ${ramo.activo ? 'group-hover:scale-110' : 'grayscale'}`} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-xl">💐</div>
                    )}

                    {/* Badge No Disponible */}
                    {!ramo.activo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">
                          Agotado
                        </span>
                      </div>
                    )}

                    {/* Badge Oferta */}
                    {ramo.activo && ramo.es_oferta && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider z-10">
                        Oferta
                      </div>
                    )}
                  </div>

                  <div className="p-2 flex flex-col gap-0.5">
                    <h3 className="font-serif text-xs font-bold text-[#0A0A0A] line-clamp-2 min-h-[2.4em] leading-tight group-hover:text-[#C5A059] transition-colors">
                      {ramo.nombre}
                    </h3>
                    
                    <div className="flex items-baseline gap-1.5 mt-2">
                      {ramo.es_oferta && ramo.precio_oferta ? (
                        <>
                          <span className="text-red-500 font-bold text-sm">Bs {ramo.precio_oferta}</span>
                          <span className="text-gray-400 text-[9px] line-through">Bs {ramo.precio_base}</span>
                        </>
                      ) : (
                        <span className="text-[#C5A059] font-bold text-sm">Bs {ramo.precio_base}</span>
                      )}
                    </div>

                    {ramo.activo && (
                      <button 
                        className="w-full mt-2 bg-[#050505] text-[#D4AF37] border border-[#D4AF37] py-1.5 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#050505] transition-colors flex items-center justify-center gap-2"
                        disabled={loadingId === ramo.id}
                      >
                        {loadingId === ramo.id ? (
                          <>
                            <Loader2 className="animate-spin w-3 h-3" />
                            <span>Cargando</span>
                          </>
                        ) : (
                          "Comprar"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Ver Más */}
            {visibleCount < ramos.length && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={handleShowMore}
                  className="bg-transparent border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Ver más diseños
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}