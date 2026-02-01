"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Flower2, 
  Package, 
  Layers, 
  Gift, 
  LogOut, 
  User,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  ClipboardList,
  Menu,
  X
} from "lucide-react";

export default function PanelAdmin({ children }: { children?: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    
    if (errorParam === "AccessDenied") {
      setLoginError("Acceso Denegado: Esta cuenta no tiene permisos de administrador.");
      
      const timer = setTimeout(() => {
        setLoginError("");
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("error");
          window.history.replaceState({}, '', url.pathname);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    
    const res = await signIn("credentials", {
      email: email.trim(),
      password: password.trim(),
      redirect: false,
    });

    if (res?.error) {
      setLoginError("Credenciales incorrectas o acceso denegado.");
      setIsSubmitting(false);
    }
  };

  // 1. Pantalla de Carga
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#C5A059] gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-serif italic text-lg">Verificando credenciales...</p>
      </div>
    );
  }

  // 2. Pantalla de Login (Si no hay sesión)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern-bg.png')] opacity-5 pointer-events-none" />
        <div className="max-w-md w-full bg-white/5 border border-[#C5A059]/30 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
          
          <div className="text-center mb-8">
            <div className="relative w-20 h-20 mx-auto mb-4">
               <Image src="/LogoSinLetra.png" alt="Flor de Loto" fill className="object-contain" />
            </div>
            <h1 className="font-serif text-3xl text-[#C5A059] italic mb-2">Flor de Loto</h1>
            <p className="text-white/60 text-[10px] font-sans tracking-[0.3em] uppercase">Panel Admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 py-3 px-4 rounded border border-red-500/20 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={16} className="shrink-0" />
                <p>{loginError}</p>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-[#C5A059]/50" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-[#C5A059]/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C5A059] transition-all text-sm"
                placeholder="Correo electrónico"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-[#C5A059]/50" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-[#C5A059]/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C5A059] transition-all text-sm"
                placeholder="Contraseña"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#C5A059] text-black font-bold py-3 rounded-lg hover:bg-[#b38f4d] transition-all text-xs tracking-widest uppercase flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Ingresar al Panel"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-2 bg-[#050505] text-white/40 uppercase tracking-widest">O</span></div>
          </div>

          <button
            onClick={() => signIn("google")}
            className="w-full bg-white text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm"
          >
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  // 3. BLOQUEO DE SEGURIDAD: Si hay sesión pero NO es ADMIN (Insensible a mayúsculas)
  if (session && session.user.rol?.toLowerCase() !== "admin") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-4">
        <div className="relative w-24 h-24 mb-6">
          <Image src="/LogoSinLetra.png" alt="Acceso Denegado" fill className="object-contain grayscale opacity-50" />
        </div>
        <h2 className="text-[#C5A059] font-serif italic text-3xl mb-4">Acceso Denegado</h2>
        <p className="text-white/60 text-sm mb-8 max-w-xs mx-auto">
          Esta cuenta no tiene permisos para acceder al panel administrativo de Flor de Loto.
        </p>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-[#C5A059] text-black px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#C5A059]/20"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // 4. Panel Administrativo (Si es ADMIN)
  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Pedidos", href: "/admin/pedidos", icon: ClipboardList },
    { name: "Ramos", href: "/admin/ramos", icon: Package },
    { name: "Flores", href: "/admin/flores", icon: Flower2 },
    { name: "Categorías", href: "/admin/categorias", icon: Layers },
    { name: "Envolturas", href: "/admin/envolturas", icon: Gift },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 z-50 h-screen md:h-screen
        w-64 bg-[#0A0A0A] text-white flex flex-col flex-shrink-0 border-r border-white/5
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/10 bg-[#0A0A0A]">
          <div className="text-center w-full md:w-auto">
            <h2 className="text-2xl font-serif italic text-[#C5A059]">Flor de Loto</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">Admin Panel</p>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-gray-400 hover:text-white absolute right-4"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isActive ? "bg-[#C5A059] text-black shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] border border-[#C5A059]/20">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user?.name || "Admin"}</p>
              {/* Mostramos el rol original pero en minúsculas para consistencia */}
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{session.user?.rol?.toLowerCase() || "admin"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm md:shadow-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-[#C5A059] transition-colors p-1"
            >
              <Menu size={24} />
            </button>

            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                Hola, <span className="text-[#C5A059]">{session.user?.name?.split(' ')[0] || "Admin"}</span> 
              </h1>
              <p className="text-[10px] md:text-[11px] text-gray-400 uppercase tracking-widest hidden sm:block">Gestión de Floristería</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-gray-700">{session.user?.email}</p>
              <span className="text-[10px] text-green-500 font-bold uppercase">Sesión Activa</span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 md:px-4 py-2 md:py-2.5 rounded-lg transition-all font-semibold"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
             {children || (
               <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
                 <h2 className="text-2xl font-serif italic text-gray-400">Selecciona una opción del menú para comenzar</h2>
               </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}