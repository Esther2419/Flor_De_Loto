"use client";

import { useState, useTransition } from "react";
import { es } from "date-fns/locale";
import { formatInTimeZone } from 'date-fns-tz';
import { Package, Calendar, Clock, UserCheck, Eye, X, Palette, Flower2, MessageSquare, Ban, Trash2, AlertTriangle } from "lucide-react";
import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";
import { cancelOrderAction } from "@/app/actions/orders";
import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function OrderCard({ pedido, catalogoFlores, catalogoEnvolturas }: any) {
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const zonaHoraria = 'America/La_Paz';

  // LÓGICA DE BLOQUEO DE WHATSAPP
  const estadosBloqueados = ["aceptado", "terminado", "entregado", "rechazado", "cancelado"];
  const estaBloqueado = estadosBloqueados.includes(pedido.estado || "");
  const puedeCancelar = pedido.estado === 'pendiente';
  
  // Detectamos si es una cancelación del cliente para mostrar el estilo correcto
  const esCancelado = pedido.estado === 'cancelado' || (pedido.estado === 'rechazado' && pedido.motivo_rechazo === "Cancelado por el cliente");

  const getFlorData = (id: string) => {
    const flor = catalogoFlores.find((f: any) => f.id.toString() === id);
    return flor || { nombre: "Flor desconocida", color: null, foto: null };
  };

  const getEnvolturaData = (id: string) => {
    const env = catalogoEnvolturas.find((e: any) => e.id.toString() === id);
    return env || { nombre: "Envoltura desconocida", foto: null };
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const onConfirmCancel = async () => {
    startTransition(async () => {
      const result = await cancelOrderAction(pedido.id.toString());
      if (result.success) {
        toast("Pedido cancelado exitosamente", "success");
      } else {
        toast(result.message, "error");
      }
      setShowCancelModal(false);
    });
  };

  return (
    <>
      <div className={`bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-6 md:p-8 ${esCancelado ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 border border-gray-100 uppercase tracking-tighter">
                Pedido #{pedido.id.toString()}
              </span>
              <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                pedido.estado === 'pendiente' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                pedido.estado === 'entregado' ? 'bg-green-50 text-green-600 border-green-100' :
                pedido.estado === 'aceptado' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                pedido.estado === 'terminado' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                esCancelado ? 'bg-gray-100 text-gray-500 border-gray-200 line-through' :
                'bg-red-50 text-red-600 border-red-100'
              }`}>
                {pedido.estado}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-6 text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="text-xs font-medium">
                  {formatInTimeZone(new Date(pedido.fecha_entrega), zonaHoraria, "dd 'de' MMMM", { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span className="text-xs font-medium uppercase">
                  Hora: {formatInTimeZone(new Date(pedido.fecha_entrega), zonaHoraria, "hh:mm aa")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck size={14} />
                <span className="text-xs font-medium">
                   Recoge: <span className="text-gray-600">{pedido.nombre_receptor}</span>
                </span>
              </div>
            </div>

            {/* MOSTRAR MOTIVO DE RECHAZO O CANCELACIÓN SI EXISTE */}
            {(pedido.estado === 'rechazado' || pedido.estado === 'cancelado') && pedido.motivo_rechazo && (
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                <p className="text-[9px] font-black text-red-700 uppercase mb-1">{esCancelado ? 'Motivo de cancelación:' : 'Motivo del rechazo:'}</p>
                <p className="text-xs text-red-600 italic">"{pedido.motivo_rechazo}"</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-50">
              <p className="text-[10px] font-bold uppercase text-gray-300 tracking-widest mb-2">Resumen:</p>
              {pedido.detalle_pedidos.map((detalle: any) => {
                const nombreProducto = detalle.ramos?.nombre || detalle.flores?.nombre || "Producto";
                return (
                  <div key={detalle.id} className="flex justify-between text-sm py-1 text-gray-600">
                    <span>{detalle.cantidad}x {nombreProducto}</span>
                    <span className="font-bold">Bs {Number(detalle.subtotal).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col items-end justify-between min-w-[200px] gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total a Pagar</p>
              <p className="text-3xl font-bold text-[#C5A059] font-serif italic tracking-tighter">Bs {Number(pedido.total_pagar).toFixed(2)}</p>
            </div>
            
            <div className="flex flex-col w-full gap-2">
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-gray-800 transition-all"
              >
                <Eye size={16} /> Ver Detalles Completos
              </button>

              {/* BOTÓN DE CANCELAR (Solo visible si es Pendiente) */}
              {puedeCancelar && (
                <button 
                  onClick={handleCancel}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 w-full bg-white text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {isPending ? 'Cancelando...' : <><Trash2 size={16} /> Cancelar Pedido</>}
                </button>
              )}

              {/* BOTÓN DE WHATSAPP CON LÓGICA DE BLOQUEO */}
              {!estaBloqueado ? (
                <WhatsAppButton pedido={pedido} />
              ) : (
                <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] border border-gray-200 cursor-not-allowed">
                  <Ban size={14} /> WhatsApp Deshabilitado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLES */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-serif italic text-gray-800">Detalles del Pedido #{pedido.id.toString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Revisa la personalización completa de tus productos.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-lg"><Calendar size={18} /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Fecha de Entrega</p>
                    <p className="text-sm font-semibold">{formatInTimeZone(new Date(pedido.fecha_entrega), zonaHoraria, "PPPP", { locale: es })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="p-2 bg-gray-50 rounded-lg"><Clock size={18} /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Hora de Recojo</p>
                    <p className="text-sm font-semibold">{formatInTimeZone(new Date(pedido.fecha_entrega), zonaHoraria, "hh:mm aa")}</p>
                  </div>
                </div>
              </div>

              {pedido.detalle_pedidos.map((detalle: any, idx: number) => {
                const producto = detalle.ramos || detalle.flores;
                const nombre = producto?.nombre || "Producto";
                const nombreCompleto = detalle.flores?.color ? `${nombre} ${detalle.flores.color}` : nombre;
                const foto = producto?.foto_principal || producto?.foto || detalle.ramos?.ramo_imagenes?.[0]?.url_foto;
                const pers = detalle.personalizacion as any;

                return (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 relative overflow-hidden shrink-0">
                        {foto ? <Image src={foto} alt={nombre} fill className="object-cover"/> : <Package className="m-auto text-gray-300"/>}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{detalle.cantidad}x {nombreCompleto}</h4>
                        <p className="text-sm text-[#C5A059] font-bold">Bs {Number(detalle.subtotal).toFixed(2)}</p>
                      </div>
                    </div>

                    {pers ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {pers.envolturas && Object.keys(pers.envolturas).length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                              <Palette size={12}/> Envolturas
                            </p>
                            <ul className="space-y-2">
                              {Object.keys(pers.envolturas).map(id => {
                                const { nombre, foto } = getEnvolturaData(id);
                                return (
                                  <li key={id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-6 h-6 relative rounded overflow-hidden border border-white shrink-0">
                                      {foto ? <Image src={foto} alt={nombre} fill className="object-cover"/> : <div className="w-full h-full bg-gray-200" />}
                                    </div>
                                    <span className="text-xs text-gray-600 font-bold">{nombre}</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {pers.floresExtra && Object.keys(pers.floresExtra).length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-gray-100">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1">
                              <Flower2 size={12}/> Flores Extra
                            </p>
                            <ul className="space-y-2">
                              {Object.keys(pers.floresExtra).map(id => {
                                const { nombre, color, foto } = getFlorData(id);
                                const nombreExtra = color ? `${nombre} ${color}` : nombre;
                                return (
                                  <li key={id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                    <div className="w-6 h-6 relative rounded overflow-hidden border border-white shrink-0">
                                      {foto ? <Image src={foto} alt={nombre} fill className="object-cover"/> : <div className="w-full h-full bg-gray-200" />}
                                    </div>
                                    <span className="text-xs text-gray-600 font-bold">
                                      {pers.floresExtra[id]}x {nombreExtra}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}

                        {pers.dedicatoria && (
                          <div className="bg-yellow-50/50 p-3 rounded-xl border border-yellow-100 sm:col-span-2">
                             <p className="text-[10px] uppercase font-bold text-yellow-600 mb-2 flex items-center gap-1">
                              <MessageSquare size={12}/> Dedicatoria
                            </p>
                            <p className="text-sm text-gray-700 italic font-serif">"{pers.dedicatoria}"</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-400 italic">
                        Sin personalización adicional.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-black text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="font-serif italic text-xl text-gray-800 mb-2">¿Cancelar Pedido?</h3>
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowCancelModal(false)} className="py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors">
                  Volver
                </button>
                <button onClick={onConfirmCancel} disabled={isPending} className="py-3 bg-red-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                  {isPending ? 'Procesando...' : 'Sí, Cancelar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}