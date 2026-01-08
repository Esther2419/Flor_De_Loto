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
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-16 relative group/section">
      
      {}
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl md:text-5xl text-[#C5A059] italic mb-3 drop-shadow-sm">
          Categorías
        </h2>
        <div className="w-20 h-1 bg-[#E5A1A6] mx-auto rounded-full" />
        <p className="mt-4 text-[#5D4E4E] font-['Lato'] text-base md:text-lg tracking-wide">
          Explora nuestras categorías especializadas para cada tipo de evento
        </p>
      </div>

      {/* --- CONTENEDOR CON FLECHAS --- */}
      <div className="relative">
        
        {}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-[#E5A1A6] text-[#C5A059] hover:text-white p-3 rounded-full shadow-lg border border-[#E5A1A6]/30 transition-all duration-300 backdrop-blur-sm -ml-4 md:-ml-6 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {}
        <div 
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory px-4 -mx-4 scrollbar-hide scroll-smooth"
        >
          {categories.map((cat) => (
            <Link 
              key={cat.id} 
              href={`/catalogo/${cat.id}`}
              className="flex-none w-[160px] md:w-[220px] flex flex-col items-center group cursor-pointer snap-center"
            >
              {}
              <div className="relative aspect-square w-full overflow-hidden rounded-3xl border-2 border-white shadow-md transition-all duration-500 
                group-hover:border-[#E5A1A6] group-hover:shadow-[0_10px_20px_rgba(229,161,166,0.4)] group-hover:-translate-y-2"
              >
                {cat.foto ? (
                  <Image
                    src={cat.foto}
                    alt={cat.nombre}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white flex items-center justify-center">
                     <span className="text-5xl text-[#E5A1A6]/30">❀</span>
                  </div>
                )}
              </div>

              {}
              <div className="mt-4 text-center">
                <h3 className="font-serif text-lg md:text-xl font-medium text-[#5D4E4E] transition-colors duration-300 group-hover:text-[#E5A1A6]">
                  {cat.nombre}
                </h3>
              </div>
            </Link>
          ))}
          <div className="w-4 flex-none" />
        </div>

        {}
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-[#E5A1A6] text-[#C5A059] hover:text-white p-3 rounded-full shadow-lg border border-[#E5A1A6]/30 transition-all duration-300 backdrop-blur-sm -mr-4 md:-mr-6 opacity-0 group-hover/section:opacity-100 hidden md:block"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>

      </div>
    </div>
  );
}