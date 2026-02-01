"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Send, User, Phone, Clock, Loader2, Trash2, ShieldCheck, UserCheck, ChevronDown, Search, Check } from "lucide-react";
import { createOrderAction } from "@/app/actions/orders";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// --- LISTA DE PAÍSES ---
const COUNTRIES = [
  { code: "BO", name: "Bolivia", prefix: "+591", flag: "https://flagcdn.com/bo.svg", limit: 8 },
  { code: "AR", name: "Argentina", prefix: "+54", flag: "https://flagcdn.com/ar.svg", limit: 10 },
  { code: "CL", name: "Chile", prefix: "+56", flag: "https://flagcdn.com/cl.svg", limit: 9 },
  { code: "PE", name: "Perú", prefix: "+51", flag: "https://flagcdn.com/pe.svg", limit: 9 },
  { code: "CO", name: "Colombia", prefix: "+57", flag: "https://flagcdn.com/co.svg", limit: 10 },
  { code: "MX", name: "México", prefix: "+52", flag: "https://flagcdn.com/mx.svg", limit: 10 },
  { code: "ES", name: "España", prefix: "+34", flag: "https://flagcdn.com/es.svg", limit: 9 },
  { code: "US", name: "Estados Unidos", prefix: "+1", flag: "https://flagcdn.com/us.svg", limit: 10 },
  { code: "BR", name: "Brasil", prefix: "+55", flag: "https://flagcdn.com/br.svg", limit: 11 },
  { code: "UY", name: "Uruguay", prefix: "+598", flag: "https://flagcdn.com/uy.svg", limit: 8 },
  { code: "PY", name: "Paraguay", prefix: "+595", flag: "https://flagcdn.com/py.svg", limit: 9 },
  { code: "EC", name: "Ecuador", prefix: "+593", flag: "https://flagcdn.com/ec.svg", limit: 9 },
  { code: "VE", name: "Venezuela", prefix: "+58", flag: "https://flagcdn.com/ve.svg", limit: 10 },
  { code: "PA", name: "Panamá", prefix: "+507", flag: "https://flagcdn.com/pa.svg", limit: 8 },
  { code: "CR", name: "Costa Rica", prefix: "+506", flag: "https://flagcdn.com/cr.svg", limit: 8 },
  { code: "DO", name: "Rep. Dominicana", prefix: "+1", flag: "https://flagcdn.com/do.svg", limit: 10 },
  { code: "GT", name: "Guatemala", prefix: "+502", flag: "https://flagcdn.com/gt.svg", limit: 8 },
  { code: "HN", name: "Honduras", prefix: "+504", flag: "https://flagcdn.com/hn.svg", limit: 8 },
  { code: "SV", name: "El Salvador", prefix: "+503", flag: "https://flagcdn.com/sv.svg", limit: 8 },
  { code: "NI", name: "Nicaragua", prefix: "+505", flag: "https://flagcdn.com/ni.svg", limit: 8 },
  { code: "PR", name: "Puerto Rico", prefix: "+1", flag: "https://flagcdn.com/pr.svg", limit: 10 },
  { code: "IT", name: "Italia", prefix: "+39", flag: "https://flagcdn.com/it.svg", limit: 10 },
  { code: "FR", name: "Francia", prefix: "+33", flag: "https://flagcdn.com/fr.svg", limit: 9 },
  { code: "DE", name: "Alemania", prefix: "+49", flag: "https://flagcdn.com/de.svg", limit: 11 },
  { code: "GB", name: "Reino Unido", prefix: "+44", flag: "https://flagcdn.com/gb.svg", limit: 10 },
  { code: "CA", name: "Canadá", prefix: "+1", flag: "https://flagcdn.com/ca.svg", limit: 10 },
  { code: "PT", name: "Portugal", prefix: "+351", flag: "https://flagcdn.com/pt.svg", limit: 9 },
].sort((a, b) => a.name.localeCompare(b.name));

interface ReservaClientProps {
  userData: {
    nombre: string;
    celular: string;
    email: string;
  };
}

export default function ReservaClient({ userData }: ReservaClientProps) {
  const { items, total, clearCart, removeFromCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [tiendaAbierta, setTiendaAbierta] = useState<boolean>(true);
  const [horario, setHorario] = useState({ min: "09:00", max: "19:00" });
  
  // Estados para el selector de país
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "BO") || COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initializePhone = () => {
    if (!userData.celular) return "";
    const phoneNumber = parsePhoneNumberFromString(userData.celular);
    if (phoneNumber && phoneNumber.country) {
      const foundCountry = COUNTRIES.find(c => c.code === phoneNumber.country);
      if (foundCountry) {
        setSelectedCountry(foundCountry);
        return phoneNumber.nationalNumber;
      }
    }
    return userData.celular.replace(/\D/g, ''); 
  };

  const [formData, setFormData] = useState({ 
    whatsapp: initializePhone(), 
    quienRecoge: "",
    horaRecojo: "" 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimeStr = (timeStr: string) => {
    try {
      return format(new Date(`2000-01-01T${timeStr}`), "hh:mm aa");
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    const fetchYEscuchar = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setTiendaAbierta(data.tienda_abierta);
        setHorario({ min: data.horario_apertura.slice(0, 5), max: data.horario_cierre.slice(0, 5) });
      }
    };
    fetchYEscuchar();
  }, []);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) || 
    c.prefix.includes(searchCountry)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !tiendaAbierta || isSubmitting) return;

    if (/\d/.test(formData.quienRecoge)) {
       toast("El nombre no debe contener números", "error");
       return;
    }

    const fullNumber = `${selectedCountry.prefix}${formData.whatsapp}`;
    const phoneNumber = parsePhoneNumberFromString(fullNumber);
      
    if (!phoneNumber || !phoneNumber.isValid()) {
      toast(`Número inválido para ${selectedCountry.name}.`, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        nombre_contacto: formData.quienRecoge,
        telefono_contacto: phoneNumber.formatInternational(),
        fecha_entrega: new Date().toISOString(),
        quien_recoge: formData.quienRecoge,
        hora_recojo: formData.horaRecojo,
        total: total,
        items: items
      });

      if (result.success) {
        clearCart();
        toast(`¡Pedido #${result.orderId} confirmado!`, "success");
        router.push("/mis-pedidos");
      } else {
         toast("Error al crear el pedido", "error");
      }
    } catch (error) {
      console.error(error);
      toast("Error inesperado al procesar", "error");
    } finally {
      setTimeout(() => setIsSubmitting(false), 500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <div className={`lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] border transition-all ${!tiendaAbierta ? "opacity-60 grayscale pointer-events-none" : "border-gray-100 shadow-sm"}`}>
          
          {!tiendaAbierta && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-center text-xs font-bold uppercase tracking-widest">
              La tienda está cerrada en este momento.
            </div>
          )}

          <h2 className="font-serif italic text-4xl text-gris mb-2">Finalizar Reserva</h2>
          <p className="text-gray-400 text-sm mb-8">Completa los datos para el recojo.</p>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* SECCIÓN 1: DATOS DEL CLIENTE (SOLO LECTURA) */}
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059] mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} /> Titular del Pedido
                </h3>
                <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-full border border-gray-100 shadow-sm">
                        <UserCheck size={24} className="text-gray-400"/>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700">{userData.nombre}</p>
                        <p className="text-xs text-gray-400">{userData.email}</p>
                    </div>
                    <div className="ml-auto">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Verificado</span>
                    </div>
                </div>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User size={12}/> Persona que recoge
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    required 
                    value={formData.quienRecoge}
                    onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[0-9]/g, '');
                        setFormData({...formData, quienRecoge: target.value});
                    }}
                    placeholder="Nombre de quien recoge"
                    className="w-full p-4 pl-12 bg-white border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-medium"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={18} />
                  </div>
                </div>
              </div>

              <div className="space-y-2" ref={dropdownRef}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Phone size={12}/> WhatsApp de Contacto
                </label>
                
                <div className="flex gap-2 relative">
                    <div 
                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                        className="flex items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 min-w-[130px] justify-between transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-4 relative shadow-sm rounded-sm overflow-hidden shrink-0">
                                <img src={selectedCountry.flag} alt={selectedCountry.name} className="object-cover w-full h-full" />
                            </div>
                            <span className="text-sm font-bold text-gray-600">{selectedCountry.prefix}</span>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isCountryOpen ? 'rotate-180' : ''}`} />
                    </div>

                    <AnimatePresence>
                        {isCountryOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-full md:w-[320px] bg-white border border-gray-100 rounded-2xl shadow-xl z-[50] overflow-hidden"
                        >
                            <div className="p-3 border-b sticky top-0 bg-white flex items-center gap-2">
                            <Search size={14} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Buscar país..." 
                                value={searchCountry}
                                onChange={(e) => setSearchCountry(e.target.value)}
                                className="w-full text-xs outline-none bg-transparent"
                                autoFocus
                            />
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredCountries.map((c) => (
                                <div 
                                key={c.code}
                                onClick={() => {
                                    setSelectedCountry(c);
                                    setIsCountryOpen(false);
                                    setSearchCountry("");
                                }}
                                className="flex items-center justify-between p-3 hover:bg-[#FDF8F0] cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                >
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-4 relative shadow-sm rounded-sm overflow-hidden">
                                        <img src={c.flag} alt={c.name} className="object-cover w-full h-full" />
                                    </div>
                                    <div className="flex flex-col">
                                    <span className="text-xs text-gray-700 font-bold">{c.name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono">{c.prefix}</span>
                                    </div>
                                </div>
                                {selectedCountry.code === c.code && <Check size={14} className="text-[#C5A059]" />}
                                </div>
                            ))}
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative flex-1">
                        <input 
                        type="tel" 
                        required 
                        placeholder="Solo números" 
                        maxLength={selectedCountry.limit}
                        value={formData.whatsapp}
                        onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '')}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                        className="w-full p-4 pl-4 bg-white border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all font-medium" 
                        />
                    </div>
                </div>
              </div>
            </div>

            {/* HORA RECOJO */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                 <Clock size={12}/> Hora de Recojo Estimada (Hoy)
              </label>
              <input 
                type="time" 
                required 
                min={horario.min} 
                max={horario.max} 
                onChange={(e) => setFormData({...formData, horaRecojo: e.target.value})} 
                className="w-full p-4 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] bg-white transition-all text-gris" 
              />
              <p className="text-[10px] text-[#C5A059] font-bold italic mt-2 ml-1">
                * Horario de atención: {formatTimeStr(horario.min)} a {formatTimeStr(horario.max)}
              </p>
            </div>

            {/* BOTÓN CON LOADING */}
            <button 
                disabled={!tiendaAbierta || isSubmitting || items.length === 0} 
                className="w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 bg-[#C5A059] text-white hover:bg-[#b38f4d] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C5A059]/20"
            >
              {isSubmitting ? (
                <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Procesando...</span>
                </>
              ) : (
                <>
                    <span>Confirmar Reserva</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">Bs {total}</span>
                    <Send size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white h-fit shadow-sm sticky top-32">
          <h3 className="font-serif italic text-2xl text-gris mb-6">Tu pedido</h3>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-white/50 group last:border-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                  <Image src={item.foto || "/portada.jpg"} alt={item.nombre} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold uppercase truncate pr-2 flex items-center gap-2 text-gris">
                      {item.nombre}
                      {item.esOferta && <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wider">OFERTA</span>}
                    </p>
                    <button 
                        onClick={() => !isSubmitting && removeFromCart(item.id)} 
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs font-bold ${item.esOferta ? 'text-red-600' : 'text-[#C5A059]'}`}>
                      Bs {item.precio} <span className="text-gray-400 font-medium">x {item.cantidad}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200/50 pt-6">
            <div className="flex justify-between items-center text-xl font-bold text-gris">
                <span className="font-serif italic text-2xl">Total Final</span>
                <div className="flex flex-col items-end">
                    <span className="text-[#C5A059]">Bs {total}</span>
                    <span className="text-[9px] text-gray-400 font-normal uppercase tracking-wider">Incluye impuestos</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}