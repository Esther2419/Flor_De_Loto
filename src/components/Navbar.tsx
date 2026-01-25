"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Search,
  ClipboardList
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { items, toggleCart } = useCart(); //
  const { data: session } = useSession(); //
  const router = useRouter(); //
  const count = items.reduce((acc, item) => acc + item.cantidad, 0); //

  useEffect(() => {
    const fetchEstado = async () => {
      const { data } = await supabase.from('configuracion').select('tienda_abierta').eq('id', 1).single(); //
      if (data) setTiendaAbierta(data.tienda_abierta); //
    };
    fetchEstado();

    const channel = supabase.channel('nav-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'configuracion' }, 
        (payload) => setTiendaAbierta(payload.new.tienda_abierta)
      ).subscribe(); //

    return () => { supabase.removeChannel(channel); }; //
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`); //
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
  ]; //

  return (
    <>
      <header className={`bg-[#050505] border-b-2 sticky top-0 z-50 shadow-md h-16 md:h-20 transition-all duration-500 ${
        tiendaAbierta ? "border-[#C5A059]/30" : "border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full gap-2">
            
            {/* LOGO */}
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

            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
              <nav className="hidden lg:flex items-center space-x-6 mr-4">
                {menuItems.map((item) => (
                  <Link key={item.name} href={item.href} className="text-white text-[10px] font-bold tracking-[0.2em] hover:text-[#D4AF37] transition-colors uppercase py-2">
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* PERFIL DESKTOP (HOVER) */}
              <div 
                className="hidden lg:block relative"
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                {session ? (
                  <div className="py-4">
                    <button className="flex items-center gap-2 text-white hover:text-[#D4AF37] transition-all">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center border border-[#C5A059]/30">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {session.user?.name?.split(' ')[0]}
                      </span>
                    </button>

                    {showProfileMenu && (
                      <div className="absolute right-0 top-full w-52 bg-[#050505] border border-[#C5A059]/30 rounded-xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link href="/perfil" className="flex items-center gap-3 px-4 py-2.5 text-[11px] text-white hover:bg-[#C5A059]/10 hover:text-[#D4AF37] transition-colors uppercase font-bold">
                          <User size={14} /> Mi Perfil
                        </Link>
                        <Link href="/mis-pedidos" className="flex items-center gap-3 px-4 py-2.5 text-[11px] text-white hover:bg-[#C5A059]/10 hover:text-[#D4AF37] transition-colors uppercase font-bold">
                          <ClipboardList size={14} /> Mis Pedidos
                        </Link>
                        {session.user?.role === "admin" && (
                          <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-[11px] text-[#D4AF37] hover:bg-[#C5A059]/10 transition-colors font-bold uppercase border-t border-white/5 mt-1 pt-3">
                            <LayoutDashboard size={14} /> Panel Admin
                          </Link>
                        )}
                        <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left px-4 py-2.5 text-[11px] text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-3 border-t border-white/10 mt-2 font-bold uppercase">
                          <LogOut size={14} /> Cerrar Sesión
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 text-white hover:text-[#D4AF37] group">
                    <User className="w-6 h-6 group-hover:scale-110" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Ingresar</span>
                  </Link>
                )}
              </div>

              {/* CARRITO */}
              <button onClick={toggleCart} className="relative text-white hover:text-[#D4AF37] p-1">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>

              <div className="lg:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-1">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MENÚ MÓVIL ACTUALIZADO */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 px-6 animate-in fade-in slide-in-from-top-10 duration-200 overflow-y-auto">
          <nav className="flex flex-col space-y-6">
            
            <div className="pb-6 border-b border-white/10">
               {session ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] border border-[#C5A059]/30">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#C5A059]">Hola, {session.user?.name?.split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{session.user?.email}</span>
                      </div>
                    </div>
                    
                    {/* Botones de acción rápida en móvil */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/perfil" onClick={() => setIsOpen(false)} className="bg-white/5 border border-white/10 text-white text-[10px] font-bold py-3 rounded-xl text-center uppercase flex items-center justify-center gap-2">
                        <User size={14} /> Perfil
                      </Link>
                      <Link href="/mis-pedidos" onClick={() => setIsOpen(false)} className="bg-white/5 border border-white/10 text-white text-[10px] font-bold py-3 rounded-xl text-center uppercase flex items-center justify-center gap-2">
                        <ClipboardList size={14} /> Pedidos
                      </Link>
                    </div>

                    {session.user?.role === "admin" && (
                      <Link href="/admin" onClick={() => setIsOpen(false)} className="w-full bg-[#C5A059]/10 border border-[#C5A059] text-[#C5A059] text-[10px] font-bold py-3 rounded-xl text-center uppercase flex items-center justify-center gap-2">
                        <LayoutDashboard size={14} /> Panel Admin
                      </Link>
                    )}

                    <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-bold py-3 rounded-xl text-center uppercase flex items-center justify-center gap-2">
                      <LogOut size={14} /> Cerrar Sesión
                    </button>
                  </div>
               ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-white bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-[#C5A059] flex items-center justify-center text-black shadow-lg">
                      <User size={24} />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-sm font-bold uppercase tracking-widest">Iniciar Sesión</span>
                       <span className="text-[10px] text-gray-400">Accede a tus beneficios</span>
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