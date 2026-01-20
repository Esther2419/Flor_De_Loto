"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, Clock, TrendingUp, Power, Save, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [estaAbierto, setEstaAbierto] = useState<boolean | null>(null);
  const [horas, setHoras] = useState({ apertura: "09:00", cierre: "19:00" });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const fetchEstado = async () => {
      const { data } = await supabase.from('configuracion').select('*').eq('id', 1).single();
      if (data) {
        setEstaAbierto(data.tienda_abierta);
        setHoras({ 
          apertura: data.horario_apertura.slice(0, 5), 
          cierre: data.horario_cierre.slice(0, 5) 
        });
      }
    };
    fetchEstado();
  }, []);

  const guardarConfiguracion = async (nuevoEstadoManual?: boolean) => {
    setCargando(true);
    const estadoAFijar = nuevoEstadoManual !== undefined ? nuevoEstadoManual : estaAbierto;

    const { error } = await supabase
      .from('configuracion')
      .update({ 
        tienda_abierta: estadoAFijar,
        horario_apertura: horas.apertura,
        horario_cierre: horas.cierre
      })
      .eq('id', 1);

    if (!error) {
      setEstaAbierto(estadoAFijar);
    }
    setCargando(false);
  };

  if (estaAbierto === null) return <div className="p-10 font-serif italic text-gray-500">Cargando panel...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Panel de Control</h2>
          <p className="text-sm text-gray-500">Configuración de tienda en tiempo real.</p>
        </div>

        <div className={`flex flex-wrap items-center gap-6 p-5 rounded-3xl border-2 transition-all ${
          estaAbierto ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-3 border-r border-gray-200 pr-6">
            <Clock size={16} className="text-gray-400" />
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Apertura</span>
              <input 
                type="time" 
                value={horas.apertura} 
                onChange={(e) => setHoras({...horas, apertura: e.target.value})} 
                className="bg-white border border-gray-100 rounded-lg p-1 text-xs font-bold outline-[#C5A059]" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Cierre</span>
              <input 
                type="time" 
                value={horas.cierre} 
                onChange={(e) => setHoras({...horas, cierre: e.target.value})} 
                className="bg-white border border-gray-100 rounded-lg p-1 text-xs font-bold outline-[#C5A059]" 
              />
            </div>
            <button 
              onClick={() => guardarConfiguracion()} 
              disabled={cargando}
              className="ml-2 p-2 bg-[#C5A059] text-white rounded-xl hover:bg-[#b38f4d] transition-colors"
            >
              {cargando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16}/>}
            </button>
          </div>

          <button
            onClick={() => guardarConfiguracion(!estaAbierto)}
            disabled={cargando}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${
              estaAbierto ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            <Power size={14} />
            {estaAbierto ? "Cerrar Tienda" : "Abrir Tienda"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <TrendingUp className="text-[#C5A059] mb-4" size={24} />
          <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Ventas Hoy</h3>
          <p className="text-3xl font-bold text-gray-800 tracking-tighter">Bs 1,250.00</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <ShoppingBag className="text-[#C5A059] mb-4" size={24} />
          <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Recojos Hoy</h3>
          <p className="text-3xl font-bold text-[#C5A059] tracking-tighter">4</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <Clock className="text-[#C5A059] mb-4" size={24} />
          <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Rango Configurado</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1 uppercase">{horas.apertura} - {horas.cierre}</p>
        </div>
      </div>
    </div>
  );
}