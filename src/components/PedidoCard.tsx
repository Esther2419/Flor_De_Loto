"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BotoneraAdmin } from "@/components/BotoneraAdmin";
import { CheckCircle2, AlertCircle, ZoomIn, X } from "lucide-react";
import { actualizarEstadoPago } from "@/app/admin/pagos/actions";

export function PedidoCard({ 
  pedido, 
  displayPhone, 
  countryFlag,
  formattedDate,
  formattedDeliveryDate,
  formattedDeliveryTime
}: {
  pedido: any;
  displayPhone: string;
  countryFlag?: string;
  formattedDate: string;
  formattedDeliveryDate: string;
  formattedDeliveryTime: string;
}) {
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'total' | 'parcial'>(
    pedido.pago_confirmado === 'total' ? 'total' : 
    pedido.pago_confirmado === 'parcial' ? 'parcial' : 'none'
  );
  const [showModal, setShowModal] = useState(false);

  // Sincronizar estado local cuando la prop del pedido se actualiza desde el servidor
  useEffect(() => {
    setVerificationStatus(
      pedido.pago_confirmado === 'total' ? 'total' : 
      pedido.pago_confirmado === 'parcial' ? 'parcial' : 'none'
    );
  }, [pedido.pago_confirmado]);
  
  // Asumimos que el campo del comprobante puede ser 'comprobante_pago' o 'comprobante'
  const comprobanteUrl = pedido.comprobante_pago || pedido.comprobante; 
  
  // Bloquear si está pendiente (o sin estado), tiene comprobante y no ha sido verificado localmente
  const isPending = !pedido.estado || pedido.estado === "pendiente";
  const needsVerification = isPending && comprobanteUrl && verificationStatus === 'none';

  const getStatusColor = () => {
      if (verificationStatus === 'total') return 'bg-green-50 border-green-100 text-green-700';
      if (verificationStatus === 'parcial') return 'bg-blue-50 border-blue-100 text-blue-700';
      return 'bg-amber-50 border-amber-100 text-amber-700';
  };

  return (
    <>
    <div className="group relative bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-all">
      
      {/* Enlace que cubre toda la tarjeta para navegación */}
      <Link href={`/admin/pedidos/${pedido.id}`} className="absolute inset-0 z-10 rounded-3xl" />

      {/* Header de la tarjeta */}
      <div className="flex justify-between items-start mb-4 relative z-20 pointer-events-none">
        <div className="hover:opacity-70 transition-opacity">
          <h2 className="text-xl font-serif italic text-gray-800">Pedido #{pedido.id}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ver detalles →</p>
        </div>
        
        {/* Badge de Verificación en Header */}
        {verificationStatus !== 'none' && (
             <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                 verificationStatus === 'total' 
                 ? 'bg-green-100 text-green-700 border-green-200' 
                 : 'bg-blue-100 text-blue-700 border-blue-200'
             }`}>
                 {verificationStatus === 'total' ? 'Pago Total' : 'Pago Parcial'}
             </div>
        )}
      </div>

      {/* Sección de Comprobante */}
      {comprobanteUrl && (
        <div className="mb-4 relative z-20">
            <div className={`p-3 rounded-2xl border transition-colors ${getStatusColor()}`}>
                <div className="flex justify-between items-center mb-2">
                    <p className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2`}>
                        <AlertCircle size={12} /> Comprobante
                    </p>
                    {verificationStatus !== 'none' && <CheckCircle2 size={14} />}
                </div>
                
                <div 
                    className="block w-full h-32 rounded-xl overflow-hidden border border-gray-200 hover:border-[#C5A059] transition-all relative group/img mb-2 cursor-pointer"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModal(true);
                    }}
                >
                    <img src={comprobanteUrl} alt="Comprobante" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" size={20} />
                    </div>
                </div>
                
                {isPending && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowModal(true);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                            verificationStatus !== 'none'
                            ? "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50" 
                            : "bg-[#C5A059] text-white hover:bg-[#b38f4d]"
                        }`}
                    >
                        {verificationStatus !== 'none' ? "Ver Detalles" : "Verificar Comprobante"}
                    </button>
                )}
            </div>
        </div>
      )}

      {/* Botonera de Estado */}
      <div className={`mb-4 relative z-20 transition-all duration-300 ${needsVerification ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}>
        <BotoneraAdmin pedido={pedido} pedidoId={pedido.id.toString()} estadoActual={pedido.estado || ""} />
        {needsVerification && (
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Overlay invisible para bloquear clicks extra si pointer-events falla en algun navegador */}
            </div>
        )}
      </div>

      {/* Información del Cliente y Fecha */}
      <div className="space-y-3 flex-grow pointer-events-none">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Solicitado:</p>
          <p className="text-xs text-gray-700 font-medium">
            {formattedDate}
          </p>
        </div>

        <div className="py-2 border-y border-gray-50">
          <p className="text-base font-bold text-gray-800">{pedido.nombre_contacto}</p>
          <div className="flex items-center gap-2">
            {countryFlag && <img src={countryFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
            <p className="text-xs text-gray-500 font-mono">{displayPhone}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entrega:</p>
          <div className="mt-1">
            <span className="bg-amber-100 text-amber-900 px-2 py-1 rounded-md font-bold text-xs">
              {formattedDeliveryDate}
            </span>
            <p className="text-[10px] text-amber-700 mt-1 ml-1">
               {formattedDeliveryTime}
            </p>
          </div>
        </div>
      </div>

      {/* Footer de la tarjeta con Total y Pago */}
      <div className="mt-6 pt-4 border-t border-gray-100 pointer-events-none">
        <div className="flex justify-between items-center">
          <span className="text-sm font-serif italic text-gray-500">Monto Total</span>
          <span className="text-lg font-bold text-gray-900">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
        </div>
      </div>
    </div>

    {/* Modal de Comprobante */}
    {showModal && (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowModal(false);
            }}
        >
            <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-50"
            >
                <X size={24} />
            </button>
            
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col md:flex-row items-center justify-center gap-6" onClick={(e) => e.stopPropagation()}>
                
                {/* Contenedor de Imagen */}
                <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center">
                    <img src={comprobanteUrl} alt="Comprobante Completo" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                </div>

                {/* Panel de Detalles */}
                <div className="w-full md:w-80 bg-white rounded-3xl p-6 shadow-2xl shrink-0 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-500 overflow-y-auto max-h-[30vh] md:max-h-full">
                    <h3 className="font-serif italic text-xl text-gray-800 mb-4 border-b border-gray-100 pb-2">Detalles del Pago</h3>
                    
                    <div className="space-y-5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Titular de la Cuenta</p>
                            <p className="text-sm font-bold text-gray-700 break-words">{pedido.titular_cuenta || "No especificado"}</p>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Monto Reportado</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-[#C5A059]">Bs {Number(pedido.monto_pagado || pedido.total_pagar).toFixed(2)}</span>
                            </div>
                        </div>

                        {pedido.mensaje_pago && (
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Mensaje / Referencia</p>
                                <p className="text-xs italic text-gray-600 break-words">"{pedido.mensaje_pago}"</p>
                            </div>
                        )}

                        {/* Estado de verificación en el modal */}
                        <div className={`p-3 rounded-xl border flex items-center gap-3 ${getStatusColor()}`}>
                            {verificationStatus !== 'none' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide">
                                    {verificationStatus === 'none' ? "Pendiente de Verificación" : 
                                     verificationStatus === 'total' ? "Verificado: Pago Total" : "Verificado: Pago Parcial"}
                                </p>
                            </div>
                        </div>
                        
                        {isPending && (
                            <div className="flex flex-col gap-2">
                                {verificationStatus === 'none' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                setVerificationStatus('total');
                                                setShowModal(false);
                                                actualizarEstadoPago(pedido.id.toString(), 'total');
                                            }}
                                            className="py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-[#C5A059] text-white hover:bg-[#b38f4d] transition-all shadow-sm"
                                        >
                                            Pago Total
                                        </button>
                                        <button
                                            onClick={() => {
                                                setVerificationStatus('parcial');
                                                setShowModal(false);
                                                actualizarEstadoPago(pedido.id.toString(), 'parcial');
                                            }}
                                            className="py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
                                        >
                                            Pago Parcial
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setVerificationStatus('none');
                                            actualizarEstadoPago(pedido.id.toString(), 'pendiente');
                                        }}
                                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                                    >
                                        Desmarcar Verificación
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
}