"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Search, ChevronDown, Check } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { motion, AnimatePresence } from "framer-motion";

// Lista extendida de países con límites de dígitos
const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "🇧🇴", limit: 8 },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "🇦🇷", limit: 10 },
  { code: "CL", name: "Chile", prefix: "+56", flag: "🇨🇱", limit: 9 },
  { code: "PE", name: "Perú", prefix: "+51", flag: "🇵🇪", limit: 9 },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "🇨🇴", limit: 10 },
  { code: "MX", name: "México", prefix: "+52", flag: "🇲🇽", limit: 10 },
  { code: "ES", name: "España", prefix: "+34", flag: "🇪🇸", limit: 9 },
  { code: "US", name: "Estados Unidos", prefix: "+1", flag: "🇺🇸", limit: 10 },
  { code: "BR", name: "Brasil", prefix: "+55", flag: "🇧🇷", limit: 11 },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "🇺🇾", limit: 8 },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "🇵🇾", limit: 9 },
  { code: "EC", name: "Ecuador", prefix: "+593", flag: "🇪🇨", limit: 9 },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "🇻🇪", limit: 10 },
  { code: "PA", name: "Panamá", prefix: "+507", flag: "🇵🇦", limit: 8 },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "🇨🇷", limit: 8 },
  { code: "DO", name: "Rep. Dominicana", prefix: "+1", flag: "🇩🇴", limit: 10 },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "🇬🇹", limit: 8 },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "🇭🇳", limit: 8 },
  { code: "SV", name: "El Salvador", prefix: "+503", flag: "🇸🇻", limit: 8 },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "🇳🇮", limit: 8 },
  { code: "PR", name: "Puerto Rico", prefix: "+1", flag: "🇵🇷", limit: 10 },
  { code: "IT", name: "Italia", prefix: "+39", flag: "🇮🇹", limit: 10 },
  { code: "FR", name: "Francia", prefix: "+33", flag: "🇫🇷", limit: 9 },
  { code: "DE", name: "Alemania", prefix: "+49", flag: "🇩🇪", limit: 11 },
  { code: "GB", name: "Reino Unido", prefix: "+44", flag: "🇬🇧", limit: 10 },
  { code: "CA", name: "Canadá", prefix: "+1", flag: "🇨🇦", limit: 10 },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "🇵🇹", limit: 9 },
].sort((a, b) => a.name.localeCompare(b.name));

function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "BO") || COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) || 
    c.prefix.includes(searchCountry)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    setLoading(true);

    if (isRegister) {
      const nombre = formData.get("nombre") as string;
      const celularRaw = formData.get("celular") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      // Validación de Contraseña Segura
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError("La contraseña requiere: 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      const fullNumber = `${selectedCountry.prefix}${celularRaw}`;
      const phoneNumber = parsePhoneNumberFromString(fullNumber);
      
      if (!phoneNumber || !phoneNumber.isValid()) {
        setError(`Número inválido para ${selectedCountry.name}. Revisa la cantidad de dígitos.`);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          nombre, 
          celular: phoneNumber.formatInternational() 
        }),
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
    <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 border border-gray-100 relative">
      <div className="text-center mb-8">
        <Image src="/LogoSinLetra.png" alt="Logo" width={70} height={70} className="mx-auto mb-4" />
        <h1 className="font-serif italic text-3xl text-gris">
          {isRegister ? "Crear Cuenta" : "Bienvenido"}
        </h1>
        <p className="text-gray-400 text-sm mt-2">Flor de Loto • Detalles Únicos</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <input 
              name="nombre" 
              type="text" 
              placeholder="Nombre completo" 
              required 
              onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '')}
              className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-[#C5A059] outline-none transition-all" 
            />

            {/* Selector de País con scroll mejorado */}
            <div className="flex gap-2 relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsCountryOpen(!isCountryOpen)}
                className="flex items-center gap-2 p-4 bg-gray-50 border rounded-2xl cursor-pointer hover:bg-gray-100 min-w-[115px] justify-between shadow-sm"
              >
                <span className="text-xl">{selectedCountry.flag}</span>
                <span className="text-sm font-bold">{selectedCountry.code}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {isCountryOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 w-full bg-white border rounded-2xl shadow-2xl z-[999] overflow-hidden"
                  >
                    <div className="p-3 border-b sticky top-0 bg-white flex items-center gap-2">
                      <Search size={14} className="text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nombre o prefijo..." 
                        value={searchCountry}
                        onChange={(e) => setSearchCountry(e.target.value)}
                        className="w-full text-xs outline-none bg-transparent"
                        autoFocus
                      />
                    </div>
                    {/* Contenedor de lista con scroll */}
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {filteredCountries.map((c) => (
                        <div 
                          key={c.code}
                          onClick={() => {
                            setSelectedCountry(c);
                            setIsCountryOpen(false);
                            setSearchCountry("");
                          }}
                          className="flex items-center justify-between p-4 hover:bg-[#FDF8F0] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{c.flag}</span>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700 font-semibold">{c.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{c.prefix}</span>
                            </div>
                          </div>
                          {selectedCountry.code === c.code && <Check size={16} className="text-[#C5A059]" />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold border-r pr-2 h-5 flex items-center">
                  {selectedCountry.prefix}
                </span>
                <input 
                  name="celular" 
                  type="tel" 
                  placeholder="Número de celular" 
                  required 
                  maxLength={selectedCountry.limit}
                  onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')}
                  className="w-full p-4 pl-20 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-[#C5A059] outline-none" 
                />
              </div>
            </div>
          </>
        )}
        
        <input name="email" type="email" placeholder="Correo electrónico" required className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-[#C5A059] outline-none" />
        
        <div className="relative">
          <input 
            name="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Contraseña" 
            required 
            className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-[#C5A059] outline-none" 
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
              className="w-full p-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-[#C5A059] outline-none" 
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        )}
        
        {error && <p className="text-red-500 text-[11px] text-center font-bold bg-red-50 p-2 rounded-xl">{error}</p>}
        
        <button disabled={loading} className="w-full bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#b38f4d] shadow-lg shadow-[#C5A059]/20 transition-all disabled:bg-gray-400">
          {loading ? "Procesando..." : (isRegister ? "Registrarme" : "Iniciar Sesión")}
        </button>
      </form>

      <div className="relative my-6 text-center">
        <span className="bg-white px-4 text-gray-400 text-[10px] uppercase tracking-widest relative z-10">O continuar con</span>
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-100"></div>
      </div>

      <button 
        onClick={() => signIn("google", { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 border border-gray-200 py-4 rounded-2xl hover:bg-gray-50 transition-all font-semibold text-gray-600 mb-6"
      >
        <Image src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
        Google
      </button>

      <div className="text-center">
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
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <Suspense fallback={<div>Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}