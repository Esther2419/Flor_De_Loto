"use client";

import { useState, useEffect } from "react";
import { getBloqueosAction, crearBloqueoAction, eliminarBloqueoAction } from "@/app/actions/admin";
import { CalendarOff, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Bloqueo {
  id: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  motivo: string;
}

export default function FeriadosPage() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fechaInput, setFechaInput] = useState("");
  const [esTodoElDia, setEsTodoElDia] = useState(true);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBloqueos();
  }, []);

  const loadBloqueos = async () => {
    const data = await getBloqueosAction();
    setBloqueos(data);
  };

  const handleCrear = async () => {
    if (!fechaInput) return;
    setLoading(true);
    await crearBloqueoAction(fechaInput, esTodoElDia ? null : horaInicio, esTodoElDia ? null : horaFin, motivo);
    await loadBloqueos();
    // Reset form
    setMotivo("");
    setLoading(false);
  };

  const handleEliminar = async (id: number) => {
    setLoading(true);
    await eliminarBloqueoAction(id);
    await loadBloqueos();
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Feriados y Cierres</h2>
          <p className="text-gray-400 text-sm">Gestiona los días en los que la tienda no atenderá pedidos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA: Formulario de Agregado */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarOff size={20} className="text-red-500" /> Nuevo Bloqueo
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Selecciona una fecha para bloquearla. Los clientes verán este día deshabilitado en el calendario.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Seleccionar Fecha</label>
                <input 
                  type="date" 
                  value={fechaInput}
                  onChange={(e) => setFechaInput(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="todoDia" 
                  checked={esTodoElDia} 
                  onChange={(e) => setEsTodoElDia(e.target.checked)}
                  className="w-4 h-4 accent-red-500"
                />
                <label htmlFor="todoDia" className="text-xs font-bold text-gray-600 cursor-pointer">Bloquear todo el día</label>
              </div>

              {!esTodoElDia && (
                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-400">Desde</label>
                    <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-gray-400">Hasta</label>
                    <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-600" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Motivo (Opcional)</label>
                <input 
                  type="text" 
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Mantenimiento, Feriado..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 outline-none focus:border-red-400 transition-colors"
                />
              </div>

              <button 
                onClick={handleCrear}
                disabled={!fechaInput || loading}
                className="w-full py-4 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Procesando..." : "Guardar Bloqueo"}
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Lista de Bloqueos */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#C5A059]" /> Fechas Bloqueadas ({bloqueos.length})
            </h3>

            {bloqueos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                  <CalendarOff size={24} />
                </div>
                <p className="text-gray-400 text-sm font-medium">No hay fechas bloqueadas actualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bloqueos.map((bloqueo) => {
                  // Formatear fecha para mostrar bonito (Ej: 25 DIC - Navidad)
                  const [y, m, d] = bloqueo.fecha.split('-').map(Number);
                  const dateObj = new Date(y, m - 1, d);
                  const dia = format(dateObj, "dd", { locale: es });
                  const mes = format(dateObj, "MMMM", { locale: es });
                  const anio = format(dateObj, "yyyy", { locale: es });
                  const diaSemana = format(dateObj, "EEEE", { locale: es });

                  return (
                    <div key={bloqueo.id} className="group flex items-center justify-between p-4 bg-red-50/50 border border-red-100 rounded-2xl hover:border-red-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-white w-12 h-12 rounded-xl flex flex-col items-center justify-center border border-red-100 shadow-sm text-red-500">
                          <span className="text-[10px] font-bold uppercase leading-none">{mes.substring(0,3)}</span>
                          <span className="text-lg font-black leading-none">{dia}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700 capitalize">{diaSemana}</p>
                          <p className="text-xs text-gray-400">{anio}</p>
                          {bloqueo.hora_inicio ? (
                            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                              <Clock size={10} /> {bloqueo.hora_inicio} - {bloqueo.hora_fin}
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-red-600 mt-1">TODO EL DÍA</p>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleEliminar(bloqueo.id)}
                        className="p-2 text-red-300 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar bloqueo"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}