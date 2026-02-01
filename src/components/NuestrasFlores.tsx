"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, ShoppingBag, Loader2 } from "lucide-react";

interface Flor {
  id: string;
  nombre: string;
  precio_unitario: number;
  foto: string | null;
  disponible: boolean;
  color: string | null;
}

export default function NuestrasFlores({ flores }: { flores: Flor[] }) {
  const INITIAL_COUNT = 12;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleComprar = (id: string) => {
    setLoadingId(id);
    router.push(`/detalles/flor/${id}`);
  };

  const isExpanded = visibleCount >= flores.length;
  const visibleFlores = flores.slice(0, visibleCount);

  return (
    <section id="flores" className="py-12 px-2 md:px-4 bg-crema/30 scroll-mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#C5A059] uppercase mb-0 block">
            Variedad Natural
          </span>
          <h2 className="font-serif text-xl md:text-2xl text-[#0A0A0A] italic drop-shadow-sm">
            Nuestras Flores
          </h2>
          <div className="w-8 h-0.5 bg-[#C5A059] mx-auto rounded-full mt-1" />
        </div>

        {flores.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-xs">
            <p>No hay flores individuales disponibles en este momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
              {visibleFlores.map((flor) => (
                <div 
                  key={flor.id} 
                  onClick={() => flor.disponible && handleComprar(flor.id)}
                  className={`group bg-white rounded-md overflow-hidden border border-gray-100 transition-all duration-300 ${
                    !flor.disponible ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer hover:-translate-y-1'
                  }`}
                >
                  <div className="relative aspect-square bg-gray-100">
                    {flor.foto ? (
                      <Image 
                        src={flor.foto} 
                        alt={flor.nombre} 
                        fill 
                        className={`object-cover ${!flor.disponible ? 'grayscale' : ''}`} 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">🌸</div>
                    )}
                    {!flor.disponible && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <span className="bg-black/60 text-white text-[7px] px-2 py-0.5 rounded-full uppercase">Sin Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-center flex flex-col gap-1">
                    <h3 className="font-serif text-[11px] font-bold text-[#0A0A0A] truncate">
                      {flor.nombre} {flor.color || ""}
                    </h3>
                    <p className="text-[#C5A059] font-bold text-xs">Bs {flor.precio_unitario}</p>
                    
                    
                    {/* Botón Comprar explícito */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (flor.disponible) handleComprar(flor.id);
                      }}
                      disabled={!flor.disponible || loadingId === flor.id}
                      className="mt-1 w-full py-1.5 bg-[#0A0A0A] text-white text-[8px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-1 hover:bg-[#C5A059] transition-colors disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {loadingId === flor.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag className="w-3 h-3" />
                          Comprar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {flores.length > INITIAL_COUNT && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => setVisibleCount(isExpanded ? INITIAL_COUNT : prev => prev + 12)}
                  className="flex items-center gap-2 text-[#C5A059] text-[10px] font-bold uppercase tracking-[0.2em]"
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-4 h-4" /> Ver menos</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Ver más flores</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}