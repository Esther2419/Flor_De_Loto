"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  ShoppingCart, User, LogOut, LayoutDashboard, Menu, X, 
  Search, ClipboardList, Package, Flower2, Gift, Loader2, ChevronRight 
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSession, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { getQuickSearchResults } from "@/app/actions/search";
import CartSidebar from "./CartSidebar";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<{ramos: any[], flores: any[], envolturas: any[]} | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const { items, toggleCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const count = items.reduce((acc, item) => acc + item.cantidad, 0);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const results = await getQuickSearchResults(searchTerm);
          setSearchResults(results);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const fetchEstado = async () => {
      const { data } = await supabase.from('configuracion').select('tienda_abierta').eq('id', 1).single();
      if (data) setTiendaAbierta(data.tienda_abierta);
    };
    fetchEstado();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
      setSearchTerm("");
    }
  };

  const menuItems = [
    { name: "INICIO", href: "/" },
    { name: "CATEGORIAS", href: "/#categorias" },
    { name: "RAMOS", href: "/#ramos" },
    { name: "ENCUENTRANOS", href: "/#encuentranos" },
    { name: "CONTACTANOS", href: "https://wa.me/59179783761" },
  ];

  return (
    <>
      <header className={`bg-[#050505] border-b-2 sticky top-0 z-50 shadow-md h-16 md:h-20 transition-all duration-500 ${
        tiendaAbierta ? "border-[#C5A059]/30" : "border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full gap-2">
            
            <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <div className="relative w-8 h-8 md:w-14 md:h-14 transition-transform duration-500 group-hover:scale-105">
                <Image src="/LogoSinLetra.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-serif italic font-bold text-base md:text-3xl leading-none bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] bg-clip-text text-transparent">Flor de Loto</h1>
                <span className={`text-[6px] md:text-[10px] uppercase tracking-[0.35em] font-bold ${tiendaAbierta ? "text-[#D4AF37]" : "text-red-500"}`}>
                  {tiendaAbierta ? "Floristería" : "TIENDA CERRADA"}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 md:gap-6 flex-1 justify-end">
              <nav className="hidden lg:flex items-center space-x-6 mr-4">
                {menuItems.map((item) => (
                  <Link key={item.name} href={item.href} className="text-white text-[10px] font-bold tracking-[0.2em] hover:text-[#D4AF37] uppercase py-2">{item.name}</Link>
                ))}
              </nav>

              <button onClick={() => setIsSearchOpen(true)} className="text-white hover:text-[#C5A059] p-2 transition-colors">
                <Search size={22} />
              </button>

              <button onClick={toggleCart} className="relative text-white hover:text-[#D4AF37] p-1">
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                {count > 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-4 md:w-4 items-center justify-center rounded-full bg-red-600 text-[8px] md:text-[10px] font-bold text-white">{count}</span>}
              </button>

              <div className="hidden lg:block relative" onMouseEnter={() => setShowProfileMenu(true)} onMouseLeave={() => setShowProfileMenu(false)}>
                {session ? (
                  <div className="py-4">
                    <button className="flex items-center gap-2 text-white hover:text-[#D4AF37]">
                      <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center border border-[#C5A059]/30"><User className="w-5 h-5" /></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{session.user?.name?.split(' ')[0]}</span>
                    </button>
                    {showProfileMenu && (
                      <div className="absolute right-0 top-full w-52 bg-[#050505] border border-[#C5A059]/30 rounded-xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                        <Link href="/perfil" className="flex items-center gap-3 px-4 py-2 text-[10px] text-white hover:bg-[#C5A059]/10 hover:text-[#D4AF37] font-bold uppercase"><User size={14} /> Perfil</Link>
                        <Link href="/mis-pedidos" className="flex items-center gap-3 px-4 py-2 text-[10px] text-white hover:bg-[#C5A059]/10 hover:text-[#D4AF37] font-bold uppercase"><ClipboardList size={14} /> Pedidos</Link>
                        {session.user?.role === "admin" && <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-[10px] text-[#D4AF37] font-bold uppercase border-t border-white/5 mt-1 pt-2"><LayoutDashboard size={14} /> Panel Admin</Link>}
                        <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left px-4 py-2 text-[10px] text-red-500 hover:bg-red-500/10 flex items-center gap-3 border-t border-white/10 mt-2 font-bold uppercase"><LogOut size={14} /> Salir</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" className="flex items-center gap-2 text-white hover:text-[#D4AF37] group">
                    <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Ingresar</span>
                  </Link>
                )}
              </div>

              <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden text-white p-1">{isOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
          </div>
        </div>
      </header>

      {/* PANEL DE BÚSQUEDA ACTUALIZADO */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md animate-in fade-in duration-300 flex flex-col items-center pt-16 md:pt-20 px-6 overflow-hidden">
          <button onClick={() => setIsSearchOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white p-2"><X size={28} /></button>

          <div className="w-full max-w-3xl flex flex-col h-full">
            <h2 className="font-serif italic text-xl md:text-2xl text-[#C5A059] text-center mb-6">Encuentra tu detalle perfecto</h2>
            
            <form onSubmit={handleSearchSubmit} className="relative mb-8">
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Escribe aquí..." 
                className="w-full bg-transparent border-b border-[#C5A059]/30 text-white text-lg md:text-2xl py-3 focus:outline-none focus:border-[#C5A059] transition-all placeholder-white/5"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-3">
                {isSearching && <Loader2 size={20} className="text-[#C5A059] animate-spin" />}
                <Search size={20} className="text-white/20" />
              </div>
            </form>

            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
              {searchResults && searchTerm.length >= 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* COLUMNA RAMOS */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.3em] border-b border-[#C5A059]/10 pb-1">Catálogo de Ramos</p>
                    {searchResults.ramos.map(r => (
                      <Link 
                        key={r.id} 
                        href={`/detalles/ramo/${r.id}`} 
                        onClick={() => setIsSearchOpen(false)} 
                        className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image src={r.foto_principal || "/portada.jpg"} alt="" fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-white uppercase truncate">{r.nombre}</p>
                          <p className="text-[10px] text-[#C5A059]">Bs {r.es_oferta ? r.precio_oferta : r.precio_base}</p>
                        </div>
                        <ChevronRight size={14} className="text-white/10 group-hover:text-[#C5A059] transition-colors" />
                      </Link>
                    ))}
                    {searchResults.ramos.length === 0 && <p className="text-[10px] text-zinc-600 italic">No se encontraron ramos.</p>}
                  </div>

                  {/* COLUMNA FLORES E INSUMOS */}
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-[#C5A059] uppercase tracking-[0.3em] border-b border-[#C5A059]/10 pb-1">Flores e Insumos</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[...searchResults.flores, ...searchResults.envolturas].map(item => (
                        <Link 
                          key={`${item.type}-${item.id}`} 
                          href={`/detalles/${item.type}/${item.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all group"
                        >
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/5">
                            <Image src={item.foto || "/LogoSinLetra.png"} alt="" fill className="object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-white uppercase truncate">{item.nombre}</p>
                            <p className="text-[9px] text-gray-500 italic">{item.color || 'Unico'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.type === 'flor' ? <Flower2 size={12} className="text-white/20 group-hover:text-[#C5A059]" /> : <Gift size={12} className="text-white/20 group-hover:text-[#C5A059]" />}
                            <ChevronRight size={12} className="text-white/5" />
                          </div>
                        </Link>
                      ))}
                      {(searchResults.flores.length + searchResults.envolturas.length) === 0 && <p className="text-[10px] text-zinc-600 italic">No hay insumos que coincidan.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENÚ MÓVIL */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-20 px-6 animate-in fade-in slide-in-from-top-10 overflow-y-auto">
          <nav className="flex flex-col space-y-6">
            <div className="pb-6 border-b border-white/10">
               {session ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 text-white mb-2">
                      <div className="w-9 h-9 rounded-full bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059] border border-[#C5A059]/30"><User size={18} /></div>
                      <div className="flex flex-col"><span className="text-xs font-bold text-[#C5A059]">Hola, {session.user?.name?.split(' ')[0]}</span><span className="text-[9px] text-gray-500 uppercase">{session.user?.email}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/perfil" onClick={() => setIsOpen(false)} className="bg-white/5 border border-white/10 text-white text-[9px] font-bold py-3 rounded-lg text-center uppercase flex items-center justify-center gap-2"><User size={12} /> Perfil</Link>
                      <Link href="/mis-pedidos" onClick={() => setIsOpen(false)} className="bg-white/5 border border-white/10 text-white text-[9px] font-bold py-3 rounded-lg text-center uppercase flex items-center justify-center gap-2"><ClipboardList size={12} /> Pedidos</Link>
                    </div>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full bg-red-500/10 border border-red-500 text-red-500 text-[9px] font-bold py-3 rounded-lg uppercase flex items-center justify-center gap-2"><LogOut size={12} /> Salir</button>
                  </div>
               ) : (
                  <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-4 text-white bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059] flex items-center justify-center text-black shadow-md"><User size={20} /></div>
                    <div className="flex flex-col"><span className="text-xs font-bold uppercase tracking-widest">Ingresar</span><span className="text-[9px] text-gray-400 tracking-tighter">Accede a tus pedidos</span></div>
                  </Link>
               )}
            </div>
            {menuItems.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)} className="text-white text-base font-bold tracking-[0.2em] hover:text-[#D4AF37] uppercase border-b border-white/5 pb-2">{item.name}</Link>
            ))}
          </nav>
        </div>
      )}
      <CartSidebar /> 
    </>
  );
}