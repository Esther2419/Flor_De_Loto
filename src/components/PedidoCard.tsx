"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BotoneraAdmin } from "@/components/BotoneraAdmin";
import { 
  CheckCircle2, 
  AlertCircle, 
  ZoomIn, 
  X, 
  Package, 
  Flower2, 
  Gift, 
  MessageSquare, 
  UserCheck, 
  Calendar, 
  Clock,
  Eye
} from "lucide-react";
import { actualizarEstadoPago } from "@/app/admin/pagos/actions";

export function PedidoCard({ 
  pedido, 
  displayPhone, 
  countryFlag,
  formattedDate,
  formattedDeliveryDate,
  formattedDeliveryTime,
  flores = [],
  envolturas = []
}: {
  pedido: any;
  displayPhone: string;
  countryFlag?: string;
  formattedDate: string;
  formattedDeliveryDate: string;
  formattedDeliveryTime: string;
  flores: any[];
  envolturas: any[];
}) {
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'total' | 'parcial'>(
    pedido.pago_confirmado === 'total' ? 'total' : 
    pedido.pago_confirmado === 'parcial' ? 'parcial' : 'none'
  );
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string>("");

  useEffect(() => {
    setVerificationStatus(
      pedido.pago_confirmado === 'total' ? 'total' : 
      pedido.pago_confirmado === 'parcial' ? 'parcial' : 'none'
    );
  }, [pedido.pago_confirmado]);
  
  const comprobanteUrl = pedido.comprobante_pago || pedido.comprobante; 
  const isPending = !pedido.estado || pedido.estado === "pendiente";
  const needsVerification = isPending && comprobanteUrl && verificationStatus === 'none';

  return (
    <>
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col gap-6 hover:shadow-md transition-all">
      
      {/* Header de la tarjeta */}
      <div className="flex justify-between items-start border-b border-gray-50 pb-4">
        <div>
          <Link href={`/admin/pedidos/${pedido.id}`} className="group flex items-center gap-2">
            <h2 className="text-2xl font-serif italic text-gray-800 group-hover:text-[#C5A059] transition-colors">Pedido #{pedido.id}</h2>
            <Eye size={18} className="text-gray-400 group-hover:text-[#C5A059] transition-colors" />
          </Link>
          <p className="text-[10px] text-gray-400 font-medium mt-1">
            Solicitado el: {formattedDate}
          </p>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
          pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 
          pedido.estado === 'aceptado' ? 'bg-blue-100 text-blue-700' :
          pedido.estado === 'terminado' ? 'bg-purple-100 text-purple-700' :
          pedido.estado === 'entregado' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {pedido.estado || 'pendiente'}
        </span>
      </div>

      {/* Info de Cliente y Entrega */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
        <div className="space-y-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Información de Contacto</p>
          <p className="text-sm font-bold text-gray-800">{pedido.nombre_contacto}</p>
          <div className="flex items-center gap-2">
            {countryFlag && <img src={countryFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
            <p className="text-xs text-gray-500 font-mono">{displayPhone}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entrega y Recojo</p>
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100/30">
            <Calendar size={12} />
            <span>{formattedDeliveryDate} - {formattedDeliveryTime}</span>
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-1">
            <UserCheck size={12} className="text-[#C5A059]" />
            <span>Recoge: <strong className="text-gray-700">{pedido.nombre_receptor || "Mismo contacto"}</strong></span>
          </div>
        </div>
      </div>

      {/* Artículos del Pedido */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Package size={14} /> Artículos del Pedido
        </h4>
        
        {pedido.detalle_pedidos.map((detalle: any) => {
          const producto = detalle.ramos || detalle.flores;
          const nombreProducto = producto?.nombre || "Producto desconocido";
          const fotoProducto = detalle.ramos?.foto_principal || detalle.flores?.foto;
          
          let pers: any = null;
          if (detalle.personalizacion) {
            try {
              pers = typeof detalle.personalizacion === "string" 
                ? JSON.parse(detalle.personalizacion) 
                : detalle.personalizacion;
            } catch (e) {
              pers = detalle.personalizacion;
            }
          }
          
          let floresExtras: { id: string, nombre: string, cantidad: number, foto: string | null }[] = [];
          if (pers?.floresExtra) {
             Object.entries(pers.floresExtra).forEach(([id, qty]) => {
                if (Number(qty) > 0) {
                   const flor = flores.find(f => f.id.toString() === id);
                   const nombre = flor ? (flor.color ? `${flor.nombre} ${flor.color}` : flor.nombre) : `Flor ID: ${id}`;
                   floresExtras.push({ id, nombre, cantidad: Number(qty), foto: flor?.foto || null });
                }
             });
          }

          let envolturaInfo: { nombre: string, color?: string | null, foto?: string | null } | null = null;
          if (pers?.envolturaSeleccionada) {
             const idBuscado = pers.envolturaSeleccionada.toString();
             const env = envolturas.find(e => e.id.toString() === idBuscado);
             if (env) envolturaInfo = { nombre: env.nombre, color: env.color, foto: env.foto };
             else envolturaInfo = { nombre: `Envoltura ID: ${idBuscado}` };
          }

          const tienePersonalizacion = floresExtras.length > 0 || envolturaInfo || pers?.dedicatoria;

          return (
            <div key={detalle.id.toString()} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
                  <div 
                    className="relative w-28 h-36 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group cursor-pointer"
                    onClick={() => {
                      if (fotoProducto) {
                        setLightboxUrl(fotoProducto);
                        setShowLightbox(true);
                      }
                    }}
                  >
                    {fotoProducto ? (
                      <>
                        <img src={fotoProducto} alt={nombreProducto} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <ZoomIn size={18} />
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300"><Package size={32} /></div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif italic text-lg text-gray-800">{nombreProducto}</p>
                    <p className="text-xs text-gray-400">Cantidad: {detalle.cantidad} unidad(es)</p>
                  </div>
                </div>
                <span className="font-bold text-[#C5A059] self-end sm:self-start shrink-0">Bs {Number(detalle.subtotal).toFixed(2)}</span>
              </div>

              {tienePersonalizacion && (
                <div className="pt-3 border-t border-dashed border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(floresExtras.length > 0 || envolturaInfo) && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                        <Flower2 size={10} /> Personalización
                      </p>
                      <div className="bg-rose-50/20 p-2.5 rounded-xl border border-rose-100/30 text-xs text-gray-600 space-y-1">
                        {floresExtras.map((f, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span>• {f.nombre}</span>
                            <span className="font-bold">x{f.cantidad}</span>
                          </div>
                        ))}
                        {envolturaInfo && (
                          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-rose-100/30 text-rose-700 font-medium">
                            <Gift size={10} />
                            <span>
                              {envolturaInfo.nombre}
                              {envolturaInfo.color && <span className="text-gray-400 text-[9px] ml-1">({envolturaInfo.color})</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {pers?.dedicatoria && (
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <MessageSquare size={10} /> Dedicatoria
                      </p>
                      <div className="bg-blue-50/20 p-2.5 rounded-xl border border-blue-100/30 h-full">
                        <p className="text-xs text-gray-700 italic leading-relaxed">
                          "{pers.dedicatoria}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comprobante de Pago y Verificación */}
      {comprobanteUrl && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-[#C5A059]" /> Comprobante de Pago (Revisión de Depósito)
          </h4>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div 
              className="relative w-28 h-36 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 group cursor-pointer"
              onClick={() => {
                setLightboxUrl(comprobanteUrl);
                setShowLightbox(true);
              }}
            >
              <img src={comprobanteUrl} alt="Comprobante" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                <ZoomIn size={18} />
              </div>
            </div>

          <div className="flex-1 space-y-2 w-full">
            <div className="flex justify-between items-start gap-2 flex-wrap">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Titular de Cuenta</p>
                <p className="font-bold text-gray-800 text-sm capitalize">{pedido.titular_cuenta || "No especificado"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Monto Reportado</p>
                <p className="font-bold text-[#C5A059] text-base text-right">Bs {Number(pedido.monto_pagado || pedido.total_pagar).toFixed(2)}</p>
              </div>
            </div>

            {pedido.mensaje_pago && (
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-[11px] italic text-gray-500">
                "{pedido.mensaje_pago}"
              </div>
            )}

            {/* Acciones de Verificación de Pago */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2 items-center">
              <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                verificationStatus === 'total' ? 'bg-green-50 border-green-200 text-green-700' :
                verificationStatus === 'parcial' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                Estado Pago: {verificationStatus === 'none' ? 'pendiente' : verificationStatus === 'total' ? 'pago total' : 'pago parcial'}
              </div>

              {isPending && (
                <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
                  {verificationStatus === 'none' ? (
                    <>
                      <button
                        onClick={() => {
                          setVerificationStatus('total');
                          actualizarEstadoPago(pedido.id.toString(), 'total');
                        }}
                        className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#C5A059] text-white hover:bg-[#b38f4d] transition-all"
                      >
                        Confirmar Total
                      </button>
                      <button
                        onClick={() => {
                          setVerificationStatus('parcial');
                          actualizarEstadoPago(pedido.id.toString(), 'parcial');
                        }}
                        className="flex-1 sm:flex-initial py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition-all"
                      >
                        Confirmar Parcial
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setVerificationStatus('none');
                        actualizarEstadoPago(pedido.id.toString(), 'pendiente');
                      }}
                      className="w-full sm:w-auto py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                    >
                      Desmarcar Pago
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
    )}

      {/* Botonera de Estado del Pedido */}
      <div className={`border-t border-gray-100 pt-4 relative z-30 transition-all duration-300 ${needsVerification ? 'opacity-40 grayscale pointer-events-none select-none' : 'pointer-events-auto'}`}>
        <BotoneraAdmin pedido={pedido} pedidoId={pedido.id.toString()} estadoActual={pedido.estado || ""} />
      </div>

      {/* Footer de la tarjeta con Total y Botón de Ver Más Detalles */}
      <div className="border-t border-gray-100 pt-4 flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-serif italic text-gray-400">Monto Total a Cobrar</span>
          <span className="text-xl font-bold text-gray-900">Bs {Number(pedido.total_pagar).toFixed(2)}</span>
        </div>

        <Link 
          href={`/admin/pedidos/${pedido.id}`}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white hover:bg-[#C5A059] px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Eye size={15} />
          <span>Ver Más Detalles</span>
        </Link>
      </div>
    </div>

    {/* Lightbox de Imagen */}
    {showLightbox && lightboxUrl && (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => {
              setShowLightbox(false);
              setLightboxUrl("");
            }}
        >
            <button 
                onClick={() => {
                  setShowLightbox(false);
                  setLightboxUrl("");
                }}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
                <X size={24} />
            </button>
            <img src={lightboxUrl} alt="Visualización Completa" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        </div>
    )}
    </>
  );
}