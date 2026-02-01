"use client";

import { useState } from "react";
import { gestionarEstadoPedido } from "@/app/admin/pedidos/actions";
import { Loader2, AlertCircle, CheckCircle2, PackageCheck } from "lucide-react";

export function BotoneraAdmin({ pedidoId, estadoActual }: { pedidoId: string, estadoActual: string }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (nuevoEstado: string) => {
    if (loading) return;
    
    let obs = "";
    if (nuevoEstado === 'rechazado') {
      obs = prompt("Indique el motivo del rechazo:") || "";
      if (!obs) return;
    }
    
    if (nuevoEstado === 'aceptado' && estadoActual === 'aceptado') {
      if (!confirm("Este pedido ya está siendo atendido. ¿Deseas tomar la responsabilidad por emergencia?")) return;
    }
    
    setLoading(true);
    await gestionarEstadoPedido(pedidoId, nuevoEstado, obs);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
        <Loader2 className="animate-spin" size={14} /> Actualizando Pedido...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-end">
      {/* Botón Tomar / Retomar */}
      {(estadoActual === 'pendiente' || estadoActual === 'aceptado') && (
        <button 
          onClick={() => handleAction('aceptado')} 
          className={`${estadoActual === 'aceptado' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm flex items-center gap-2`}
        >
          {estadoActual === 'aceptado' ? <AlertCircle size={14}/> : null}
          {estadoActual === 'aceptado' ? 'Retomar (Emergencia)' : 'Tomar Pedido'}
        </button>
      )}

      {/* Botón Terminar */}
      {estadoActual === 'aceptado' && (
        <button onClick={() => handleAction('terminado')} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm flex items-center gap-2">
          <PackageCheck size={14} /> Marcar como Terminado
        </button>
      )}

      {/* Botón Entregar */}
      {estadoActual === 'terminado' && (
        <button onClick={() => handleAction('entregado')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors shadow-sm flex items-center gap-2">
          <CheckCircle2 size={14} /> Confirmar Entrega
        </button>
      )}

      {/* Botón Rechazar */}
      {estadoActual !== 'entregado' && estadoActual !== 'rechazado' && (
        <button onClick={() => handleAction('rechazado')} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
          Rechazar
        </button>
      )}
    </div>
  );
}