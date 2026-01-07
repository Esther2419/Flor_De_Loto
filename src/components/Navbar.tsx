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
    </header>
  );
}