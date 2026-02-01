import React from "react";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flower2, Tag, DollarSign } from "lucide-react";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminFlorDetallePage({ params, searchParams }: { params: { id: string }, searchParams: { pedidoId?: string, ramoId?: string } }) {
  const { id } = params;
  
  // Lógica para el botón de volver
  let backUrl = "/admin/pedidos";
  if (searchParams.ramoId) {
    backUrl = `/admin/ramo/${searchParams.ramoId}`;
    if (searchParams.pedidoId) {
      backUrl += `?pedidoId=${searchParams.pedidoId}`;
    }
  } else if (searchParams.pedidoId) {
    backUrl = `/admin/pedidos/${searchParams.pedidoId}`;
  }

  const flor = await prisma.flores.findUnique({
    where: { id: BigInt(id) },
  });

  if (!flor) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Link href={backUrl} className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h2 className="text-2xl font-serif italic text-gray-800">Detalle de la Flor</h2>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-8">
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-inner group">
            {flor.foto ? (
                <Image 
                    src={flor.foto} 
                    alt={flor.nombre} 
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
                <div>
                    <h1 className="text-3xl font-serif italic text-gray-800">{flor.nombre}</h1>
                    {flor.color && (
                        <span className="inline-block mt-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
                            {flor.color}
                        </span>
                    )}
                </div>
                <span className="text-2xl font-bold text-[#C5A059]">Bs {Number(flor.precio_unitario).toFixed(2)}</span>
            </div>

            {flor.descripcion && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Tag size={14} /> Descripción
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                        {flor.descripcion}
                    </p>
                </div>
            )}
            
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <DollarSign size={14} /> Información de Precio
                </h3>
                <p className="text-blue-800 text-sm">
                    Precio unitario base: <span className="font-bold">Bs {Number(flor.precio_unitario).toFixed(2)}</span>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
