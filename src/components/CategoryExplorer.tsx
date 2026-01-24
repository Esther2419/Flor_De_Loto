"use client";

import Image from "next/image";
import Link from "next/link";
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
      const scrollAmount = 200; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 pt-1 pb-4 md:pt-2 md:pb-8 relative group/section">
      
      {/* --- TÍTULO --- */}
      <div className="text-center mb-2 md:mb-6">
        <h2 className="font-serif text-xl md:text-3xl text-[#9f7321ff] italic mb-1 drop-shadow-sm">
          Categorías
        </h2>
        <div className="w-8 md:w-12 h-0.5 bg-[#9f7321ff] mx-auto rounded-full" />
        
        <p className="mt-1 text-[#5D4E4E] font-['Lato'] text-[10px] md:text-sm tracking-wide opacity-80">
          Selecciona una categoría para ver sus opciones
        </p>
      </div>

      {/* --- CONTENEDOR CARRUSEL --- */}
      <div className="relative"> 
        
        {/* Flechas (Solo desktop) */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#9f7321ff] text-[#9f7321ff] hover:text-white p-1.5 rounded-full shadow-md border border-[#9f7321ff]/30 transition-all duration-300 backdrop-blur-sm -ml-2 md:-ml-6 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Se eliminó 'touch-pan-y' para permitir el scroll horizontal en móviles */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-2 md:gap-6 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory px-4 md:px-12 scrollbar-hide scroll-smooth items-center justify-start md:justify-center" 
        >
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/catalogo/${cat.id}`}
              onClick={() => setLoadingId(cat.id)}
              className="flex-none w-[72px] md:w-[110px] py-1 flex flex-col items-center group cursor-pointer snap-center relative"
            >
              
              {loadingId === cat.id && (
                 <div className="absolute inset-0 z-[60] flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl transition-all duration-300">
                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#9f7321ff] border-t-transparent rounded-full animate-spin"></div>
                 </div>
              )}

              {/* Tooltip (Solo desktop) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 bg-white rounded-lg shadow-xl border border-[#9f7321ff]/20 overflow-hidden z-50 pointer-events-none
                              opacity-0 scale-75 translate-y-8 
                              group-hover:opacity-100 group-hover:scale-100 group-hover:-translate-y-4
                              transition-all duration-500 ease-pop origin-bottom hidden md:block">
                <div className="h-16 w-full relative bg-[#9f7321ff]/5">
                  {cat.portada ? (
                    <Image src={cat.portada} alt="Portada" fill className="object-cover opacity-90" />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                </div>
                <div className="px-3 pb-3 pt-1 text-center relative">
                   <div className="w-10 h-10 mx-auto -mt-6 mb-1 relative rounded-full border-[2px] border-white shadow-sm overflow-hidden bg-white">
                      {cat.foto ? (
                        <Image src={cat.foto} alt={cat.nombre} fill className="object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-xs text-[#9f7321ff]">❀</span>
                      )}
                   </div>
                   <h4 className="font-serif text-[#9f7321ff] italic text-lg leading-tight mb-1">{cat.nombre}</h4>
                </div>
              </div>

              {/* Icono Círculo */}
              <div className="w-full relative z-10 transition-all duration-500 group-hover:scale-50 group-hover:opacity-0 origin-center">
                 <div className="w-full p-1 md:p-1.5 rounded-full border border-[#9f7321ff]/30 bg-white/50">
                    <div className="relative aspect-square w-full overflow-hidden rounded-full border border-white shadow-sm">
                      {cat.foto ? (
                        <Image
                          src={cat.foto}
                          alt={cat.nombre}
                          fill
                          sizes="(max-width: 768px) 70px, 110px"
                          className="object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-white flex items-center justify-center">
                           <span className="text-xl md:text-2xl text-[#9f7321ff]/30">❀</span>
                        </div>
                      )}
                    </div>
                  </div>
              </div>

              {/* Nombre Texto */}
              <div className="mt-1 md:mt-2 text-center px-1 transition-opacity duration-300 group-hover:opacity-0">
                <h3 className="font-serif text-[10px] md:text-xs font-medium text-[#5D4E4E] leading-tight line-clamp-1">
                  {cat.nombre}
                </h3>
              </div>
            </Link>
          ))}
          <div className="w-2 flex-none" />
        </div>
        
        {/* Flecha Derecha (Solo desktop) */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#9f7321ff] text-[#9f7321ff] hover:text-white p-1.5 rounded-full shadow-md border border-[#9f7321ff]/30 transition-all duration-300 backdrop-blur-sm -mr-2 md:-mr-6 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}