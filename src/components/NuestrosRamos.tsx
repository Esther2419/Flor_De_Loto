"use client";

import { useState } from "react";
import Image from "next/image";
import AddToCartButton from "./AddToCartButton";

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

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 15);
  };

  const visibleRamos = ramos.slice(0, visibleCount);

  return (
    <section id="ramos" className="pt-0 -mt-4 pb-16 px-4 bg-white scroll-mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-sans tracking-[0.3em] text-[#C5A059] uppercase mb-0 block">
            Catálogo Completo
          </span>
          <h2 className="font-serif text-2xl md:text-3xl text-[#0A0A0A] italic drop-shadow-sm">
            Nuestros Ramos
          </h2>
          <div className="w-12 h-0.5 bg-[#C5A059] mx-auto rounded-full mt-2" />
        </div>

        {ramos.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <p>No hay ramos disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {visibleRamos.map((ramo) => (
                <div 
                  key={ramo.id} 
                  className={`group relative bg-white rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-xl ${!ramo.activo ? 'opacity-80' : 'hover:-translate-y-1'}`}
                >
                  {/* Imagen */}
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    {ramo.foto_principal ? (
                      <Image 
                        src={ramo.foto_principal} 
                        alt={ramo.nombre} 
                        fill 
                        className={`object-cover transition-transform duration-700 ${ramo.activo ? 'group-hover:scale-110' : 'grayscale'}`} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 text-2xl">💐</div>
                    )}

                    {/* Badge No Disponible */}
                    {!ramo.activo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
                          No Disponible
                        </span>
                      </div>
                    )}

                    {/* Badge Oferta */}
                    {ramo.activo && ramo.es_oferta && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider z-10">
                        Oferta
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1">
                    <h3 className="font-serif text-sm font-bold text-[#0A0A0A] line-clamp-2 min-h-[2.5em] leading-tight group-hover:text-[#C5A059] transition-colors">
                      {ramo.nombre}
                    </h3>
                    
                    <div className="flex items-baseline gap-2 mt-1">
                      {ramo.es_oferta && ramo.precio_oferta ? (
                        <>
                          <span className="text-red-500 font-bold text-base">Bs {ramo.precio_oferta}</span>
                          <span className="text-gray-400 text-[10px] line-through">Bs {ramo.precio_base}</span>
                        </>
                      ) : (
                        <span className="text-[#C5A059] font-bold text-base">Bs {ramo.precio_base}</span>
                      )}
                    </div>

                    {ramo.activo && (
                      <div className="mt-2">
                        <AddToCartButton 
                          id={ramo.id}
                          nombre={ramo.nombre}
                          precio={ramo.es_oferta && ramo.precio_oferta ? ramo.precio_oferta : ramo.precio_base}
                          foto={ramo.foto_principal}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Ver Más */}
            {visibleCount < ramos.length && (
              <div className="flex justify-center mt-12">
                <button 
                  onClick={handleShowMore}
                  className="bg-transparent border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-sm hover:shadow-lg"
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