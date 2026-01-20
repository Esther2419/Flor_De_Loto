"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const nombre = formData.get("nombre") as string;

    if (isRegister) {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, nombre }),
      });
      if (res.ok) {
        await signIn("credentials", { email, password, callbackUrl });
      } else {
        const data = await res.json();
        setError(data.error);
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
    <div className="min-h-screen bg-crema flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <Image src="/LogoSinLetra.png" alt="Logo" width={60} height={60} className="mx-auto mb-4" />
          <h1 className="font-serif italic text-3xl text-gris">{isRegister ? "Crear Cuenta" : "Bienvenido"}</h1>
          <p className="text-gray-400 text-sm mt-2">Disfruta de la magia de Flor de Loto</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input name="nombre" type="text" placeholder="Nombre completo" required className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" />
          )}
          <input name="email" type="email" placeholder="Correo electrónico" required className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" />
          <input name="password" type="password" placeholder="Contraseña" required className="w-full p-4 bg-gray-50 border rounded-2xl focus:outline-[#C5A059]" />
          
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          
          <button disabled={loading} className="w-full bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#b38f4d] transition-all">
            {loading ? "Cargando..." : (isRegister ? "Registrarme" : "Iniciar Sesión")}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
          <button onClick={() => signIn("google", { callbackUrl })} className="w-full border py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
            <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
            Continuar con Google
          </button>
          
          <p className="text-center text-sm text-gray-500">
            {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-[#C5A059] font-bold">
              {isRegister ? "Inicia sesión" : "Regístrate aquí"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}