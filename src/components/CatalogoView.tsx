"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

interface Ramo {
  id: string;
  nombre: string;
  precio_base: number;
  es_oferta: boolean;
  precio_oferta: number | null;
  foto_principal: string | null;
  categoria_id: string;
  envoltura: string | null;
  flores: string[];
}

interface SubCategoria {
  id: string;
  nombre: string;
  foto: string | null;
}

interface CatalogoViewProps {
  categoriaNombre: string;
  categoriaDescripcion?: string | null;
  categoriaPortada?: string | null;
  subcategorias: SubCategoria[];
  ramos: Ramo[];
}

export default function CatalogoView({ 
  categoriaNombre, 
  categoriaDescripcion,
  categoriaPortada,
  subcategorias, 
  ramos 
}: CatalogoViewProps) {
  
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  const ramosFiltrados = useMemo(() => {
    if (!selectedSubId) return ramos;
    return ramos.filter(r => r.categoria_id === selectedSubId);
  }, [selectedSubId, ramos]);

  // Función para calcular porcentaje de descuento
  const getDiscountPercent = (base: number, offer: number) => {
    if (!base || !offer) return 0;
    return Math.round(((base - offer) / base) * 100);
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] pb-20">
      
      <div className="relative h-[35vh] w-full overflow-hidden bg-black">
        {categoriaPortada ? (
          <Image 
            src={categoriaPortada} 
            alt={categoriaNombre} 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] to-[#2D2D2D]" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-4xl md:text-5xl text-[#F3E5AB] italic drop-shadow-lg mb-2">
            {categoriaNombre}
          </h1>
          {categoriaDescripcion && (
            <p className="text-white/90 text-sm md:text-base font-light max-w-xl font-serif">
              "{categoriaDescripcion}"
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        
        {/* SELECTOR DE SUBCATEGORÍAS */}
        {subcategorias.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <button 
                onClick={() => setSelectedSubId(null)}
                className={`flex flex-col items-center group transition-all duration-300 ${selectedSubId === null ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 bg-white shadow-sm transition-colors ${selectedSubId === null ? 'border-[#C5A059]' : 'border-gray-200 group-hover:border-[#C5A059]'}`}>
                   <span className="text-xl">∞</span>
                </div>
                <span className={`font-serif text-xs uppercase tracking-wider ${selectedSubId === null ? 'text-[#C5A059] font-bold' : 'text-gray-500'}`}>Todos</span>
              </button>

              {subcategorias.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubId(sub.id === selectedSubId ? null : sub.id)}
                  className={`flex flex-col items-center group transition-all duration-300 ${selectedSubId === sub.id ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                >
                  <div className={`w-16 h-16 relative rounded-full border-2 overflow-hidden mb-2 shadow-sm transition-colors ${selectedSubId === sub.id ? 'border-[#C5A059]' : 'border-gray-200 group-hover:border-[#C5A059]'}`}>
                    {sub.foto ? (
                      <Image src={sub.foto} alt={sub.nombre} fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-50 text-xs">❀</div>
                    )}
                  </div>
                  <span className={`font-serif text-xs uppercase tracking-wider ${selectedSubId === sub.id ? 'text-[#C5A059] font-bold' : 'text-gray-500'}`}>
                    {sub.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {ramosFiltrados.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <span className="text-4xl block mb-2">🥀</span>
            <p className="font-serif text-lg">No hay diseños disponibles aquí.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {ramosFiltrados.map((ramo) => (
              <Link 
                key={ramo.id} 
                href={`/producto/${ramo.id}`}
                className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border flex flex-col h-full ${ramo.es_oferta ? 'border-red-100 ring-1 ring-red-50' : 'border-gray-100'}`}
              >
                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  {ramo.foto_principal ? (
                    <Image 
                      src={ramo.foto_principal} 
                      alt={ramo.nombre} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300 text-2xl">💐</div>
                  )}
                  
                  {/* BADGE DE OFERTA */}
                  {ramo.es_oferta && ramo.precio_oferta && (
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse uppercase tracking-wider">
                        Oferta
                      </span>
                      <span className="bg-white/90 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-red-100">
                        -{getDiscountPercent(ramo.precio_base, ramo.precio_oferta)}%
                      </span>
                    </div>
                  )}
                  
                  {/* PRECIO FLOTANTE */}
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-[#C5A059] shadow-sm flex flex-col items-end">
                    {ramo.es_oferta && ramo.precio_oferta ? (
                      <>
                        <span className="text-[9px] text-gray-400 line-through decoration-red-300">Bs {ramo.precio_base}</span>
                        <span className="text-red-500 text-sm">Bs {ramo.precio_oferta}</span>
                      </>
                    ) : (
                      <span>Bs {ramo.precio_base}</span>
                    )}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-serif text-sm text-[#0A0A0A] font-bold mb-2 leading-tight line-clamp-2 group-hover:text-[#C5A059] transition-colors">
                    {ramo.nombre}
                  </h4>
                  
                  <div className="w-full h-px bg-gray-100 mb-2"></div>

                  <div className="text-[10px] text-gray-500 space-y-1 leading-tight flex-1">
                     {ramo.flores.length > 0 ? (
                       ramo.flores.slice(0, 3).map((f, i) => (
                         <div key={i} className="flex items-center gap-1">
                           <span className="text-[#C5A059]">•</span> {f}
                         </div>
                       ))
                     ) : (
                       <span className="italic opacity-50">Sin detalle de flores</span>
                     )}
                     
                     {ramo.flores.length > 3 && (
                       <div className="text-[9px] italic pl-2 opacity-70">+ {ramo.flores.length - 3} elementos más</div>
                     )}

                     {ramo.envoltura && (
                        <div className="flex items-center gap-1 mt-1 pt-1 border-t border-dashed border-gray-100">
                           <span className="text-gray-400">🎁Envoltura</span> {ramo.envoltura}
                        </div>
                     )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}