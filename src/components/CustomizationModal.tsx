"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Check, Info } from "lucide-react"; 
import { getDetalleRamoConOpciones } from "@/app/actions/personalizacion";

interface Props {
  ramo: { id: string; nombre: string; precio_base: number; foto_principal: string | null };
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customData: any) => void;
}

export default function CustomizationModal({ ramo, isOpen, onClose, onConfirm }: Props) {
  const [opciones, setOpciones] = useState<{ flores: any[], envolturas: any[], idsOriginales: string[] } | null>(null);
  const [envolturaSeleccionada, setEnvolturaSeleccionada] = useState<string>("");
  const [cantidadesFlores, setCantidadesFlores] = useState<{ [key: string]: number }>({});
  const [dedicatoria, setDedicatoria] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      getDetalleRamoConOpciones(ramo.id).then(setOpciones);
    }
  }, [isOpen, ramo.id]);

  if (!isOpen || !mounted || !opciones) return null;

  const handleAgregar = () => {
    onConfirm({ envolturaSeleccionada, dedicatoria, floresExtra: cantidadesFlores });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 text-zinc-800 shadow-2xl animate-in fade-in zoom-in duration-300 border border-zinc-100" onClick={(e) => e.stopPropagation()}>
        
        <div className="mb-6 border-b pb-4">
          <h2 className="text-[#B8860B] text-2xl font-bold uppercase tracking-tighter">Personalizar {ramo.nombre}</h2>
          <p className="text-zinc-500 text-xs mt-1 italic">Ajustes exclusivos para este diseño floral.</p>
        </div>

        {/* AVISO IMPORTANTE */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex gap-3 items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-blue-900 leading-relaxed">
            <p className="font-bold uppercase mb-1">Nota de personalización:</p>
            <p>
              Todo lo que añadas aquí se **unirá e integrará directamente al ramo**. 
              Si deseas comprar flores sueltas o ramos adicionales por separado, por favor selecciónalos directamente desde la **Sección de Flores** o el catálogo general.
            </p>
          </div>
        </div>

        {/* Sección Envolturas */}
        <div className="mb-8">
          <label className="block text-[10px] font-bold uppercase mb-4 tracking-widest text-zinc-400">Papel para este ramo</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {opciones.envolturas.map((env) => {
              const esOriginal = opciones.idsOriginales.includes(env.id.toString());
              const estaSeleccionada = envolturaSeleccionada === env.id.toString() || (envolturaSeleccionada === "" && esOriginal);

              return (
                <div 
                  key={env.id}
                  onClick={() => setEnvolturaSeleccionada(env.id.toString())}
                  className={`relative group cursor-pointer transition-all rounded-2xl border-2 p-1 ${estaSeleccionada ? 'border-[#D4AF37] bg-amber-50' : 'border-zinc-100 opacity-70 hover:opacity-100'}`}
                >
                  {esOriginal && (
                    <div className="absolute -top-2 -right-1 z-20 bg-[#D4AF37] text-white text-[7px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase">Original</div>
                  )}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                    {env.foto && <Image src={env.foto} alt={env.nombre} fill className="object-cover" />}
                  </div>
                  <p className="text-[9px] text-center mt-2 font-bold truncate uppercase">{env.nombre}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección Flores Extras */}
        <div className="mb-8">
          <label className="block text-[10px] font-bold uppercase mb-4 tracking-widest text-zinc-400">Flores adicionales (Unidas al ramo)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {opciones.flores.map((flor) => {
                const id = flor.id.toString();
                const cant = cantidadesFlores[id] || 0;
                return (
                    <div key={id} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="relative w-12 h-12 flex-shrink-0">
                            {flor.foto && <Image src={flor.foto} alt={flor.nombre} fill className="object-cover rounded-xl" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-zinc-800">{flor.nombre}</p>
                            <p className="text-[10px] text-zinc-500">Bs. {flor.precio_unitario}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-zinc-200 rounded-full px-2 py-1 shadow-sm">
                            <button onClick={() => setCantidadesFlores({...cantidadesFlores, [id]: Math.max(0, cant - 1)})} className="text-[#D4AF37] font-bold w-6 h-6 hover:bg-zinc-50 rounded-full">-</button>
                            <span className="text-xs font-bold w-4 text-center">{cant}</span>
                            <button onClick={() => setCantidadesFlores({...cantidadesFlores, [id]: cant + 1})} className="text-[#D4AF37] font-bold w-6 h-6 hover:bg-zinc-50 rounded-full">+</button>
                        </div>
                    </div>
                )
            })}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-bold uppercase mb-2 tracking-widest text-zinc-400">Nota o Dedicatoria</label>
          <textarea 
            value={dedicatoria}
            onChange={(e) => setDedicatoria(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 p-4 text-sm rounded-2xl outline-none focus:border-[#D4AF37] transition-all resize-none shadow-inner"
            rows={3}
            placeholder="Escribe el mensaje que acompañará este ramo..."
          />
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase text-zinc-400 hover:text-zinc-800 transition-colors">Cancelar</button>
          <button onClick={handleAgregar} className="flex-[2] py-4 text-xs bg-[#050505] text-[#D4AF37] border border-[#D4AF37] font-bold uppercase rounded-2xl hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg">
            Confirmar e Integrar al Ramo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}