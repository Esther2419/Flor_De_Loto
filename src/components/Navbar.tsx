"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ShoppingCart, User, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(true);
  const { items, toggleCart } = useCart();
  const { data: session } = useSession();

  const count = items.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    const fetchEstado = async () => {
      const { data } = await supabase.from('configuracion').select('tienda_abierta').eq('id', 1).single();
      if (data) setTiendaAbierta(data.tienda_abierta);
    };
    fetchEstado();

    const channel = supabase.channel('nav-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracion' }, 
        (payload) => setTiendaAbierta(payload.new.tienda_abierta)
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const menuItems = [
    { name: "INICIO", href: "/" },
    { name: "CATEGORIAS", href: "/#categorias" },
    { name: "RAMOS", href: "/#ramos" },
    { name: "ENCUENTRANOS", href: "/#encuentranos" },
    { 
      name: "CONTACTANOS", 
      href: "https://wa.me/59179783761?text=Hola%20Flor%20de%20Loto%20quiero%20contactarme%20para..." 
    },
  ];

  return (
    <>
      <header className={`bg-[#050505] border-b-2 sticky top-0 z-50 shadow-md h-20 transition-all duration-500 ${
        tiendaAbierta ? "border-[#C5A059]/30" : "border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <div className="relative w-10 h-10 md:w-14 md:h-14 transition-transform duration-500 group-hover:scale-105">
                <Image src="/LogoSinLetra.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif italic font-bold text-lg md:text-3xl leading-none bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] bg-clip-text text-transparent group-hover:animate-shine">
                  Flor de Loto
                </h1>
                <span className={`text-[7px] md:text-[10px] uppercase tracking-[0.35em] font-bold ${
                  tiendaAbierta ? "text-[#D4AF37]" : "text-red-500"
                }`}>
                  {tiendaAbierta ? "Floristería" : "TIENDA CERRADA"}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-4 md:gap-8">
              {/* MENÚ DE ESCRITORIO */}
              <nav className="hidden lg:flex items-center space-x-8">
                {menuItems.map((item) => (
                  <Link key={item.name} href={item.href} className="text-white text-[10px] font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase py-2">
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-3 md:gap-5">
                {/* BOTÓN CARRITO */}
                <button onClick={toggleCart} className="relative text-white hover:text-[#D4AF37] p-1">
                  <ShoppingCart className="w-6 h-6" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>

                {/* SECCIÓN DE USUARIO */}
                <div className="flex items-center gap-4 border-l border-[#C5A059]/30 pl-3 md:pl-5">
                  {session ? (
                    <div className="flex items-center gap-3">
                      
                      {/* Solo mostramos botón de PANEL si es admin */}
                      {session.user?.role === "admin" && (
                        <Link href="/admin" className="text-[#D4AF37] text-[9px] md:text-[10px] font-bold flex items-center gap-1 uppercase hover:text-white transition-colors border border-[#D4AF37]/30 px-2 py-1 rounded hover:bg-[#D4AF37]/10">
                          <LayoutDashboard size={14} /> 
                          <span className="hidden sm:inline">PANEL</span>
                        </Link>
                      )}
                      
                      {/* Botón de Salir */}
                      <button 
                        onClick={() => signOut({ callbackUrl: "/" })} 
                        className="text-white hover:text-red-500 transition-colors"
                        title="Cerrar Sesión"
                      >
                        <LogOut size={20} />
                      </button>
                    </div>
                  ) : (
                    <Link href="/login" className="flex items-center gap-2 text-white hover:text-[#D4AF37] group">
                      <User className="w-6 h-6 group-hover:scale-110" />
                      <span className="hidden sm:block text-[10px] font-bold tracking-widest">INGRESAR</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* BOTÓN MENU MÓVIL */}
              <div className="lg:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-24 px-6 animate-in fade-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col space-y-6">
            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className="text-white text-lg font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase border-b border-white/10 pb-2"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <CartSidebar /> 
    </>
  );
}