"use client";

import { useState } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { Plus, Minus, MessageSquare, Palette, Scroll, Tag } from "lucide-react";

export default function ClientDetailWrapper({ data, type, id, opciones }: any) {
  // Estados de personalización
  const [envolturaId, setEnvolturaId] = useState(opciones?.idsOriginales?.[0] || "");
  const [floresExtra, setFloresExtra] = useState<{[key: string]: number}>({});
  const [dedicatoria, setDedicatoria] = useState("");

  // DETECCIÓN DE OFERTA
  const esOferta = type === 'ramo' && data.es_oferta && data.precio_oferta;

  // Precio base para cálculos (usamos el de oferta si existe)
  const precioBaseCalculo = esOferta 
    ? Number(data.precio_oferta) 
    : Number(data.precio_base || data.precio_unitario || data.precio || 0);

  const foto = data.foto_principal || data.foto;
  const descripcion = data.descripcion || `Selección de alta calidad: ${data.nombre}.`;

  const floresComposicion = data.ramo_detalle?.map((d: any) => ({ 
    ...d.flores, 
    cantidad: d.cantidad_base || 1 
  })) || [];

  // Función para calcular solo los costos adicionales
  const calcularExtras = () => {
    let extra = 0;
    if (opciones?.flores) {
      Object.keys(floresExtra).forEach(fId => {
        const flor = opciones.flores.find((f: any) => f.id.toString() === fId);
        if (flor) extra += Number(flor.precio_unitario) * floresExtra[fId];
      });
    }
    return extra;
  };

  const totalFinal = precioBaseCalculo + calcularExtras();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pt-24 md:pt-32 flex flex-row gap-4 md:gap-12 items-start">
      {/* IMAGEN DEL PRODUCTO */}
      <div className="w-1/3 md:flex-1 aspect-square relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-zinc-100 flex-shrink-0">
        {foto ? <Image src={foto} alt={data.nombre} fill className="object-cover" priority /> : <div className="bg-zinc-100 w-full h-full" />}
        {esOferta && (
          <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-red-500 text-white text-[8px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            OFERTA
          </div>
        )}
      </div>

      {/* INFORMACIÓN Y PERSONALIZACIÓN */}
      <div className="w-2/3 md:flex-1 flex flex-col justify-start">
        <nav className="flex items-center gap-2 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2 md:mb-4">
          <span>Catálogo</span> <span className="text-zinc-300">/</span> <span>{type}</span>
          {esOferta && <span className="ml-2 bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Tag size={10}/> OFERTA</span>}
        </nav>
        
        <h1 className="text-xl md:text-5xl font-black text-zinc-900 mb-2 md:mb-6 uppercase tracking-tighter leading-tight">{data.nombre}</h1>
        <p className="text-zinc-500 text-xs md:text-lg mb-4 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">{descripcion}</p>

        {/* COMPOSICIÓN DEL RAMO */}
        {type === 'ramo' && floresComposicion.length > 0 && (
          <div className="mb-6 border-t border-zinc-100 pt-4">
            <h3 className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
              <Scroll className="w-3 h-3" /> Se compone de:
            </h3>
            <div className="flex flex-wrap gap-3">
              {floresComposicion.map((flor: any) => (
                <div key={flor.id} className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-xl border border-zinc-100">
                  <div className="w-8 h-8 relative rounded-lg overflow-hidden border border-white">
                    {flor.foto && <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-700 font-bold">{flor.nombre}</span>
                    <span className="text-[8px] text-zinc-500">x{flor.cantidad}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PERSONALIZACIÓN */}
        {type === 'ramo' && opciones && (
          <div className="space-y-6 mb-8 border-t border-zinc-100 pt-6">
            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-3 block tracking-widest flex items-center gap-2">
                <Palette className="w-3 h-3" /> Selecciona el Papel
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {opciones.envolturas.map((env: any) => (
                  <button 
                    key={env.id} 
                    onClick={() => setEnvolturaId(env.id.toString())}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      envolturaId === env.id.toString() ? 'border-[#D4AF37] scale-110 shadow-md' : 'border-transparent opacity-40'
                    }`}
                  >
                    <Image src={env.foto} alt={env.nombre} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-3 block tracking-widest">Añadir más flores</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {opciones.flores.map((flor: any) => {
                  const fId = flor.id.toString();
                  const cant = floresExtra[fId] || 0;
                  return (
                    <div key={fId} className="flex items-center justify-between bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden bg-white border border-zinc-200">
                          {flor.foto && <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-800">{flor.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded-full px-2 py-1 border shadow-sm">
                        <button onClick={() => setFloresExtra({...floresExtra, [fId]: Math.max(0, cant - 1)})} className="text-[#D4AF37] font-bold w-5 h-5">-</button>
                        <span className="text-[10px] font-bold w-3 text-center">{cant}</span>
                        <button onClick={() => setFloresExtra({...floresExtra, [fId]: cant + 1})} className="text-[#D4AF37] font-bold w-5 h-5">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 mb-3 block tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Nota o Dedicatoria
              </label>
              <textarea 
                value={dedicatoria} 
                onChange={(e) => setDedicatoria(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs outline-none focus:border-[#D4AF37] resize-none"
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-10">
          <span className="text-[8px] md:text-sm text-zinc-400 uppercase font-bold block mb-1">Precio Total</span>
          <div className="flex items-baseline gap-2">
            {esOferta && (
              <span className="text-xs md:text-lg text-gray-400 line-through">
                Bs. {(Number(data.precio_base) + calcularExtras()).toFixed(2)}
              </span>
            )}
            <span className={`text-lg md:text-4xl font-bold ${esOferta ? 'text-red-600' : 'text-zinc-900'}`}>
              Bs. {totalFinal.toFixed(2)}
            </span>
          </div>
        </div>

        <AddToCartButton 
          id={id}
          productoId={id}
          nombre={data.nombre}
          // PASANDO LOS DATOS DE OFERTA CORREGIDOS
          precioBase={Number(data.precio_base || data.precio_unitario || 0) + calcularExtras()}
          precioOferta={esOferta ? (Number(data.precio_oferta) + calcularExtras()) : undefined}
          esOferta={!!esOferta}
          foto={foto}
          type={type} 
          personalizacion={{ envolturaId, floresExtra, dedicatoria }}
          className="w-full md:w-max px-4 md:px-12 py-3 md:py-5 text-[10px] md:text-sm"
        />
      </div>
    </div>
  );
}