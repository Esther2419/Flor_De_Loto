"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, Search } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { items, toggleCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
      setShowMobileSearch(false);
    }
  };

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
      <header className={`bg-[#050505] border-b-2 sticky top-0 z-50 shadow-md h-16 md:h-20 transition-all duration-500 ${
        tiendaAbierta ? "border-[#C5A059]/30" : "border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full gap-2">
            
            {/* --- LOGO --- */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <div className="relative w-8 h-8 md:w-14 md:h-14 transition-transform duration-500 group-hover:scale-105">
                <Image src="/LogoSinLetra.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif italic font-bold text-base md:text-3xl leading-none bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] bg-clip-text text-transparent group-hover:animate-shine">
                  Flor de Loto
                </h1>
                <span className={`text-[6px] md:text-[10px] uppercase tracking-[0.35em] font-bold ${
                  tiendaAbierta ? "text-[#D4AF37]" : "text-red-500"
                }`}>
                  {tiendaAbierta ? "Floristería" : "TIENDA CERRADA"}
                </span>
              </div>
            </Link>

            {/* --- SECCIÓN DERECHA --- */}
            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
              
              {/* 1. NAVEGACIÓN (Solo PC) */}
              <nav className="hidden lg:flex items-center space-x-6 mr-4">
                {menuItems.map((item) => (
                  <Link key={item.name} href={item.href} className="text-white text-[10px] font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase py-2">
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* 2. BUSCADOR (PC y Móvil) */}
              {/* En PC se ve la barra, en Móvil el icono toggle */}
              
              {/* Buscador PC */}
              <form onSubmit={handleSearch} className="hidden lg:flex relative items-center">
                <input 
                  type="text" 
                  placeholder="Buscar ramos, flores..." 
                  className="bg-white/10 border border-[#C5A059]/30 text-white text-xs rounded-full py-1.5 pl-3 pr-8 focus:outline-none focus:border-[#C5A059] w-48 transition-all focus:w-64 placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="absolute right-2 text-[#C5A059] hover:text-white transition-colors">
                  <Search size={14} />
                </button>
              </form>

              {/* Buscador Móvil (Icono) */}
              <button 
                onClick={() => setShowMobileSearch(!showMobileSearch)}
                className="lg:hidden text-white hover:text-[#C5A059] p-1"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* 3. CARRITO (PC y Móvil) */}
              <button onClick={toggleCart} className="relative text-white hover:text-[#D4AF37] p-1">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>

              {/* 4. USUARIO (Solo PC) - En móvil va al menú */}
              <div className="hidden lg:flex items-center gap-4 border-l border-[#C5A059]/30 pl-4">
                {session ? (
                  <div className="flex items-center gap-3">
                    {session.user?.role === "admin" && (
                      <Link href="/admin" className="text-[#D4AF37] text-[10px] font-bold flex items-center gap-1 uppercase hover:text-white transition-colors border border-[#D4AF37]/30 px-2 py-1 rounded hover:bg-[#D4AF37]/10">
                        <LayoutDashboard size={14} /> 
                        <span>PANEL</span>
                      </Link>
                    )}
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="text-white hover:text-red-500 transition-colors" title="Cerrar Sesión">
                      <LogOut size={20} />
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 text-white hover:text-[#D4AF37] group">
                    <User className="w-6 h-6 group-hover:scale-110" />
                    <span className="text-[10px] font-bold tracking-widest">INGRESAR</span>
                  </Link>
                )}
              </div>

              {/* 5. HAMBURGUESA (Solo Móvil) */}
              <div className="lg:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>

            </div>
          </div>

          {/* BARRA DE BÚSQUEDA MÓVIL DESPLEGABLE */}
          {showMobileSearch && (
            <div className="lg:hidden absolute top-16 left-0 w-full bg-[#050505] p-3 border-b border-[#C5A059]/20 animate-in slide-in-from-top-2">
              <form onSubmit={handleSearch} className="flex relative items-center">
                <input 
                  type="text" 
                  placeholder="Buscar ramos, flores, colores..." 
                  className="w-full bg-white/10 border border-[#C5A059]/30 text-white text-sm rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-[#C5A059]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="absolute right-3 text-[#C5A059]">
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}

        </div>
      </header>

      {/* MENÚ MÓVIL (Hamburguesa) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 px-6 animate-in fade-in slide-in-from-top-10 duration-200 overflow-y-auto">
          <nav className="flex flex-col space-y-6">
            
            <div className="pb-6 border-b border-white/10">
               {session ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#C5A059]">Hola, {session.user?.name?.split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-400 uppercase">{session.user?.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      {session.user?.role === "admin" && (
                        <Link href="/admin" onClick={() => setIsOpen(false)} className="flex-1 bg-[#C5A059]/10 border border-[#C5A059] text-[#C5A059] text-xs font-bold py-2 rounded text-center uppercase">
                          Panel Admin
                        </Link>
                      )}
                      <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold py-2 rounded text-center uppercase flex items-center justify-center gap-2">
                        <LogOut size={14} /> Salir
                      </button>
                    </div>
                  </div>
               ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-white group bg-white/5 p-3 rounded-lg border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                      <User size={20} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">INICIAR SESIÓN</span>
                       <span className="text-[10px] text-gray-400">Accede a tu cuenta</span>
                    </div>
                  </Link>
               )}
            </div>

            {menuItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className="text-white text-lg font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase border-b border-white/5 pb-2"
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