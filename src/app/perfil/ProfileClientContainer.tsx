"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, User, Edit2, X, ChevronDown, Search, Check, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { updateProfile } from "./actions";
import { useSession } from "next-auth/react";

const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "https://flagcdn.com/bo.svg", limit: 8 },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "https://flagcdn.com/ar.svg", limit: 10 },
  { code: "CL", name: "Chile", prefix: "+56", flag: "https://flagcdn.com/cl.svg", limit: 9 },
  { code: "PE", name: "Perú", prefix: "+51", flag: "https://flagcdn.com/pe.svg", limit: 9 },
];

export default function ProfileClientContainer({ usuario, children }: { usuario: any, children: React.ReactNode }) {
  const { update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [nombre, setNombre] = useState(usuario.nombre);
  const [celularRaw, setCelularRaw] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  useEffect(() => {
    const phone = parsePhoneNumberFromString(usuario.celular || "");
    if (phone) {
      const country = COUNTRIES.find(c => c.prefix === `+${phone.countryCallingCode}`);
      if (country) {
        setSelectedCountry(country);
        setCelularRaw(phone.nationalNumber.toString());
      }
    }
  }, [usuario.celular]);

  const handleSave = async () => {
    setLoading(true);
    const fullNumber = celularRaw ? `${selectedCountry.prefix}${celularRaw}` : "";
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("celular", fullNumber);

    const res = await updateProfile(formData);
    if (res.success) {
        await update({ name: nombre });
        setIsEditing(false);
        window.location.reload(); 
    }
    setLoading(false);
  };

  return (
    <>
      {/* CABECERA NEGRA */}
      <div className="bg-[#050505] p-10 flex flex-col items-center text-center relative">
        <div className="absolute top-8 right-8 md:right-12">
            <button 
                onClick={() => setIsEditing(!isEditing)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#C5A059]/40 hover:bg-[#C5A059] hover:border-[#C5A059] transition-all duration-300"
            >
                {isEditing ? (
                    <><X size={14} className="text-white" /><span className="text-white text-[10px] font-bold uppercase tracking-widest">Cerrar Edición</span></>
                ) : (
                    <><Edit2 size={14} className="text-[#C5A059] group-hover:text-white" /><span className="text-[#C5A059] group-hover:text-white text-[10px] font-bold uppercase tracking-widest">Editar Perfil</span></>
                )}
            </button>
        </div>

        <div className="w-24 h-24 bg-[#C5A059]/10 rounded-full flex items-center justify-center mb-4 border border-[#C5A059]/20 shadow-2xl">
            <User size={48} className="text-[#C5A059]" />
        </div>
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{isEditing ? "Modo Edición" : nombre}</h2>
        <p className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.4em] mt-2">{usuario.rol}</p>
      </div>

      <div className="p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* COLUMNA IZQUIERDA: DATOS PERSONALES */}
          <div className="space-y-10">
            <h3 className="text-xl font-serif italic text-gris border-b border-gray-100 pb-4">Datos Personales</h3>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <User size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Nombre Completo</span>
              </div>
              {isEditing ? (
                <input 
                  value={nombre}
                  onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[0-9]/g, '')}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full text-lg font-medium text-gris border-b border-[#C5A059] bg-transparent outline-none pb-2 transition-colors focus:border-gris"
                />
              ) : (
                <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">{nombre}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Mail size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Correo Electrónico</span>
              </div>
              <p className="text-gray-400 font-medium text-lg border-b border-gray-50 pb-2 italic">{usuario.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Phone size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Celular / WhatsApp</span>
              </div>
              {isEditing ? (
                <div className="flex gap-3 border-b border-[#C5A059] pb-2 relative">
                    <div onClick={() => setIsCountryOpen(!isCountryOpen)} className="flex items-center gap-1 cursor-pointer hover:text-[#C5A059] transition-colors">
                        <img src={selectedCountry.flag} className="w-5 h-3 object-cover rounded-sm shadow-sm" />
                        <span className="text-sm font-bold">{selectedCountry.prefix}</span>
                        <ChevronDown size={12} />
                    </div>
                    <input 
                        value={celularRaw}
                        maxLength={selectedCountry.limit}
                        onChange={(e) => setCelularRaw(e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1 text-lg font-medium text-gris bg-transparent outline-none"
                    />
                    <AnimatePresence>
                        {isCountryOpen && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="absolute top-full left-0 w-full bg-white shadow-2xl border border-gray-100 rounded-2xl z-50 p-3 mt-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {COUNTRIES.map(c => (
                                    <div key={c.code} onClick={() => {setSelectedCountry(c); setIsCountryOpen(false);}} className="flex items-center justify-between p-3 hover:bg-crema cursor-pointer rounded-xl transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img src={c.flag} className="w-6 h-4 rounded-sm shadow-sm" />
                                            <span className="text-xs font-bold text-gris">{c.name}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono">{c.prefix}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              ) : (
                <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">{usuario.celular || "No registrado"}</p>
              )}
            </div>

            {isEditing && (
                <motion.button 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-[#050505] text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all shadow-2xl flex items-center justify-center gap-3"
                >
                    {loading ? "Actualizando..." : <><Save size={18} /> Guardar Cambios</>}
                </motion.button>
            )}
          </div>

          {/* COLUMNA DERECHA: SEGURIDAD Y FECHAS */}
          <div className="space-y-10">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}