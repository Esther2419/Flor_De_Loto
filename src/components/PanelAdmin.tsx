"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, signOut, getSession } from "next-auth/react";

export default function PanelAdmin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Estados del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [userData, setUserData] = useState<{name?: string | null, image?: string | null} | null>(null);

  // Verificar si ya existe una sesión de Google al cargar
  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserData(session.user || null);
      }
    });
  }, []);

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
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-xl text-[#C5A059] italic">Panel Admin</h1>
            {userData?.image && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#C5A059]">
                <Image src={userData.image} alt="Perfil" fill className="object-cover" />
              </div>
            )}
          </div>
          <button 
            onClick={async () => {
              await signOut({ redirect: false }); // Cierra sesión de Google si existe
              setIsLoggedIn(false);
              setUserData(null);
            }}
            className="text-xs uppercase tracking-widest hover:text-[#E5A1A6] transition-colors"
          >
            Cerrar Sesión
          </button>
        </nav>
        <div className="p-8 max-w-7xl mx-auto">
          <h2 className="text-3xl font-serif text-[#5D4E4E] mb-6">
            {userData?.name ? `Hola, ${userData.name}` : "Panel de Administración"}
          </h2>
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

        {/* --- SEPARADOR Y LOGIN CON GOOGLE --- */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#050505] text-white/40 text-xs uppercase tracking-widest">O continúa con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signIn("google")}
          className="w-full bg-white text-[#5D4E4E] font-bold py-3 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3 text-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
          Google
        </button>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <Link href="/" className="text-white/30 hover:text-[#C5A059] text-xs transition-colors flex items-center justify-center gap-2">
            <span>←</span> Volver al catálogo público
          </Link>
        </div>
      </div>
    </div>
  );
}