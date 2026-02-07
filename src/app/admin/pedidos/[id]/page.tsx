import React from "react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { Package, Flower2, MessageSquare, Info, Gift, ArrowLeft, Eye, History } from "lucide-react";
import { notFound } from "next/navigation";
import { BotoneraAdmin } from "@/components/BotoneraAdmin";
import PaymentRow from "../../pagos/PaymentRow";

export const dynamic = 'force-dynamic';

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

export default async function PedidoDetallePage({ params }: { params: { id: string } }) {
  const { id } = params;

  const rawPedido = await prisma.pedidos.findUnique({
    where: { id: BigInt(id) },
    include: {
      usuarios: true,
      detalle_pedidos: {
        include: {
          ramos: true,
          flores: true,
          envolturas: true
        }
      },
      pedidos_historial: {
        include: {
          usuarios: true
        },
        orderBy: {
          fecha: 'desc'
        }
      }
    }
  });

  if (!rawPedido) {
    notFound();
  }

  const pedido = JSON.parse(JSON.stringify(rawPedido, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));

  const [flores, envolturas] = await Promise.all([
    prisma.flores.findMany(),
    prisma.envolturas.findMany()
  ]);

  const country = COUNTRIES.find(c => pedido.telefono_contacto?.startsWith(c.prefix));
  const displayPhone = country ? `${country.prefix} ${pedido.telefono_contacto?.slice(country.prefix.length)}` : pedido.telefono_contacto;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos" className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h2 className="text-2xl font-serif italic text-gray-800">Detalle del Pedido #{pedido.id.toString()}</h2>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[#C5A059] font-bold text-xl font-serif">Pedido #{pedido.id.toString()}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${
                pedido.estado === 'pendiente' ? 'bg-amber-100 text-amber-700' : 
                pedido.estado === 'aceptado' ? 'bg-blue-100 text-blue-700' :
                pedido.estado === 'terminado' ? 'bg-purple-100 text-purple-700' :
                pedido.estado === 'entregado' ? 'bg-emerald-100 text-emerald-700' :
                'bg-red-100 text-red-700'
              }`}>
                {pedido.estado}
              </span>
            </div>
            
            <BotoneraAdmin 
              pedido={pedido} 
              pedidoId={pedido.id.toString()} 
              estadoActual={pedido.estado || 'pendiente'} 
            />
            
            <p className="text-xs text-gray-400 mt-4 font-medium">
              Solicitado el: {format(new Date(pedido.fecha_pedido || new Date()), "dd 'de' MMMM, yyyy - hh:mm aa", { locale: es })}
            </p>
          </div>
          
          <div className="text-right">
             <p className="text-sm font-bold text-gray-800">{pedido.nombre_contacto}</p>
             <div className="flex items-center justify-end gap-2">
                {country && (
                  <div className="w-5 h-3.5 relative shadow-sm">
                      <img src={country.flag} alt={country.name} className="w-full h-full object-cover rounded-[2px]" />
                  </div>
                )}
                <p className="text-xs text-[#C5A059] font-bold">{displayPhone}</p>
             </div>
             <div className="flex items-center justify-end gap-2 text-[10px] mt-2">
                <span className="font-black text-gray-400 uppercase tracking-tighter">Entrega:</span>
                <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">{format(new Date(pedido.fecha_entrega), "dd 'de' MMMM, yyyy - hh:mm aa", { locale: es })}</span>
             </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Package size={14} /> Artículos del Pedido
            </h4>
            
            {pedido.detalle_pedidos.map((detalle:any) => {
              const producto = detalle.ramos || detalle.flores || detalle.envolturas;
              const nombreProducto = producto?.nombre || "Producto desconocido";
              const fotoProducto = detalle.ramos?.foto_principal || detalle.flores?.foto || detalle.envolturas?.foto;
              
              let productLink = null;
              if (detalle.ramos) {
                 productLink = `/admin/ramo/${detalle.ramos.id.toString()}?pedidoId=${pedido.id.toString()}`;
              } else if (detalle.flores) {
                 productLink = `/admin/flor/${detalle.flores.id.toString()}?pedidoId=${pedido.id.toString()}`;
              }

              const infoPersonalizacion = detalle.personalizacion as any;
              
              let floresExtras: { id: string, nombre: string, cantidad: number, foto: string | null }[] = [];
              if (infoPersonalizacion?.floresExtra) {
                 Object.entries(infoPersonalizacion.floresExtra).forEach(([id, qty]) => {
                    if (Number(qty) > 0) {
                       const flor = flores.find(f => f.id.toString() === id);
                       const nombre = flor ? (flor.color ? `${flor.nombre} ${flor.color}` : flor.nombre) : `Flor ID: ${id}`;
                       floresExtras.push({ id, nombre, cantidad: Number(qty), foto: flor?.foto || null });
                    }
                 });
              }

              let envolturaInfo: { nombre: string, color?: string | null, foto?: string | null } | null = null;
              if (infoPersonalizacion?.envolturaSeleccionada) {
                 const idBuscado = infoPersonalizacion.envolturaSeleccionada.toString();
                 const env = envolturas.find(e => e.id.toString() === idBuscado);
                 if (env) envolturaInfo = { nombre: env.nombre, color: env.color, foto: env.foto };
                 else envolturaInfo = { nombre: `Envoltura ID: ${idBuscado}` };
              } else if (infoPersonalizacion?.envolturas && Object.keys(infoPersonalizacion.envolturas).length > 0) {
                 const idBuscado = Object.keys(infoPersonalizacion.envolturas).find(key => infoPersonalizacion.envolturas[key] > 0);
                 if (idBuscado) {
                    const env = envolturas.find(e => e.id.toString() === idBuscado);
                    if (env) envolturaInfo = { nombre: env.nombre, color: env.color, foto: env.foto };
                    else envolturaInfo = { nombre: `Envoltura ID: ${idBuscado}` };
                 }
              }

              const tienePersonalizacion = floresExtras.length > 0 || envolturaInfo || infoPersonalizacion?.dedicatoria;

              return (
                <div key={detalle.id.toString()} className="border border-gray-50 rounded-2xl p-4 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 relative overflow-hidden border border-gray-100 group">
                        {fotoProducto ? (
                          productLink ? (
                            <Link href={productLink} className="block w-full h-full cursor-pointer">
                              <Image src={fotoProducto} alt={nombreProducto} fill className="object-cover transition-transform group-hover:scale-110" />
                            </Link>
                          ) : (
                            <Image src={fotoProducto} alt={nombreProducto} fill className="object-cover" />
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-300"><Package size={24} /></div>
                        )}
                      </div>
                      <div>
                        {productLink ? (
                          <Link href={productLink} className="hover:text-[#C5A059] transition-colors group">
                            <p className="font-serif italic text-lg text-gray-800 group-hover:underline decoration-[#C5A059]/50 underline-offset-4">{nombreProducto}</p>
                          </Link>
                        ) : (
                          <p className="font-serif italic text-lg text-gray-800">{nombreProducto}</p>
                        )}
                        <p className="text-xs text-gray-400">Cantidad: {detalle.cantidad} unidad(es)</p>
                      </div>
                    </div>
                    <span className="font-bold text-[#C5A059]">Bs {Number(detalle.subtotal).toFixed(2)}</span>
                  </div>

                  {tienePersonalizacion && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <div className="flex flex-col">
                                      <span>• {f.nombre}</span>
                                      <Link 
                                          href={`/admin/flor/${f.id}?pedidoId=${pedido.id.toString()}`}
                                          className="text-[10px] text-[#C5A059] font-bold hover:underline flex items-center gap-1"
                                      >
                                          <Eye size={10} /> (Ver flor)
                                      </Link>
                                    </div>
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

          <div className="bg-[#C5A059]/5 border border-[#C5A059]/10 rounded-2xl p-4 flex items-start gap-4">
            <div className="bg-white p-2 rounded-lg shadow-sm text-[#C5A059]">
              <Info size={20} />
            </div>
            <div>
               <p className="text-[10px] font-black text-[#C5A059] uppercase tracking-widest">Información de Recepción</p>
               <p className="text-sm text-gray-700 font-medium mt-1">
                 Este pedido será recogido por: <span className="font-bold text-gray-900">{pedido.nombre_receptor || "Mismo contacto"}</span>
               </p>
            </div>
          </div>

          {/* Sección de Comprobante de Pago */}
          {pedido.comprobante_pago && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Comprobante de Pago</h4>
              <PaymentRow pedido={pedido} />
            </div>
          )}
        </div>

        <div className="bg-gray-900 px-8 py-5 flex justify-between items-center text-white">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total a cobrar</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xs opacity-60 font-bold underline decoration-[#C5A059]">BS.</span>
            <span className="text-2xl font-serif italic text-[#C5A059]">{Number(pedido.total_pagar).toFixed(2)}</span>
          </div>
        </div>

        {/* Bitácora de Actividad */}
        {pedido.pedidos_historial && pedido.pedidos_historial.length > 0 && (
          <div className="bg-gray-50/50 border-t border-gray-100 p-8">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={14} /> Bitácora de Actividad
            </h4>
            <div className="space-y-6 relative before:absolute before:left-[5.5rem] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
              {pedido.pedidos_historial.map((h: any) => (
                <div key={h.id.toString()} className="flex gap-6 text-xs relative">
                  <div className="w-20 text-right text-gray-400 font-mono shrink-0 py-1">
                    {h.fecha ? format(new Date(h.fecha), "HH:mm") : "--:--"}
                    <div className="text-[9px] opacity-60">{h.fecha ? format(new Date(h.fecha), "dd/MM") : ""}</div>
                  </div>
                  <div className="py-1">
                    <span className="font-bold text-gray-800 block">
                      {h.usuarios?.nombre_completo || "Sistema"}
                      <span className="ml-2 font-normal text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase tracking-tighter">
                        {h.estado_nuevo}
                      </span>
                    </span>
                    <p className="text-gray-500 mt-0.5">{h.observacion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}