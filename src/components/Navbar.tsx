"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "INICIO", href: "/" },
    { name: "CATEGORIAS", href: "/catalogo" },
    { name: "ENCUENTRANOS", href: "/ubicacion" },
    { name: "CONTACTANOS", href: "/contacto" },
  ];

  return (
    <header className="bg-[#050505] border-b border-[#C5A059]/30 sticky top-0 z-50 shadow-md h-20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          
          {}
          <Link href="/" className="flex items-center gap-3 group h-full">
            
            {}
            {}
            <div className="relative w-12 h-12 md:w-14 md:h-14 transition-transform duration-500 group-hover:scale-105">
              <Image 
                src="/LogoSinLetra.png" 
                alt="Logo Flor de Loto" 
                fill
                className="object-contain"
              />
            </div>

            {}
            <div className="flex flex-col justify-center">
              {}
              <h1 className="font-serif italic font-bold text-2xl md:text-3xl leading-none tracking-tight 
                             bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] 
                             bg-clip-text text-transparent bg-[length:200%_auto] 
                             pr-4 pb-0.5
                             group-hover:animate-shine transition-all duration-700">
                Flor de Loto
              </h1>
              
              <span className="font-roman text-[8px] md:text-[10px] text-[#D4AF37] uppercase tracking-[0.35em] ml-0.5 group-hover:text-[#F3E5AB] transition-colors">
                Floristería
              </span>
            </div>
          </Link>

          {/* --- MENÚ ESCRITORIO --- */}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white text-[10px] md:text-xs font-sans font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase py-2 border-b-2 border-transparent hover:border-[#D4AF37]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Botón Móvil */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Celulares */}
      {isOpen && (
        <div className="lg:hidden bg-[#050505] border-t border-[#C5A059]/20 absolute w-full left-0 top-20 shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white block px-3 py-2 rounded-md text-sm font-medium tracking-widest hover:text-[#D4AF37] hover:bg-white/5 border-l-2 border-transparent hover:border-[#C5A059] transition-all"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* --- BOTÓN FLOTANTE DE WHATSAPP --- */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <div className="bg-white text-[#5D4E4E] px-3 py-2 md:px-4 rounded-xl shadow-lg border border-[#E5A1A6]/30 block">
          <p className="text-[10px] md:text-xs font-['Lato'] font-bold whitespace-nowrap">
            Si necesitas asesoria da click aquí
          </p>
        </div>
        <a
          href="https://wa.me/+59162646545"
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-[#20BA5C] text-white p-3 md:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] flex items-center justify-center group"
          aria-label="Contactar por WhatsApp"
        >
          <svg 
            className="w-6 h-6 md:w-8 md:h-8 fill-current" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.358-5.294c0-5.457 4.432-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
      </div>
    </header>
  );
}