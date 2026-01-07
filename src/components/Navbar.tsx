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
    <header className="bg-[#050505] border-b border-[#C5A059]/30 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-28">
          
          {}
          <Link href="/" className="flex items-center gap-4 group">
            
            {}
            <div className="relative w-16 h-16 md:w-20 md:h-20 transition-transform duration-500 group-hover:scale-105">
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
              <h1 className="font-serif italic font-bold text-3xl md:text-4xl leading-normal tracking-tight 
                             bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] 
                             bg-clip-text text-transparent bg-[length:200%_auto] 
                             pr-4 pb-1
                             group-hover:animate-shine transition-all duration-700">
                Flor de Loto
              </h1>
              
              <span className="font-roman text-[10px] md:text-xs text-[#D4AF37] uppercase tracking-[0.35em] ml-1 group-hover:text-[#F3E5AB] transition-colors">
                Floristería
              </span>
            </div>
          </Link>

          {}
          <nav className="hidden lg:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white text-xs font-sans font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase py-2 border-b-2 border-transparent hover:border-[#D4AF37]"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {}
      {isOpen && (
        <div className="lg:hidden bg-[#050505] border-t border-[#C5A059]/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white block px-3 py-2 rounded-md text-base font-medium hover:text-[#D4AF37] hover:bg-white/5"
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