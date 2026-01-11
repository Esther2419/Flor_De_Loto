"use client";

import Image from "next/image";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Cargando Mapa...
    </div>
  )
});

export default function LocationSection() {
  return (
    <section id="encuentranos" className="py-20 px-6 bg-white border-t border-[#C5A059]/20 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-sans tracking-[0.3em] text-[#C5A059] uppercase mb-3 block">
            Ubicación
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#0A0A0A] italic">
            Encuéntranos
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch h-auto lg:h-[450px] mb-10">
          
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 group aspect-square lg:aspect-auto w-full">
            <Image 
              src="/portada2.jpg" 
              alt="Fachada Flor de Loto" 
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
              <p className="text-white font-serif text-xl italic">Nuestra Tienda</p>
              <p className="text-white/80 text-xs uppercase tracking-widest mt-1">Cochabamba, Bolivia</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 relative z-0 aspect-square lg:aspect-auto w-full">
             <Map />
          </div>

        </div>

        <div className="text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F9F6EE] text-[#C5A059] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <p className="text-xl md:text-2xl font-serif text-[#0A0A0A] italic">
            "Nos encontramos en la Avenida General Galindo frente a la Plazuela Tarija."
          </p>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">
            Te esperamos con variedad de ramos y las flores más frescas
          </p>
        </div>

      </div>
    </section>
  );
}