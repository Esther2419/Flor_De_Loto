"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400 text-xs">
      Cargando...
    </div>
  )
});

export default function LocationSection() {
  return (
    <section id="encuentranos" className="py-12 md:py-20 px-4 md:px-6 bg-white border-t border-[#C5A059]/20 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <span className="text-[10px] md:text-xs font-sans tracking-[0.3em] text-[#C5A059] uppercase mb-2 md:mb-3 block">
            Ubicación
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#0A0A0A] italic">
            Encuéntranos
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-8 lg:gap-12 items-stretch h-auto lg:h-[450px] mb-8 md:mb-10">
          
          {/* 1. Imagen de Portada */}
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg border border-gray-100 group aspect-square lg:aspect-auto w-full">
            <Image 
              src="/portada2.jpg" 
              alt="Fachada Flor de Loto" 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 md:p-6">
              <p className="text-white font-serif text-sm md:text-xl italic leading-tight">Nuestra Tienda</p>
              <p className="text-white/80 text-[8px] md:text-xs uppercase tracking-widest mt-1">Cochabamba</p>
            </div>
          </div>

          {/* 2. Mapa */}
          <div className="rounded-xl md:rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative z-0 aspect-square lg:aspect-auto w-full">
             <Map />
          </div>

        </div>

        <div className="text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#F9F6EE] text-[#C5A059] mb-3 md:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <p className="text-lg md:text-2xl font-serif text-[#0A0A0A] italic px-2">
            "Nos encontramos en la Avenida General Galindo frente a la Plazuela Tarija."
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-2 uppercase tracking-widest px-4">
            Te esperamos con variedad de ramos y las flores más frescas
          </p>
        </div>

      </div>
    </section>
  );
}