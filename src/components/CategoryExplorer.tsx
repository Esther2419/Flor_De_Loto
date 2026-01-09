"use client";

import Image from "next/image";
import Link from "next/link";
// [MODIFICADO] Importamos useState
import { useRef, useState } from "react";

interface Category {
  id: string;
  nombre: string;
  foto: string | null;
  portada?: string | null;
  descripcion?: string | null;
  children: Category[];
}

export default function CategoryExplorer({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-16 relative group/section">
      
      {/* --- TÍTULO --- */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl md:text-4xl text-[#9f7321ff] italic mb-3 drop-shadow-sm">
          Categorías
        </h2>
        <div className="w-16 h-1 bg-[#9f7321ff] mx-auto rounded-full" />
        <p className="mt-4 text-[#5D4E4E] font-['Lato'] text-sm md:text-base tracking-wide">
          Selecciona una categoría para ver sus opciones
        </p>
      </div>

      {/* --- CONTENEDOR CARRUSEL --- */}
      <div className="relative"> 
        
        {/* Flecha Izquierda */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#9f7321ff] text-[#9f7321ff] hover:text-white p-2 rounded-full shadow-lg border border-[#9f7321ff]/30 transition-all duration-300 backdrop-blur-sm -ml-4 md:-ml-8 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div 
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-8 overflow-x-auto overflow-y-hidden pb-8 snap-x snap-mandatory px-12 md:px-24 -mx-4 scrollbar-hide scroll-smooth touch-pan-y pt-4" 
        >
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/catalogo/${cat.id}`}
              onClick={() => setLoadingId(cat.id)}
              className="flex-none w-[100px] md:w-[130px] py-2 flex flex-col items-center group cursor-pointer snap-center relative"
            >
              
              {loadingId === cat.id && (
                 <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl transition-all duration-300">
                    <div className="w-8 h-8 border-4 border-[#9f7321ff] border-t-transparent rounded-full animate-spin"></div>
                 </div>
              )}

              {/* --- TARJETA EMERGENTE DE TIPO TOOLTIP --- */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-2xl border border-[#9f7321ff]/20 overflow-hidden z-50 pointer-events-none
                              opacity-0 scale-75 translate-y-12 
                              group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-y-4
                              transition-all duration-500 ease-pop origin-bottom">
                
                <div className="h-20 w-full relative bg-[#9f7321ff]/5">
                  {cat.portada ? (
                    <Image src={cat.portada} alt="Portada" fill className="object-cover opacity-90" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                </div>

                <div className="px-4 pb-5 pt-2 text-center relative">
                   <div className="w-14 h-14 mx-auto -mt-10 mb-2 relative rounded-full border-[3px] border-white shadow-sm overflow-hidden bg-white">
                      {cat.foto ? (
                        <Image src={cat.foto} alt={cat.nombre} fill className="object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-xs text-[#9f7321ff]">❀</span>
                      )}
                   </div>
                   <h4 className="font-serif text-[#9f7321ff] italic text-xl leading-tight mb-2">{cat.nombre}</h4>
                   {cat.descripcion && (
                     <p className="text-xs text-[#5D4E4E]/80 line-clamp-3 leading-snug">
                       {cat.descripcion}
                     </p>
                   )}
                </div>
              </div>

              <div className="w-full relative z-10 transition-all duration-500 group-hover:scale-50 group-hover:opacity-0 origin-center">
                 <div className="w-full p-1.5 rounded-full border-2 border-[#9f7321ff]/30 bg-white/50">
                    <div className="relative aspect-square w-full overflow-hidden rounded-full border border-white shadow-sm">
                      {cat.foto ? (
                        <Image
                          src={cat.foto}
                          alt={cat.nombre}
                          fill
                          sizes="(max-width: 768px) 100px, 130px"
                          className="object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white flex items-center justify-center">
                           <span className="text-3xl text-[#9f7321ff]/30">❀</span>
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              {/* Nombre de Categoría */}
              <div className="mt-3 text-center px-1 transition-opacity duration-300 group-hover:opacity-0">
                <h3 className="font-serif text-xs md:text-sm font-medium text-[#5D4E4E] leading-tight">
                  {cat.nombre}
                </h3>
              </div>
            </Link>
          ))}
          <div className="w-4 flex-none" />
        </div>

        {/* Flecha Derecha */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#9f7321ff] text-[#9f7321ff] hover:text-white p-2 rounded-full shadow-lg border border-[#9f7321ff]/30 transition-all duration-300 backdrop-blur-sm -mr-4 md:-mr-8 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}