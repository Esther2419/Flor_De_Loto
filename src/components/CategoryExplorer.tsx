"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface Category {
  id: string;
  nombre: string;
  foto: string | null;
  children: Category[];
}

export default function CategoryExplorer({ categories }: { categories: Category[] }) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 250; 
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
        <h2 className="font-serif text-3xl md:text-4xl text-[#C5A059] italic mb-3 drop-shadow-sm">
          Categorías
        </h2>
        <div className="w-16 h-1 bg-[#E5A1A6] mx-auto rounded-full" />
        <p className="mt-4 text-[#5D4E4E] font-['Lato'] text-sm md:text-base tracking-wide">
          Selecciona una categoría para ver sus opciones
        </p>
      </div>

      {/* --- CONTENEDOR CON FLECHAS --- */}
      <div className="relative px-2"> 
        {/* Flecha Izquierda */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#E5A1A6] text-[#C5A059] hover:text-white p-2 rounded-full shadow-lg border border-[#E5A1A6]/30 transition-all duration-300 backdrop-blur-sm -ml-2 md:-ml-5 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Carrusel */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-4 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory px-4 -mx-4 scrollbar-hide scroll-smooth touch-pan-x"
        >
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/catalogo/${cat.id}`}
              className="flex-none w-[90px] md:w-[120px] flex flex-col items-center group cursor-pointer snap-center"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-full border border-white shadow-sm transition-all duration-500 
                group-hover:border-[#E5A1A6] group-hover:shadow-[0_8px_16px_rgba(229,161,166,0.3)] group-hover:-translate-y-1"
              >
                {cat.foto ? (
                  <Image
                    src={cat.foto}
                    alt={cat.nombre}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 bg-white flex items-center justify-center">
                     <span className="text-3xl text-[#E5A1A6]/30">❀</span>
                  </div>
                )}
              </div>

              {/* Nombre de Categoría */}
              <div className="mt-3 text-center px-1">
                <h3 className="font-serif text-xs md:text-sm font-medium text-[#5D4E4E] transition-colors duration-300 group-hover:text-[#E5A1A6] leading-tight">
                  {cat.nombre}
                </h3>
              </div>
            </Link>
          ))}
          <div className="w-2 flex-none" />
        </div>

        {/* Flecha Derecha */}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#E5A1A6] text-[#C5A059] hover:text-white p-2 rounded-full shadow-lg border border-[#E5A1A6]/30 transition-all duration-300 backdrop-blur-sm -mr-2 md:-mr-5 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}