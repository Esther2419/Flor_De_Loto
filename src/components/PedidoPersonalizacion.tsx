"use client";

import { useState } from "react";
import Image from "next/image";
import { Flower2, MessageSquare, Gift, ChevronDown, ChevronUp } from "lucide-react";

interface PersonalizacionProps {
  floresExtras: { nombre: string; cantidad: number; foto: string | null }[];
  envolturaInfo: { nombre: string; color?: string | null; foto?: string | null } | null;
  dedicatoria: string | null;
}

export default function PedidoPersonalizacion({ floresExtras, envolturaInfo, dedicatoria }: PersonalizacionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasContent = floresExtras.length > 0 || envolturaInfo || dedicatoria;

  if (!hasContent) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#C5A059] transition-colors py-2 group"
      >
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span>{isOpen ? "Ocultar Personalización" : "Ver Personalización"}</span>
      </button>

      {isOpen && (
        <div className="mt-2 bg-gray-50/80 rounded-xl p-4 text-xs space-y-4 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
          {(floresExtras.length > 0 || envolturaInfo) && (
            <div>
              <p className="font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-[10px]">
                <Flower2 size={12} /> Personalización
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floresExtras.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 relative overflow-hidden shrink-0">
                      {f.foto && <Image src={f.foto} alt="" fill className="object-cover" />}
                    </div>
                    <span className="font-medium">{f.cantidad}x {f.nombre}</span>
                  </li>
                ))}
                {envolturaInfo && (
                  <li className="flex items-center gap-2 text-gray-600 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 relative overflow-hidden shrink-0">
                      {envolturaInfo.foto ? (
                        <Image src={envolturaInfo.foto} alt="" fill className="object-cover" />
                      ) : (
                        <Gift size={12} />
                      )}
                    </div>
                    <span className="font-medium">
                      {envolturaInfo.nombre} {envolturaInfo.color && `(${envolturaInfo.color})`}
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {dedicatoria && (
            <div className={`${(floresExtras.length > 0 || envolturaInfo) ? 'pt-3 border-t border-gray-200/50' : ''}`}>
              <p className="font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1 text-[10px]">
                <MessageSquare size={12} /> Dedicatoria
              </p>
              <div className="italic text-gray-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm relative">
                <span className="absolute top-2 left-2 text-gray-200 text-4xl font-serif leading-none">"</span>
                <p className="relative z-10 px-4">{dedicatoria}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}