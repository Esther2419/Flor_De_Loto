"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function PanelAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) setIsLoggedIn(true);
      else setError(data.message || "Error de autenticación");
      
    } catch (err) {
      console.error("Error detallado del login:", err);
      setError("Error de conexión con el servidor");
    }
  };

  // --- VISTA: PANEL DE ADMINISTRACIÓN (Cuando ya está logueado) ---
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <nav className="bg-[#050505] text-white p-4 flex justify-between items-center border-b border-[#C5A059]">
          <h1 className="font-serif text-xl text-[#C5A059] italic">Panel Admin</h1>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="text-xs uppercase tracking-widest hover:text-[#E5A1A6] transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
        <div className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif text-[#5D4E4E] mb-6">Panel de Administración</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          </div>
          <p className="mt-10 text-gray-500 text-sm">Aquí podrás gestionar tu catálogo próximamente...</p>
        </div>
      </div>
    );
  }

  // --- VISTA: LOGIN (Si NO está logueado) ---
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern-bg.png')] opacity-5 pointer-events-none" />
      
      <div className="max-w-md w-full bg-white/5 border border-[#C5A059]/30 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4 group">
             <Image 
               src="/LogoSinLetra.png" 
               alt="Flor de Loto Admin" 
               fill
               className="object-contain drop-shadow-[0_0_15px_rgba(197,160,89,0.3)]"
             />
          </div>
          <h1 className="font-serif text-3xl text-[#C5A059] italic mb-2">Flor de Loto</h1>
          <p className="text-white/60 text-[10px] font-sans tracking-[0.3em] uppercase">Panel Admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-[#C5A059]/20 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C5A059] focus:bg-black/40 transition-all text-sm"
              placeholder="Correo electrónico"
            />
          </div>

          <div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-[#C5A059]/20 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#C5A059] focus:bg-black/40 transition-all text-sm"
              placeholder="Contraseña"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 rounded border border-red-500/20 animate-pulse">
              {error}
            </p>
          )}

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-[#BF953F] via-[#F3E5AB] to-[#BF953F] text-[#050505] font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(191,149,63,0.4)] transition-all duration-500 bg-[length:200%_auto] hover:bg-right text-xs tracking-widest uppercase"
          >
            Ingresar al Panel
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <Link href="/" className="text-white/30 hover:text-[#C5A059] text-xs transition-colors flex items-center justify-center gap-2">
            <span>←</span> Volver al catálogo público
          </Link>
        </div>
      </div>
    </div>
  );
}