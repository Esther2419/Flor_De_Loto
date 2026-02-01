"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  Send, User, Phone, Clock, Loader2, Trash2, 
  ShieldCheck, UserCheck, ChevronDown, Search, Check, Lock, AlertCircle, Calendar, AlertTriangle, Wallet
} from "lucide-react";
import { createOrderAction } from "@/app/actions/orders";
import { useToast } from "@/context/ToastContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ReservaClient({ userData }: { userData: any }) {
  const { items, total, clearCart, removeFromCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [tiendaAbiertaBD, setTiendaAbiertaBD] = useState(true);
  const [cierreTemporal, setCierreTemporal] = useState(false);
  const [yaCerroPorHora, setYaCerroPorHora] = useState(false);
  const [horario, setHorario] = useState({ min: "09:00", max: "21:00" });
  const [minutosPrep, setMinutosPrep] = useState(6);
  const [minTimeValid, setMinTimeValid] = useState("00:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- LÓGICA DE CALENDARIO ---
  const fechaHoyBolivia = useMemo(() => {
    const ahora = new Date();
    const bolivia = new Date(ahora.toLocaleString("en-US", { timeZone: "America/La_Paz" }));
    return bolivia.toISOString().split('T')[0];
  }, []);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c => c.code === "BO") || COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({ 
    whatsapp: userData.celular?.replace(/\D/g, '') || "", 
    quienRecoge: "", 
    fechaEntrega: fechaHoyBolivia, // Inicializado hoy
    horaRecojo: "" 
  });

  useEffect(() => {
    const checkStatus = () => {
      const ahora = new Date();
      const horaActualStr = ahora.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit', timeZone: "America/La_Paz" });
      const [h, m] = horaActualStr.split(':').map(Number);
      const minTotal = h * 60 + m;
      
      const buffer = minTotal + minutosPrep + 2;
      const hStr = String(Math.floor(buffer / 60) % 24).padStart(2, '0');
      const mStr = String(buffer % 60).padStart(2, '0');
      
      // Solo aplicamos minTime si la fecha seleccionada es hoy
      if (formData.fechaEntrega === fechaHoyBolivia) {
        setMinTimeValid(`${hStr}:${mStr}`);
      } else {
        setMinTimeValid(horario.min);
      }

      const [hA, mA] = horario.min.split(':').map(Number);
      const [hC, mC] = horario.max.split(':').map(Number);
      setYaCerroPorHora(minTotal < (hA * 60 + mA) || minTotal >= (hC * 60 + mC));
    };

    checkStatus();
    const inv = setInterval(checkStatus, 30000);
    return () => clearInterval(inv);
  }, [horario, minutosPrep, formData.fechaEntrega, fechaHoyBolivia]);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setTiendaAbiertaBD(data.tienda_abierta);
        setCierreTemporal(data.cierre_temporal);
        setHorario({ min: data.horario_apertura.slice(0, 5), max: data.horario_cierre.slice(0, 5) });
        setMinutosPrep(Number(data.minutos_preparacion) || 6);
      }
    };
    fetchConfig();
  }, []);

  const estaRealmenteAbierto = tiendaAbiertaBD && !cierreTemporal && (formData.fechaEntrega !== fechaHoyBolivia || !yaCerroPorHora);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estaRealmenteAbierto || items.length === 0) return;
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await createOrderAction({
        nombre_contacto: userData.nombre,
        telefono_contacto: `${selectedCountry.prefix}${formData.whatsapp}`,
        fecha_entrega: formData.fechaEntrega,
        quien_recoge: formData.quienRecoge,
        hora_recojo: formData.horaRecojo,
        total: total,
        items: items
      });

      if (result.success) {
        toast("¡Pedido guardado!", "success");
        clearCart();
        window.location.href = "/mis-pedidos";
      } else {
        toast(result.message, "error");
        setIsSubmitting(false);
      }
    } catch (err) {
      toast("Error de red", "error");
      setIsSubmitting(false);
    }
  };

  const handleFinalConfirm = async () => {
    setShowConfirmModal(false);
    await executeSubmit();
  };

  const filteredCountries = COUNTRIES.filter(c => c.name.toLowerCase().includes(searchCountry.toLowerCase()) || c.prefix.includes(searchCountry));

  const formatTimeStr = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(':');
      const d = new Date(); d.setHours(parseInt(h), parseInt(m));
      return format(d, "hh:mm aa");
    } catch { return timeStr; }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className={`lg:col-span-2 bg-white p-8 md:p-12 rounded-[2.5rem] border transition-all ${!estaRealmenteAbierto ? "opacity-60 grayscale pointer-events-none" : "border-gray-100 shadow-sm"}`}>
          
          {!tiendaAbiertaBD || cierreTemporal ? (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              <AlertCircle size={14} /> LA TIENDA ESTÁ CERRADA TEMPORALMENTE.
            </div>
          ) : yaCerroPorHora && formData.fechaEntrega === fechaHoyBolivia ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl mb-6 text-center text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              <Clock size={14} /> TIENDA CERRADA POR HOY. PUEDES AGENDAR PARA MAÑANA.
            </div>
          ) : (
            <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl mb-6 text-center text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Check size={14} /> TIENDA ABIERTA • RECOJOS HASTA LAS {formatTimeStr(horario.max)}
            </div>
          )}

          <h2 className="font-serif italic text-4xl text-gris mb-2">Finalizar Reserva</h2>
          <p className="text-gray-400 text-sm mb-8">Información para el recojo en tienda física.</p>
          
          <form onSubmit={handlePreSubmit} className="space-y-8">
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                <UserCheck className="text-[#C5A059]" size={24} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Cliente Titular</p>
                  <p className="text-sm font-bold text-gray-700">{userData.nombre}</p>
                </div>
                <Lock size={16} className="text-gray-300" />
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <User size={12}/> Persona que recoge
                </label>
                <div className="relative group">
                  <input 
                    type="text" required value={formData.quienRecoge}
                    onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/[0-9]/g, ''); 
                        setFormData({...formData, quienRecoge: target.value});
                    }}
                    placeholder="Nombre completo"
                    className="w-full p-4 pl-12 bg-white border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] transition-all font-medium"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                </div>
              </div>

              <div className="space-y-2" ref={dropdownRef}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><Phone size={12}/> WhatsApp de Contacto</label>
                <div className="flex gap-2 relative">
                    <div onClick={() => setIsCountryOpen(!isCountryOpen)} className="flex items-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 min-w-[130px] justify-between transition-colors shadow-sm">
                        <div className="flex items-center gap-2">
                            <img src={selectedCountry.flag} alt={selectedCountry.code} className="w-6 h-4 object-cover rounded-sm" />
                            <span className="text-sm font-bold text-gray-600">{selectedCountry.prefix}</span>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </div>

                    <AnimatePresence>
                        {isCountryOpen && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 mt-2 w-full md:w-[320px] bg-white border border-gray-100 rounded-2xl shadow-xl z-[50] overflow-hidden">
                            <div className="p-3 border-b sticky top-0 bg-white flex items-center gap-2">
                                <Search size={14} className="text-gray-400" />
                                <input type="text" placeholder="Buscar país..." value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="w-full text-xs outline-none bg-transparent" autoFocus />
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                            {filteredCountries.map((c) => (
                                <div key={c.code} onClick={() => { setSelectedCountry(c); setIsCountryOpen(false); setSearchCountry(""); }}
                                    className="flex items-center justify-between p-3 hover:bg-[#FDF8F0] cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-4 relative rounded-sm overflow-hidden"><img src={c.flag} className="object-cover w-full h-full" /></div>
                                        <div className="flex flex-col"><span className="text-xs text-gray-700 font-bold">{c.name}</span><span className="text-[10px] text-gray-400 font-mono">{c.prefix}</span></div>
                                    </div>
                                    {selectedCountry.code === c.code && <Check size={14} className="text-[#C5A059]" />}
                                </div>
                            ))}
                            </div>
                        </motion.div>
                        )}
                    </AnimatePresence>

                    <input 
                        type="tel" required placeholder="Número" maxLength={selectedCountry.limit}
                        value={formData.whatsapp}
                        onInput={(e) => e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')}
                        onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} 
                        className="flex-1 p-4 border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] transition-all font-medium" 
                    />
                </div>
              </div>
            </div>

            {/* SECCIÓN DE FECHA Y HORA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar size={12}/> Fecha de Recojo
                </label>
                <div className="relative">
                  <input 
                    type="date" required 
                    min={fechaHoyBolivia} // BLOQUEA FECHAS ANTERIORES
                    value={formData.fechaEntrega}
                    onChange={(e) => setFormData({...formData, fechaEntrega: e.target.value})} 
                    className="w-full p-4 pl-12 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] text-gris font-bold" 
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={18} /></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Clock size={12}/> Hora Estimada
                </label>
                <div className="relative">
                  <input 
                    type="time" required 
                    min={minTimeValid} max={horario.max} 
                    value={formData.horaRecojo}
                    onChange={(e) => setFormData({...formData, horaRecojo: e.target.value})} 
                    className="w-full p-4 pl-12 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] text-gris font-bold" 
                  />
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={18} /></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <p className="text-[11px] text-[#C5A059] font-black italic flex items-center gap-2 uppercase tracking-tighter">
                  <Clock size={13} className="animate-pulse" />
                  Necesitamos por lo menos {minutosPrep + 2} minutos para realizar tu pedido.
              </p>
              <p className="text-[10px] text-gray-400 font-medium ml-5 uppercase">
                {estaRealmenteAbierto 
                  ? `* Recojo disponible para el ${formData.fechaEntrega === fechaHoyBolivia ? 'día de hoy' : formData.fechaEntrega}: de ${formatTimeStr(minTimeValid)} a ${formatTimeStr(horario.max)}.`
                  : "LA TIENDA SE ENCUENTRA CERRADA."}
              </p>
            </div>

            <button 
                disabled={!estaRealmenteAbierto || isSubmitting || items.length === 0} 
                className="w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 bg-[#C5A059] text-white hover:bg-[#b38f4d] disabled:opacity-50 transition-all shadow-lg shadow-[#C5A059]/20"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /><span>Procesando...</span></>
              ) : (
                <><Send size={16} /><span>Confirmar Reserva (Bs {total})</span></>
              )}
            </button>
          </form>
        </div>

        {/* RESUMEN DERECHA */}
        <div className="bg-white/50 backdrop-blur-md p-8 rounded-[2.5rem] border border-white h-fit shadow-sm sticky top-32">
          <h3 className="font-serif italic text-2xl text-gris mb-6">Tu pedido</h3>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-white/50 last:border-0">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white">
                  <Image src={item.foto || "/portada.jpg"} alt={item.nombre} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-bold uppercase truncate pr-2 text-gris">{item.nombre}</p>
                        <button onClick={() => !isSubmitting && removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <p className="text-xs font-bold text-[#C5A059] mt-1">Bs {item.precio} x {item.cantidad}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200/50 pt-6 flex justify-between items-center font-bold">
              <span className="font-serif italic text-2xl text-gris">Total Final</span>
              <span className="text-2xl font-bold text-[#C5A059]">Bs {total}</span>
          </div>
        </div>
      </div>

      {/* MODAL DE DOBLE CONFIRMACIÓN */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#C5A059]/10 p-3 rounded-2xl">
                    <AlertTriangle className="text-[#C5A059]" size={24} />
                  </div>
                  <h3 className="font-serif italic text-2xl text-gris">¿Confirmar Reserva?</h3>
                </div>

                <div className="space-y-4 mb-6">
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Estás por reservar <strong>{items.length} producto(s)</strong> por un total de <strong>Bs {total}</strong>.
                  </p>
                  
                  {/* Detalle de stock y cancelación */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={18} />
                    <p className="text-[11px] text-amber-800 font-medium">
                      <strong>NOTA IMPORTANTE:</strong> En caso de falta de stock de alguna flor o material específico, se le notificará y el pedido podría ser cancelado o modificado.
                    </p>
                  </div>

                  {/* Detalle de pago */}
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-blue-600 mb-2 flex items-center gap-2">
                       <Wallet size={12}/> Métodos de pago en tienda
                    </p>
                    <div className="flex gap-4">
                        <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <Check size={14}/> Efectivo
                        </span>
                        <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                            <Check size={14}/> Transferencia QR
                        </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    className="py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Revisar de nuevo
                  </button>
                  <button 
                    onClick={handleFinalConfirm}
                    className="py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] bg-[#C5A059] text-white hover:bg-[#b38f4d] transition-all"
                  >
                    Confirmar y Finalizar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}