"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  UserPlus, ShieldAlert, Trash2, Loader2, Mail, Lock, User, Phone,
  ShieldCheck, UserCog, ChevronDown, CheckCircle2, XCircle, Search, Globe,
  Eye, EyeOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "https://flagcdn.com/bo.svg" },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "https://flagcdn.com/ar.svg" },
  { code: "CL", name: "Chile", prefix: "+56", flag: "https://flagcdn.com/cl.svg" },
  { code: "PE", name: "Perú", prefix: "+51", flag: "https://flagcdn.com/pe.svg" },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "https://flagcdn.com/co.svg" },
  { code: "MX", name: "México", prefix: "+52", flag: "https://flagcdn.com/mx.svg" },
  { code: "ES", name: "España", prefix: "+34", flag: "https://flagcdn.com/es.svg" },
  { code: "US", name: "Estados Unidos", prefix: "+1", flag: "https://flagcdn.com/us.svg" },
  { code: "BR", name: "Brasil", prefix: "+55", flag: "https://flagcdn.com/br.svg" },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "https://flagcdn.com/uy.svg" },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "https://flagcdn.com/py.svg" },
  { code: "EC", name: "Ecuador", prefix: "+593", flag: "https://flagcdn.com/ec.svg" },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "https://flagcdn.com/ve.svg" },
  { code: "PA", name: "Panamá", prefix: "+507", flag: "https://flagcdn.com/pa.svg" },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "https://flagcdn.com/cr.svg" },
  { code: "DO", name: "Rep. Dominicana", prefix: "+1", flag: "https://flagcdn.com/do.svg" },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "https://flagcdn.com/gt.svg" },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "https://flagcdn.com/hn.svg" },
  { code: "SV", name: "El Salvador", prefix: "+503", flag: "https://flagcdn.com/sv.svg" },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "https://flagcdn.com/ni.svg" },
  { code: "PR", name: "Puerto Rico", prefix: "+1", flag: "https://flagcdn.com/pr.svg" },
  { code: "IT", name: "Italia", prefix: "+39", flag: "https://flagcdn.com/it.svg" },
  { code: "FR", name: "Francia", prefix: "+33", flag: "https://flagcdn.com/fr.svg" },
  { code: "DE", name: "Alemania", prefix: "+49", flag: "https://flagcdn.com/de.svg" },
  { code: "GB", name: "Reino Unido", prefix: "+44", flag: "https://flagcdn.com/gb.svg" },
  { code: "CA", name: "Canadá", prefix: "+1", flag: "https://flagcdn.com/ca.svg" },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "https://flagcdn.com/pt.svg" }
].sort((a, b) => a.name.localeCompare(b.name));

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "BO") || COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const [numeroLocal, setNumeroLocal] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "", email: "", password: "", celular: "", rol: "AdminMenor"
  });

  const [validaciones, setValidaciones] = useState({
    passLen: false, passUpper: false, passNum: false, passSpec: false, phoneVal: false, nameVal: false
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsCountryOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fullPhone = `${selectedCountry.prefix}${numeroLocal}`;
    setNuevoUsuario(prev => ({ ...prev, celular: fullPhone }));
    
    const p = nuevoUsuario.password;
    setValidaciones({
      passLen: p.length >= 8,
      passUpper: /[A-Z]/.test(p) && /[a-z]/.test(p),
      passNum: /\d/.test(p),
      passSpec: /[@$!%*?&.]/.test(p), // Incluimos el punto (.)
      phoneVal: numeroLocal.length >= 7,
      nameVal: nuevoUsuario.nombre.length > 2 && !/\d/.test(nuevoUsuario.nombre)
    });
  }, [selectedCountry, numeroLocal, nuevoUsuario.password, nuevoUsuario.nombre]);

  const formValido = Object.values(validaciones).every(v => v === true);

  const fetchUsuarios = async () => {
    const { data } = await supabase.from('usuarios').select('*').order('fecha_registro', { ascending: false });
    if (data) {
      const filtrados = data.filter(u => 
        u.rol?.toLowerCase() === "admin" || u.rol?.toLowerCase() === "adminmenor"
      );
      setUsuarios(filtrados);
    }
    setCargandoLista(false);
  };

  useEffect(() => {
    fetchUsuarios();
    const canal = supabase.channel('realtime-usuarios').on('postgres_changes', 
      { event: '*', table: 'usuarios', schema: 'public' }, () => fetchUsuarios()).subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  const registrarTrabajador = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    setCargando(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          password: nuevoUsuario.password,
          celular: nuevoUsuario.celular,
          rol: nuevoUsuario.rol 
        })
      });

      if (res.ok) {
        alert("¡Acceso creado con éxito!");
        setNuevoUsuario({ nombre: "", email: "", password: "", celular: "", rol: "AdminMenor" });
        setNumeroLocal("");
        setShowPassword(false);
      } else {
        const d = await res.json();
        alert("Error: " + (d.error || d.message || "Datos no válidos"));
      }
    } catch (error) {
      alert("Error en el servidor");
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el acceso de ${nombre}?`)) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) alert("Error al eliminar");
  };

  const Requisito = ({ met, text }: { met: boolean, text: string }) => (
    <div className={`flex items-center gap-2 text-[10px] font-bold ${met ? 'text-green-500' : 'text-gray-300'}`}>
      {met ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {text}
    </div>
  );

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) || c.prefix.includes(searchCountry)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 p-4 animate-in fade-in duration-700">
      
      <div className="border-b border-gray-100 pb-8">
        <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-[0.2em] mb-2">
          <Globe size={14} /> Panel de Seguridad
        </div>
        <h2 className="text-4xl font-serif italic text-gray-900">Gestión de Personal</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* FORMULARIO */}
        <div className="lg:col-span-5 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="bg-[#C5A059] p-3 rounded-2xl text-white shadow-lg">
              <UserPlus size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Registrar Trabajador</h3>
          </div>

          <form onSubmit={registrarTrabajador} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre Completo</label>
              <input required type="text" value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#C5A059] outline-none"
                placeholder="Ej. Juan Pérez"
              />
              <Requisito met={validaciones.nameVal} text="Sin números y mín. 3 letras" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contacto Internacional</label>
              <div className="flex gap-3 relative" ref={dropdownRef}>
                <div onClick={() => setIsCountryOpen(!isCountryOpen)}
                  className="flex items-center gap-2 px-4 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-white min-w-[120px] justify-between shadow-sm transition-all"
                >
                  <img src={selectedCountry.flag} className="object-cover w-6 h-4 rounded-sm shadow-sm" alt="flag" />
                  <span className="text-sm font-bold">{selectedCountry.code}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
                </div>

                <AnimatePresence>
                  {isCountryOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-[999] overflow-hidden"
                    >
                      <div className="p-3 border-b bg-white flex items-center gap-2">
                        <Search size={14} className="text-[#C5A059]" />
                        <input type="text" placeholder="Buscar país..." value={searchCountry}
                          onChange={(e) => setSearchCountry(e.target.value)}
                          className="w-full text-xs outline-none font-bold"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-52 overflow-y-auto custom-scrollbar p-1">
                        {filteredCountries.map(c => (
                          <div key={c.code} onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); setSearchCountry(""); }}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FDF8F0] cursor-pointer transition-colors"
                          >
                            <img src={c.flag} className="w-6 h-4 rounded-sm shadow-sm" alt={c.name} />
                            <span className="text-xs font-bold text-gray-700">{c.name} ({c.prefix})</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C5A059] font-bold border-r border-[#C5A059]/20 pr-3 h-4 flex items-center">
                    {selectedCountry.prefix}
                  </span>
                  <input required type="tel" value={numeroLocal}
                    onChange={(e) => setNumeroLocal(e.target.value.replace(/\D/g, ""))}
                    className="w-full p-4 pl-16 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#C5A059] outline-none"
                    placeholder="70000000"
                  />
                </div>
              </div>
              <p className="text-[9px] text-gray-400 ml-1 mt-1 font-medium">Formato: <span className="text-[#C5A059] font-black">{nuevoUsuario.celular}</span></p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <input required type="email" value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#C5A059] outline-none"
                placeholder="staff@flordeloto.com"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contraseña Segura</label>
              <div className="relative">
                <input required type={showPassword ? "text" : "password"} value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-[#C5A059] outline-none"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C5A059] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 p-4 bg-[#FDF8F0] rounded-3xl border border-[#C5A059]/10">
                <Requisito met={validaciones.passLen} text="Min. 8 char" />
                <Requisito met={validaciones.passUpper} text="Mayús/Min" />
                <Requisito met={validaciones.passNum} text="Número" />
                <Requisito met={validaciones.passSpec} text="Símbolo (@.!?)" />
              </div>
            </div>

            <button disabled={cargando || !formValido}
              className={`w-full py-5 rounded-3xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                formValido ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              {cargando ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} className="text-[#C5A059]" />}
              CREAR ACCESO
            </button>
          </form>
        </div>

        {/* LISTA */}
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3"><UserCog size={28} className="text-[#C5A059]"/> Equipo Activo</h3>
            <span className="text-[10px] font-black bg-green-50 text-green-500 px-3 py-1 rounded-full border border-green-100 animate-pulse">SINCRO LIVE</span>
          </div>
          
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {cargandoLista ? (
              <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-[#C5A059]" /></div>
            ) : usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100 transition-all hover:bg-white hover:shadow-xl hover:border-[#C5A059]/30 group">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-lg ${
                    u.rol?.toLowerCase() === 'admin' ? 'bg-[#C5A059]' : 'bg-gray-400'
                  }`}>
                    {u.nombre_completo[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm leading-none mb-2">{u.nombre_completo}</p>
                    <span className="text-[9px] bg-white border border-gray-200 text-[#C5A059] px-2 py-0.5 rounded-lg font-black uppercase inline-block">
                      {u.rol}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <div className="text-right">
                     <p className="text-[11px] font-black text-gray-700 mb-1">{u.celular}</p>
                     <p className="text-[9px] text-gray-400">{u.email}</p>
                   </div>
                   {u.rol?.toLowerCase() === "adminmenor" && (
                     <button onClick={() => eliminarUsuario(u.id, u.nombre_completo)}
                       className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}