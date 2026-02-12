"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Clock, Save, Loader2, Power, 
  AlertTriangle, Timer, Store, 
  ShieldCheck, ArrowRight, Settings2, Package
} from "lucide-react";
import QRManager from "@/components/QRManager";

interface TiendaConfig {
  tienda_abierta: boolean | null;
  horario_apertura: string;
  horario_cierre: string;
  cierre_temporal: boolean;
  minutos_preparacion: number;
  pedidos_por_hora: number;
  intervalo_minutos: number;
  qr_pago: string | null;
}

export default function AdminPage() {
  const [config, setConfig] = useState<TiendaConfig>({
    tienda_abierta: null,
    horario_apertura: "09:00",
    horario_cierre: "19:00",
    cierre_temporal: false,
    minutos_preparacion: 30,
    pedidos_por_hora: 5,
    intervalo_minutos: 10,
    qr_pago: null
  });
  
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setConfig({
          tienda_abierta: data.tienda_abierta,
          horario_apertura: data.horario_apertura?.slice(0, 5) || "09:00",
          horario_cierre: data.horario_cierre?.slice(0, 5) || "19:00",
          cierre_temporal: !!data.cierre_temporal,
          minutos_preparacion: data.minutos_preparacion || 30,
          pedidos_por_hora: data.pedidos_por_hora || 5,
          intervalo_minutos: data.intervalo_minutos || 10,
          qr_pago: data.qr_pago || null
        });
      }
    };
    fetchConfig();

    // Suscripción a cambios en tiempo real
    const channel = supabase
      .channel('configuracion_dashboard')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'configuracion',
          filter: 'id=eq.1',
        },
        (payload) => {
          const newData = payload.new as any;
          setConfig(prev => ({
            ...prev,
            tienda_abierta: newData.tienda_abierta,
            horario_apertura: newData.horario_apertura?.slice(0, 5) || "09:00",
            horario_cierre: newData.horario_cierre?.slice(0, 5) || "19:00",
            cierre_temporal: !!newData.cierre_temporal,
            minutos_preparacion: newData.minutos_preparacion || 30,
            pedidos_por_hora: newData.pedidos_por_hora || 5,
            intervalo_minutos: newData.intervalo_minutos || 10,
            qr_pago: newData.qr_pago || null
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const actualizarBD = async (nuevosValores: Partial<TiendaConfig>) => {
    setCargando(true);
    const { error } = await supabase
      .from('configuracion')
      .update(nuevosValores)
      .eq('id', 1);

    if (!error) {
      setConfig(prev => ({ ...prev, ...nuevosValores }));
    }
    setCargando(false);
  };

  if (config.tienda_abierta === null) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="animate-spin text-[#C5A059]" size={40} />
          <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300" size={16} />
        </div>
        <p className="font-serif italic text-gray-500 animate-pulse">Sincronizando con Flor de Loto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#C5A059] font-bold text-xs uppercase tracking-[0.3em]">
            <Settings2 size={14} />
            Configuración Core
          </div>
          <h2 className="text-4xl md:text-5xl font-serif italic text-gray-900">Panel de Control</h2>
          <p className="text-gray-400 font-medium">Ajusta los parámetros operativos de tu floristería en tiempo real.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${config.tienda_abierta ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
            {config.tienda_abierta ? 'Sistema Online' : 'Sistema Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SECCIÓN 1: ESTADO Y HORARIOS (Ocupa 7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          <div className={`relative overflow-hidden p-8 rounded-[2.5rem] border transition-all duration-500 shadow-xl shadow-gray-100/50 ${
            config.tienda_abierta ? "bg-white border-gray-100" : "bg-red-50/30 border-red-100"
          }`}>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl" />

            <div className="relative space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Store className={config.tienda_abierta ? "text-green-500" : "text-red-500"} size={28} />
                    Aperturar Tienda
                  </h3>
                  <p className="text-sm text-gray-500 italic">Define si los clientes pueden ver el catálogo activo.</p>
                </div>
                
                <button
                  onClick={() => actualizarBD({ tienda_abierta: !config.tienda_abierta })}
                  disabled={cargando}
                  className={`group relative flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl active:scale-95 disabled:opacity-50 ${
                    config.tienda_abierta 
                      ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200" 
                      : "bg-green-600 text-white hover:bg-green-700 shadow-green-200"
                  }`}
                >
                  <Power size={20} className="group-hover:rotate-12 transition-transform" />
                  {config.tienda_abierta ? "Cerrar ahora" : "Abrir ahora"}
                </button>
              </div>

              <div className="bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100 space-y-6">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Clock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Horarios de Visualización</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-gray-500 ml-1 transition-colors group-focus-within:text-[#C5A059]">Apertura de Ventas</label>
                    <input 
                      type="time" 
                      value={config.horario_apertura} 
                      onChange={(e) => setConfig({...config, horario_apertura: e.target.value})} 
                      className={`w-full bg-white border rounded-2xl p-4 text-xl font-bold text-gray-700 outline-none transition-all shadow-sm ${
                        !config.horario_apertura 
                          ? "border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500" 
                          : "border-gray-200 focus:ring-4 focus:ring-[#C5A059]/10 focus:border-[#C5A059]"
                      }`}
                    />
                  </div>
                  <div className="space-y-3 group">
                    <label className="text-xs font-bold text-gray-500 ml-1 transition-colors group-focus-within:text-[#C5A059]">Cierre de Ventas</label>
                    <input 
                      type="time" 
                      value={config.horario_cierre} 
                      onChange={(e) => setConfig({...config, horario_cierre: e.target.value})} 
                      className={`w-full bg-white border rounded-2xl p-4 text-xl font-bold text-gray-700 outline-none transition-all shadow-sm ${
                        !config.horario_cierre 
                          ? "border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500" 
                          : "border-gray-200 focus:ring-4 focus:ring-[#C5A059]/10 focus:border-[#C5A059]"
                      }`}
                    />
                  </div>
                </div>

                <button 
                  onClick={() => actualizarBD({ 
                    horario_apertura: config.horario_apertura, 
                    horario_cierre: config.horario_cierre 
                  })} 
                  disabled={cargando}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl hover:bg-black flex items-center justify-center gap-3 font-bold shadow-xl transition-all active:scale-[0.99]"
                >
                  {cargando ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} className="text-[#C5A059]" />}
                  APLICAR NUEVOS HORARIOS
                </button>
              </div>
            </div>
          </div>

          {/* NUEVA SECCIÓN: Configuración de Pedidos */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
             <div className="space-y-1">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                   <Package size={28} className="text-[#C5A059]" />
                   Configuración de Pedidos
                </h3>
                <p className="text-sm text-gray-500 italic">Define límites y tiempos de atención.</p>
             </div>

             <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-[#C5A059]/30 transition-all space-y-4">
                   <label className="text-xs font-bold text-gray-500 ml-1">Pedidos por Hora</label>
                   <p className="text-[10px] text-gray-400">Límite máximo de pedidos aceptados por hora.</p>
                   <input 
                      type="number" min="1"
                      value={config.pedidos_por_hora} 
                      onChange={(e) => setConfig({...config, pedidos_por_hora: parseInt(e.target.value) || 0})}
                      className={`w-full bg-white border rounded-2xl p-4 text-xl font-black text-gray-800 outline-none transition-all ${
                        config.pedidos_por_hora < 1 
                          ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                          : "border-gray-200 focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                      }`}
                   />
                   <button 
                      onClick={() => actualizarBD({ pedidos_por_hora: config.pedidos_por_hora })}
                      disabled={cargando}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-[0.99] text-xs uppercase tracking-widest mt-2"
                   >
                      {cargando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="text-[#C5A059]" />}
                      Guardar Límite
                   </button>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-[#C5A059]/30 transition-all space-y-4">
                   <label className="text-xs font-bold text-gray-500 ml-1">Tiempo entre Pedidos (Minutos)</label>
                   <p className="text-[10px] text-gray-400">Tiempo de preparación o intervalo entre entregas.</p>
                   <input 
                      type="number" min="5" step="5"
                      value={config.intervalo_minutos} 
                      onChange={(e) => setConfig({...config, intervalo_minutos: parseInt(e.target.value) || 0})}
                      className={`w-full bg-white border rounded-2xl p-4 text-xl font-black text-gray-800 outline-none transition-all ${
                        config.intervalo_minutos < 5 
                          ? "border-red-300 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
                          : "border-gray-200 focus:ring-2 focus:ring-[#C5A059]/20 focus:border-[#C5A059]"
                      }`}
                   />
                   <button 
                      onClick={() => actualizarBD({ intervalo_minutos: config.intervalo_minutos })}
                      disabled={cargando}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-[0.99] text-xs uppercase tracking-widest mt-2"
                   >
                      {cargando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="text-[#C5A059]" />}
                      Guardar Intervalo
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* SECCIÓN 2: LOGÍSTICA & QR (Ocupa 5 columnas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* NUEVO: Gestión de QR de Pago */}
          <QRManager initialQR={config.qr_pago} />

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8 relative overflow-hidden">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Timer className="text-[#C5A059]" size={28} />
                Gestión de Pedidos
              </h3>
              <p className="text-sm text-gray-500 italic">Controla la carga de trabajo y emergencias.</p>
            </div>

            <div className="space-y-4">
              <div className="group p-6 bg-white rounded-3xl border border-gray-100 hover:border-[#C5A059]/30 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-gray-700 text-sm tracking-tight">Tiempo de Preparación</span>
                  <div className="bg-[#C5A059]/10 text-[#C5A059] p-2 rounded-lg">
                    <Timer size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      value={config.minutos_preparacion} 
                      onChange={(e) => setConfig({...config, minutos_preparacion: parseInt(e.target.value) || 0})} 
                      className={`w-full bg-gray-50 rounded-2xl p-4 pr-12 text-2xl font-black text-gray-800 outline-none transition-all border-2 ${
                        config.minutos_preparacion < 1 
                          ? "border-red-300 focus:border-red-500" 
                          : "border-transparent focus:border-transparent"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Min</span>
                  </div>
                  <button 
                    onClick={() => actualizarBD({ minutos_preparacion: config.minutos_preparacion })}
                    disabled={cargando}
                    className="p-5 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg active:scale-90"
                  >
                    {cargando ? <Loader2 size={20} className="animate-spin" /> : <Save size={20}/>}
                  </button>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border transition-all duration-500 ${
                config.cierre_temporal 
                  ? "bg-orange-500 border-orange-400 shadow-lg shadow-orange-100" 
                  : "bg-gray-900 border-gray-800 shadow-xl shadow-gray-200"
              }`}>
                <div className="flex flex-col gap-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className={`font-bold block text-base ${config.cierre_temporal ? "text-white" : "text-white"}`}>
                        Pausa de Emergencia
                      </span>
                      <p className={`text-[10px] font-medium uppercase tracking-widest ${config.cierre_temporal ? "text-orange-100" : "text-gray-400"}`}>
                        {config.cierre_temporal ? "Tienda pausada temporalmente" : "Operación normal"}
                      </p>
                    </div>
                    <AlertTriangle className={config.cierre_temporal ? "text-white animate-bounce" : "text-[#C5A059]"} size={24} />
                  </div>
                  
                  <button
                    onClick={() => actualizarBD({ cierre_temporal: !config.cierre_temporal })}
                    disabled={cargando}
                    className={`group w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                      config.cierre_temporal 
                        ? "bg-white text-orange-600 hover:bg-orange-50" 
                        : "bg-[#C5A059] text-white hover:bg-[#b38f4d]"
                    }`}
                  >
                    {config.cierre_temporal ? "Reanudar Operaciones" : "Activar Modo Pausa"}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-[#C5A059]/5 rounded-2xl border border-[#C5A059]/10">
              <ShieldCheck className="text-[#C5A059]" size={20} />
              <p className="text-[10px] font-bold text-gray-500 leading-tight uppercase tracking-tight">
                Cambios protegidos por cifrado de seguridad activo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}