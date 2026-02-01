import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { Package, Flower2, MessageSquare, Info, Gift } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedidos.findMany({
    orderBy: { fecha_pedido: 'desc' },
    include: {
      usuarios: true,
      detalle_pedidos: {
        include: {
          ramos: true,
          flores: true,
          envolturas: true
        }
      }
    }
  });

  // Obtener catálogos para mapear IDs de personalización a Nombres
  const [flores, envolturas] = await Promise.all([
    prisma.flores.findMany(),
    prisma.envolturas.findMany()
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h2 className="text-3xl font-serif italic text-gray-800">Panel de Pedidos</h2>
        <p className="text-sm text-gray-500">Supervisión detallada de productos y personalizaciones.</p>
      </div>

      <div className="grid gap-8">
        {pedidos.map((pedido) => (
          <div key={pedido.id.toString()} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Cabecera del Pedido */}
            <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-[#C5A059] font-bold text-xl font-serif">Pedido #{pedido.id.toString()}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
                    pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 
                    pedido.estado === 'completado' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {pedido.estado}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  Solicitado el: {format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy - HH:mm", { locale: es })}
                </p>
              </div>
              
              <div className="flex flex-col md:items-end gap-2">
                <div className="text-right">
                   <p className="text-sm font-bold text-gray-800">{pedido.nombre_contacto}</p>
                   <p className="text-xs text-[#C5A059] font-bold">{pedido.telefono_contacto}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] bg-white border border-gray-100 px-3 py-1.5 rounded-xl shadow-sm">
                   <span className="font-black text-gray-400 uppercase tracking-tighter">Entrega:</span>
                   <span className="font-bold text-rose-600">{format(new Date(pedido.fecha_entrega), "dd/MM/yyyy - HH:mm")}</span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Sección: Detalles de Productos */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Package size={14} /> Artículos del Pedido
                </h4>
                
                {pedido.detalle_pedidos.map((detalle) => {
                  const producto = detalle.ramos || detalle.flores || detalle.envolturas;
                  const nombreProducto = producto?.nombre || "Producto desconocido";
                  const fotoProducto = detalle.ramos?.foto_principal || detalle.flores?.foto || detalle.envolturas?.foto;
                  
                  // Procesar el JSON de personalización
                  const infoPersonalizacion = detalle.personalizacion as any;
                  
                  // Normalizar Flores Extras (Soporte para estructura nueva y antigua)
                  let floresExtras: { nombre: string, cantidad: number, foto: string | null }[] = [];
                  if (infoPersonalizacion?.floresExtra) {
                     Object.entries(infoPersonalizacion.floresExtra).forEach(([id, qty]) => {
                        if (Number(qty) > 0) {
                           const flor = flores.find(f => f.id.toString() === id);
                           const nombre = flor ? (flor.color ? `${flor.nombre} ${flor.color}` : flor.nombre) : `Flor ID: ${id}`;
                           floresExtras.push({ nombre, cantidad: Number(qty), foto: flor?.foto || null });
                        }
                     });
                  }

                  // Normalizar Envoltura
                  let envolturaInfo: { nombre: string, color?: string | null, foto?: string | null } | null = null;
                  
                  // CASO 1: Estructura Nueva (ID directo)
                  if (infoPersonalizacion?.envolturaSeleccionada) {
                     const idBuscado = infoPersonalizacion.envolturaSeleccionada.toString();
                     const env = envolturas.find(e => e.id.toString() === idBuscado);
                     if (env) {
                        envolturaInfo = { nombre: env.nombre, color: env.color, foto: env.foto };
                     } else {
                        envolturaInfo = { nombre: `Envoltura ID: ${idBuscado}` };
                     }
                  } 
                  // CASO 2: Estructura Antigua (Objeto {id: cantidad})
                  else if (infoPersonalizacion?.envolturas && Object.keys(infoPersonalizacion.envolturas).length > 0) {
                     const idBuscado = Object.keys(infoPersonalizacion.envolturas).find(key => infoPersonalizacion.envolturas[key] > 0);
                     if (idBuscado) {
                        const env = envolturas.find(e => e.id.toString() === idBuscado);
                        if (env) {
                           envolturaInfo = { nombre: env.nombre, color: env.color, foto: env.foto };
                        } else {
                           envolturaInfo = { nombre: `Envoltura ID: ${idBuscado}` };
                        }
                     }
                  }

                  const tienePersonalizacion = floresExtras.length > 0 || envolturaInfo || infoPersonalizacion?.dedicatoria;

                  return (
                    <div key={detalle.id.toString()} className="border border-gray-50 rounded-2xl p-4 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gray-50 relative overflow-hidden border border-gray-100">
                            {fotoProducto ? (
                              <Image src={fotoProducto} alt={nombreProducto} fill className="object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-300"><Package size={24} /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-serif italic text-lg text-gray-800">{nombreProducto}</p>
                            <p className="text-xs text-gray-400">Cantidad: {detalle.cantidad} unidad(es)</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#C5A059]">Bs {Number(detalle.subtotal).toFixed(2)}</span>
                      </div>

                      {/* Detalles de la Personalización (Si existen) */}
                      {tienePersonalizacion && (
                        <div className="mt-4 pt-4 border-t border-dashed border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Composición del Ramo Personalizado */}
                          {(floresExtras.length > 0 || envolturaInfo) && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">
                                <Flower2 size={10} /> Personalización
                              </p>
                              <div className="bg-rose-50/30 p-3 rounded-xl border border-rose-100/50">
                                <ul className="text-xs text-gray-600 space-y-1">
                                  {floresExtras.map((f, i) => (
                                    <li key={i} className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        {f.foto && (
                                          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                            <Image src={f.foto} alt="" fill className="object-cover" />
                                          </div>
                                        )}
                                        <span>• {f.nombre}</span>
                                      </div>
                                      <span className="font-bold">x{f.cantidad}</span>
                                    </li>
                                  ))}
                                  {envolturaInfo && (
                                    <li className="flex items-center gap-2 mt-2 pt-2 border-t border-rose-100/50 text-rose-700 font-medium">
                                      {envolturaInfo.foto ? (
                                        <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                          <Image src={envolturaInfo.foto} alt="" fill className="object-cover" />
                                        </div>
                                      ) : (
                                        <Gift size={12} />
                                      )}
                                      <span>
                                        {envolturaInfo.nombre}
                                        {envolturaInfo.color && <span className="text-gray-500 text-[10px] ml-1">({envolturaInfo.color})</span>}
                                      </span>
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Notas o Dedicatorias */}
                          {infoPersonalizacion?.dedicatoria && (
                            <div className="space-y-2">
                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                <MessageSquare size={10} /> Dedicatoria
                              </p>
                              <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50 h-full">
                                <p className="text-xs text-gray-700 italic leading-relaxed">
                                  "{infoPersonalizacion.dedicatoria}"
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

              {/* Información del Receptor */}
              <div className="bg-[#C5A059]/5 border border-[#C5A059]/10 rounded-2xl p-4 flex items-start gap-4">
                <div className="bg-white p-2 rounded-lg shadow-sm text-[#C5A059]">
                  <Info size={20} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Información de Recepción</p>
                   <p className="text-sm text-gray-700 font-medium mt-1">
                     Este pedido será entregado a/recogido por: <span className="font-bold text-gray-900">{pedido.nombre_receptor || "Mismo contacto"}</span>
                   </p>
                </div>
              </div>
            </div>

            {/* Pie con Total */}
            <div className="bg-gray-900 px-8 py-5 flex justify-between items-center text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Recaudado</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs opacity-60 font-bold underline decoration-[#C5A059]">BS.</span>
                <span className="text-2xl font-serif italic text-[#C5A059]">{Number(pedido.total_pagar).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}

        {pedidos.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Flower2 className="text-gray-200" size={40} />
            </div>
            <p className="text-gray-400 font-serif italic text-xl">No hay pedidos registrados en el sistema.</p>
          </div>
        )}
      </div>
    </div>
  );
}