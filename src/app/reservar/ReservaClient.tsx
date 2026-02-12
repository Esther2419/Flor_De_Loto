"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { 
  Send, User, Phone, Clock, Loader2, Trash2, 
  ShieldCheck, UserCheck, ChevronDown, Search, Check, Lock, AlertCircle, Calendar, AlertTriangle, Wallet, CalendarOff,
  QrCode, Download, Upload, CheckCircle2, X
} from "lucide-react";
import { createOrderAction, checkAvailabilityAction, uploadComprobante, deleteComprobante } from "@/app/actions/orders";
import { getBloqueosAction } from "@/app/actions/admin";
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

const generateTimeSlots = (start: string, end: string, step: number) => {
  const slots = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  while (current <= endTotal) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push(timeString);
    current += step;
  }
  return slots;
};

export default function ReservaClient({ userData }: { userData: any }) {
  const { items, total, clearCart, removeFromCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const [tiendaAbiertaBD, setTiendaAbiertaBD] = useState(true);
  const [cierreTemporal, setCierreTemporal] = useState(false);
  const [yaCerroPorHora, setYaCerroPorHora] = useState(false);
  const [horario, setHorario] = useState({ min: "09:00", max: "21:00" });
  const [minutosPrep, setMinutosPrep] = useState(6);
  const [intervalo, setIntervalo] = useState(10);
  const [minTimeValid, setMinTimeValid] = useState("00:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedReasons, setBlockedReasons] = useState<Record<string, string>>({});
  const [currentBlockedReason, setCurrentBlockedReason] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [qrPagoUrl, setQrPagoUrl] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isOrderCompleted = useRef(false);
  const comprobanteUrlRef = useRef<string | null>(null);

  useEffect(() => {
    comprobanteUrlRef.current = comprobanteUrl;
  }, [comprobanteUrl]);

  // Alerta de navegador al intentar recargar o cerrar si hay imagen subida
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (comprobanteUrl && !isOrderCompleted.current) {
        e.preventDefault();
        e.returnValue = ''; // Necesario para que navegadores modernos muestren la alerta estándar
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [comprobanteUrl]);

  // Limpieza automática: Si el usuario se va sin confirmar, borramos la imagen
  useEffect(() => {
    return () => {
      if (!isOrderCompleted.current && comprobanteUrlRef.current) {
        // Usamos fetch con keepalive para asegurar que se envíe aunque se cierre la pestaña
        fetch('/api/cleanup-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: comprobanteUrlRef.current }),
          keepalive: true
        }).catch(err => console.error("Error cleaning up image:", err));
      }
    };
  }, []);

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
    horaRecojo: "",
    titularCuenta: "",
    montoTransferencia: "",
    mensajePago: ""
  });

  // Sincronizar el monto de transferencia con el total del carrito automáticamente
  useEffect(() => {
    setFormData(prev => ({ ...prev, montoTransferencia: total.toString() }));
  }, [total]);

  // Cálculo de validación de pago mínimo (50%)
  const montoMinimo = total * 0.5;
  const montoIngresado = parseFloat(formData.montoTransferencia);
  const esMontoValido = !isNaN(montoIngresado) && montoIngresado >= montoMinimo;

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

  // Función para cargar bloqueos (reutilizable para Realtime)
  const fetchBloqueos = useCallback(async () => {
    try {
      const data = await getBloqueosAction();
      // Solo bloqueamos visualmente los días completos (sin horario específico)
      const fullDayBlocks = data.filter((b: any) => !b.hora_inicio && !b.hora_fin);
      
      const dates = fullDayBlocks.map((b: any) => b.fecha);
      const reasons = fullDayBlocks.reduce((acc: any, b: any) => {
        acc[b.fecha] = b.motivo;
        return acc;
      }, {});
      setBlockedDates(dates);
      setBlockedReasons(reasons);
    } catch (error) {
      console.error("Error actualizando bloqueos:", error);
    }
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setTiendaAbiertaBD(data.tienda_abierta);
        setCierreTemporal(data.cierre_temporal);
        setHorario({ min: data.horario_apertura.slice(0, 5), max: data.horario_cierre.slice(0, 5) });
        setMinutosPrep(Number(data.minutos_preparacion) || 6);
        setIntervalo(Number(data.intervalo_minutos) || 10);
      }
    };
    fetchConfig();
    fetchBloqueos();
  }, [fetchBloqueos]);

  const availableTimeSlots = useMemo(() => {
    if (!horario.min || !horario.max) return [];
    
    const allSlots = generateTimeSlots(horario.min, horario.max, intervalo);
    
    // Filter slots that are earlier than minTimeValid
    return allSlots.filter(slot => slot >= minTimeValid);
  }, [horario, minTimeValid, intervalo]);

  // Cargar el QR de la tabla configuración
  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('configuracion').select('qr_pago').single();
      if (data?.qr_pago) setQrPagoUrl(data.qr_pago);
    }
    fetchConfig();
  }, []);

  // --- REALTIME: Escuchar cambios en bloqueos y pedidos ---
  useEffect(() => {
    const channel = supabase.channel('reservas-realtime-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bloqueos_horario' }, () => {
        console.log("🔒 Cambio en bloqueos detectado por Realtime");
        fetchBloqueos(); // Recargar lista de bloqueos visuales
        setRefreshTrigger(prev => prev + 1); // Revalidar disponibilidad (por si es bloqueo parcial de hora)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        setRefreshTrigger(prev => prev + 1); // Revalidar cupos si entra un pedido nuevo
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBloqueos]);

  // --- REALTIME: Si la fecha seleccionada se bloquea de repente (Día completo) ---
  useEffect(() => {
    if (formData.fechaEntrega && blockedDates.includes(formData.fechaEntrega)) {
      setCurrentBlockedReason(blockedReasons[formData.fechaEntrega] || "");
      setShowBlockedModal(true);
      setFormData(prev => ({ ...prev, fechaEntrega: "" }));
    }
  }, [blockedDates, formData.fechaEntrega, blockedReasons]);

  const estaRealmenteAbierto = tiendaAbiertaBD && !cierreTemporal && (formData.fechaEntrega !== fechaHoyBolivia || !yaCerroPorHora);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estaRealmenteAbierto || items.length === 0) return;
    if (availabilityError) {
      toast(availabilityError, "error");
      return;
    }
    setShowConfirmModal(true);
  };

  // Validar disponibilidad en tiempo real cuando cambia fecha u hora
  useEffect(() => {
    const validateSlot = async () => {
      setAvailabilityError(null);
      if (formData.fechaEntrega && formData.horaRecojo) {
        const check = await checkAvailabilityAction(formData.fechaEntrega, formData.horaRecojo);
        if (!check.available) {
          setAvailabilityError(check.message || "Horario no disponible");
        }
      }
    };
    const timer = setTimeout(validateSlot, 500); // Debounce
    return () => clearTimeout(timer);
  }, [formData.fechaEntrega, formData.horaRecojo, refreshTrigger]);

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
        items: items,
        comprobante_url: comprobanteUrl,
        monto_pagado: parseFloat(formData.montoTransferencia) || total,
        titular_cuenta: formData.titularCuenta,
        mensaje_pago: formData.mensajePago
      });

      if (result.success) {
        isOrderCompleted.current = true; // Marcamos como completado para evitar borrado
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- VALIDACIONES ---
    if (!file.type.startsWith("image/")) {
      toast("El archivo debe ser una imagen válida.", "error");
      return;
    }

    setIsUploading(true);
    let fileToUpload = file;

    // --- COMPRESIÓN AUTOMÁTICA ---
    // Si la imagen pesa más de 1MB, la comprimimos en el navegador antes de subir
    if (file.size > 1 * 1024 * 1024) {
      try {
        fileToUpload = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = document.createElement("img");
            img.src = event.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              
              // Redimensionar a máximo 1200px (HD)
              const MAX_WIDTH = 1200;
              const MAX_HEIGHT = 1200;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }

              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);

              // Convertir a WebP con calidad 0.7
              canvas.toBlob((blob) => {
                if (blob) {
                  resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                    type: "image/webp",
                    lastModified: Date.now(),
                  }));
                } else reject(new Error("Error al comprimir"));
              }, "image/webp", 0.7);
            };
            img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
        });
      } catch (error) {
        console.error("Error comprimiendo imagen, se intentará subir original:", error);
      }
    }

    const formData = new FormData();
    formData.append("file", fileToUpload);

    const res = await uploadComprobante(formData);
    if (res.success && res.url) {
      // Si ya existe una imagen previa, la eliminamos del bucket antes de poner la nueva
      if (comprobanteUrl) {
        await deleteComprobante(comprobanteUrl);
      }

      setComprobanteUrl(res.url);
      toast("Comprobante cargado", "success");
    } else {
      toast(res.error || "Error al subir", "error");
    }
    setIsUploading(false);
  };

  const handleDownloadQr = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!qrPagoUrl) return;

    try {
      const response = await fetch(qrPagoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "qr-pago-flordeloto.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(qrPagoUrl, '_blank');
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Evita que se abra el selector de archivos al hacer click en la X
    if (!comprobanteUrl) return;

    setIsDeleting(true);
    const res = await deleteComprobante(comprobanteUrl);
    
    if (res.success) {
      setComprobanteUrl(null);
      toast("Imagen eliminada", "success");
    } else {
      toast("Error al eliminar imagen", "error");
    }
    setIsDeleting(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className={`lg:col-span-2 bg-white p-6 md:p-12 rounded-[2.5rem] border transition-all ${!estaRealmenteAbierto ? "opacity-60 grayscale pointer-events-none" : "border-gray-100 shadow-sm"}`}>
          
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

          <h2 className="font-serif italic text-3xl md:text-4xl text-gris mb-2">Finalizar Reserva</h2>
          <p className="text-gray-400 text-sm mb-8">Información para el recojo en tienda física.</p>
          
          <form onSubmit={handlePreSubmit} className="space-y-8">
            <div className="bg-gray-50/50 p-4 md:p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
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
                        target.value = target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
                        setFormData({...formData, quienRecoge: target.value});
                    }}
                    placeholder="Nombre completo"
                    className="w-full p-3 md:p-4 pl-12 bg-white border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] transition-all font-medium"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                </div>
              </div>

              <div className="space-y-2" ref={dropdownRef}>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2"><Phone size={12}/> WhatsApp de Contacto</label>
                <div className="flex gap-2 relative">
                    <div onClick={() => setIsCountryOpen(!isCountryOpen)} className="flex items-center gap-2 p-3 md:p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 min-w-[110px] md:min-w-[130px] justify-between transition-colors shadow-sm">
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
                        className="flex-1 min-w-0 p-3 md:p-4 border border-gray-200 text-gris rounded-2xl outline-none focus:border-[#C5A059] transition-all font-medium" 
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
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (blockedDates.includes(selected)) {
                        setCurrentBlockedReason(blockedReasons[selected] || "");
                        setShowBlockedModal(true);
                        setFormData({...formData, fechaEntrega: ""});
                      } else {
                        setFormData({...formData, fechaEntrega: selected});
                      }
                    }} 
                    className="w-full p-3 md:p-4 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] text-gris font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Clock size={12}/> Hora Estimada
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.horaRecojo}
                    onChange={(e) => setFormData({...formData, horaRecojo: e.target.value})}
                    className="w-full p-3 md:p-4 border border-gray-200 rounded-2xl outline-none focus:border-[#C5A059] text-gris font-bold appearance-none bg-white"
                  >
                    <option value="">Seleccionar hora</option>
                    {availableTimeSlots.map((time) => (
                      <option key={time} value={time}>{formatTimeStr(time)}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <ChevronDown size={18} />
                  </div>
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
              {availabilityError && (
                <p className="text-xs text-red-500 font-bold ml-5 flex items-center gap-1"><AlertCircle size={12}/> {availabilityError}</p>
              )}
            </div>

            {/* SECCIÓN DE PAGO QR */}
            <div className="mt-8 p-5 md:p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#C5A059]/10 rounded-xl text-[#C5A059]">
                  <QrCode size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-700">PAGO MEDIANTE QR</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visualización del QR subido por Admin */}
                <div className="text-center space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">1. Escanea y paga</p>
                  <div className="relative w-56 h-56 mx-auto bg-white border-4 border-[#C5A059]/10 rounded-3xl overflow-hidden p-2">
                    {qrPagoUrl ? (
                      <Image src={qrPagoUrl} alt="QR de Pago" fill className="object-contain" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300 italic text-xs">QR no disponible</div>
                    )}
                  </div>
                  {qrPagoUrl && (
                    <a href={qrPagoUrl} onClick={handleDownloadQr} className="inline-flex items-center gap-2 text-[#C5A059] font-bold text-[10px] uppercase hover:underline cursor-pointer">
                      <Download size={14} /> Descargar código QR
                    </a>
                  )}
                </div>

                {/* Subida de Comprobante por el Cliente */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2. Sube tu comprobante</p>
                  <label className={`relative flex flex-col items-center justify-center h-56 border-2 border-dashed rounded-3xl cursor-pointer transition-all overflow-hidden ${comprobanteUrl ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    {isUploading ? (
                      <Loader2 className="animate-spin text-[#C5A059]" />
                    ) : comprobanteUrl ? (
                      <div className="relative w-full h-full group">
                        <Image 
                          src={comprobanteUrl} 
                          alt="Comprobante" 
                          fill 
                          className="object-contain p-2" 
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                           <Upload className="text-white mb-2" />
                           <span className="text-[10px] font-bold text-white uppercase">Cambiar Imagen</span>
                        </div>
                        <button 
                          onClick={handleRemoveImage}
                          disabled={isDeleting}
                          className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-full shadow-md z-20 hover:bg-red-50 transition-colors border border-red-100"
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-gray-300 mb-2" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Seleccionar Captura</span>
                        <span className="text-[9px] text-gray-300 mt-1 font-medium">Máx. 5MB</span>
                      </>
                    )}
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>

                  {/* CAMPOS DE DETALLE DE PAGO */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Titular de la cuenta (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ej: Juan Perez"
                          value={formData.titularCuenta}
                          onInput={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.value = target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); 
                              setFormData({...formData, titularCuenta: target.value});
                          }}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#C5A059] transition-colors"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Monto Transferido (Bs)</label>
                        <input 
                          type="number" 
                          placeholder="Monto"
                          value={formData.montoTransferencia}
                          onChange={(e) => setFormData({...formData, montoTransferencia: e.target.value})}
                          className={`w-full p-3 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700 outline-none transition-colors ${
                            !esMontoValido ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-[#C5A059]"
                          }`}
                        />
                        <p className="text-[10px] text-blue-600 font-bold mt-1 ml-1">
                            * Obligatorio: Pago mínimo del 50% (Bs {montoMinimo.toFixed(2)}) para procesar el pedido.
                        </p>
                        {!esMontoValido && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 flex items-center gap-1">
                                <AlertCircle size={10} /> El monto es insuficiente.
                            </p>
                        )}
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5 ml-1">Mensaje / Observación (Opcional)</label>
                        <textarea 
                          placeholder="Ej: Pago el 50% de adelanto..."
                          value={formData.mensajePago}
                          onChange={(e) => setFormData({...formData, mensajePago: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#C5A059] transition-colors resize-none h-20"
                        />
                     </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-3 items-start">
                    <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-blue-800 uppercase">Verificación de Comprobante</p>
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        Asegúrate de subir una captura real y legible. Todos los pagos son verificados; el uso de comprobantes falsos o alterados ocasionará la anulación del pedido.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
                type="submit"
                disabled={!estaRealmenteAbierto || isSubmitting || items.length === 0 || !!availabilityError || !comprobanteUrl || !esMontoValido} 
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

      {/* MODAL DE FECHA BLOQUEADA */}
      <AnimatePresence>
        {showBlockedModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBlockedModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <CalendarOff size={32} />
              </div>
              <h3 className="font-serif italic text-xl text-gray-800 mb-2">Fecha No Disponible</h3>
              <p className="text-sm text-gray-500 mb-6">
                {currentBlockedReason 
                  ? `Lo sentimos, esta fecha no está disponible: ${currentBlockedReason}.` 
                  : "Lo sentimos, la fecha seleccionada está bloqueada por feriado o cierre administrativo. Por favor elige otra fecha."}
              </p>
              <button 
                onClick={() => setShowBlockedModal(false)}
                className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}