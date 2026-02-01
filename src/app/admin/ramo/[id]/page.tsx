import React from "react";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flower2, Tag, Gift } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminRamoDetallePage({ params, searchParams }: { params: { id: string }, searchParams: { pedidoId?: string } }) {
  const { id } = params;
  const backUrl = searchParams.pedidoId ? `/admin/pedidos/${searchParams.pedidoId}` : "/admin/pedidos";

  const ramo = await prisma.ramos.findUnique({
    where: { id: BigInt(id) },
    include: {
      ramo_detalle: {
        include: {
          flores: true
        }
      },
      ramo_envolturas: {
        include: {
          envolturas: true
        }
      }
    }
  });

  if (!ramo) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        {/* Botón para volver atrás */}
        <Link href={backUrl} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h2 className="text-2xl font-serif italic text-gray-800">Detalle del Ramo</h2>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group">
            {ramo.foto_principal ? (
                <Image 
                    src={ramo.foto_principal} 
                    alt={ramo.nombre} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                    <Flower2 size={48} />
                </div>
            )}
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-serif italic text-gray-800">{ramo.nombre}</h1>
                <span className="text-2xl font-bold text-[#C5A059]">Bs {Number(ramo.precio_base).toFixed(2)}</span>
            </div>

            {ramo.descripcion && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Tag size={14} /> Descripción / Composición
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                        {ramo.descripcion}
                    </p>
                </div>
            )}

            {/* Composición Detallada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                {/* Flores */}
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                    <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Flower2 size={14} /> Flores (Composición)
                    </h3>
                    {ramo.ramo_detalle && ramo.ramo_detalle.length > 0 ? (
                        <ul className="space-y-3">
                            {ramo.ramo_detalle.map((rd: any) => (
                                <li key={rd.id.toString()} className="flex items-center justify-between text-sm text-gray-700 bg-white p-2 rounded-xl border border-rose-100/50 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {rd.flores.foto ? (
                                            <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-rose-100">
                                                <Image src={rd.flores.foto} alt="" fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-300">
                                                <Flower2 size={14} />
                                            </div>
                                        )}
                                        <span className="font-medium">
                                            {rd.flores.nombre}
                                            {rd.flores.color && <span className="text-gray-500 font-normal ml-1">({rd.flores.color})</span>}
                                        </span>
                                    </div>
                                    <span className="font-bold text-rose-600 text-xs bg-rose-50 px-2 py-1 rounded-md">x{rd.cantidad_base || 1}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4">No hay flores registradas en la composición.</p>
                    )}
                </div>

                {/* Envolturas */}
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Gift size={14} /> Envoltura / Papel
                    </h3>
                    {ramo.ramo_envolturas && ramo.ramo_envolturas.length > 0 ? (
                        <ul className="space-y-3">
                            {ramo.ramo_envolturas.map((re: any) => (
                                <li key={re.id.toString()} className="flex items-center justify-between text-sm text-gray-700 bg-white p-2 rounded-xl border border-amber-100/50 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        {re.envolturas.foto ? (
                                            <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-amber-100">
                                                <Image src={re.envolturas.foto} alt="" fill className="object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-300">
                                                <Gift size={14} />
                                            </div>
                                        )}
                                        <span className="font-medium">
                                            {re.envolturas.nombre}
                                            {re.envolturas.color && <span className="text-gray-500 font-normal ml-1">({re.envolturas.color})</span>}
                                        </span>
                                    </div>
                                    {(re.cantidad || 0) > 0 && (
                                        <span className="font-bold text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-md">x{re.cantidad}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-400 italic text-center py-4">No hay envoltura registrada.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
