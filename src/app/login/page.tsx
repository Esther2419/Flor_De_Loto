"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    setLoading(true);

    if (isRegister) {
      const nombre = formData.get("nombre") as string;
      const celular = formData.get("celular") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      // Validación de Contraseña Segura (8+ carac, Mayús, Minús, Núm, Especial)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre, celular }),
      });

      if (res.ok) {
        await signIn("credentials", { email, password, callbackUrl });
      } else {
        const data = await res.json();
        setError(data.error || "Error al registrarse");
        setLoading(false);
      }
    } else {
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
      } else {
        router.push(callbackUrl);
      }
    }
  };

  return (
    <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <Image src="/LogoSinLetra.png" alt="Logo" width={60} height={60} className="mx-auto mb-4" />
        <h1 className="font-serif italic text-3xl text-gris">
          {isRegister ? "Crear Cuenta" : "Bienvenido"}
        </h1>
        <p className="text-gray-400 text-sm mt-2">Flor de Loto</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            {/* Solo letras y espacios en Nombre */}
            <input 
              name="nombre" 
              type="text" 
              placeholder="Nombre completo" 
              required 
              onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '')}
              className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" 
            />
            {/* Solo números en Celular */}
            <input 
              name="celular" 
              type="tel" 
              placeholder="Número de celular" 
              required 
              onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')}
              className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" 
            />
          </>
        )}
        
        <input name="email" type="email" placeholder="Correo electrónico" required className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" />
        
        <div className="relative">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Contraseña" 
            required 
            className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" 
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {isRegister && (
          <div className="relative">
            <input 
              name="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirmar contraseña" 
              required 
              className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" 
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        )}
        
        {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}
        
        <button disabled={loading} className="w-full bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#b38f4d] transition-all disabled:bg-gray-400">
          {loading ? "Procesando..." : (isRegister ? "Registrarme" : "Iniciar Sesión")}
        </button>
      </form>

      <div className="relative my-6 text-center">
        <span className="bg-white px-4 text-gray-400 text-sm relative z-10">O continuar con</span>
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-100"></div>
      </div>

      <button 
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 py-4 rounded-2xl hover:bg-gray-50 transition-all font-medium text-gray-600"
      >
        <Image src="https://www.google.com/favicon.ico" alt="Google" width={20} height={20} />
        Google
      </button>

      <div className="text-center mt-8">
        <button 
          onClick={() => { setIsRegister(!isRegister); setError(""); }} 
          className="text-[#C5A059] font-bold text-sm hover:underline"
        >
          {isRegister ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}