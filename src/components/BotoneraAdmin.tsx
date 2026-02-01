"use client";

import { useState } from "react";
import { gestionarEstadoPedido } from "@/app/admin/pedidos/actions";
import { Loader2, AlertCircle, CheckCircle2, PackageCheck, X, AlertTriangle } from "lucide-react";

export function BotoneraAdmin({ pedidoId, estadoActual }: { pedidoId: string, estadoActual: string }) {
  const [loading, setLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleAction = async (nuevoEstado: string, obs: string = "") => {
    if (loading) return;
    
    if (nuevoEstado === 'aceptado' && estadoActual === 'aceptado') {
      if (!confirm("Este pedido ya está siendo atendido. ¿Deseas tomar la responsabilidad por emergencia?")) return;
    }
    
    setLoading(true);
    await gestionarEstadoPedido(pedidoId, nuevoEstado, obs);
    setLoading(false);
    setShowRejectionModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-tighter">
        <Loader2 className="animate-spin" size={14} /> Actualizando Pedido...
      </div>
    );
  }

  return (
    <>
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
        <button onClick={() => setShowRejectionModal(true)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors">
          Rechazar
        </button>
      )}
    </div>

      {/* Modal de Rechazo */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle size={18} />
                <h3 className="font-bold text-sm uppercase tracking-wide">Rechazar Pedido</h3>
              </div>
              <button onClick={() => setShowRejectionModal(false)} className="text-red-400 hover:text-red-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-xs text-gray-500 mb-4">
                Por favor, indica el motivo por el cual estás rechazando este pedido. Esta información será visible para el cliente.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: No tenemos stock de las flores solicitadas..."
                className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                autoFocus
              />
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleAction('rechazado', rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 transition-all"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}