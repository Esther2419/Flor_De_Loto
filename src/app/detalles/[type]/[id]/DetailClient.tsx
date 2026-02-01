"use client";

import { useState } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import { Plus, Minus, MessageSquare, Palette, Flower2, Check, X, AlertCircle, Tag } from "lucide-react";

export default function DetailClient({ data, type, id, opciones }: any) {
  const [isFloresModalOpen, setIsFloresModalOpen] = useState(false);
  const [isEnvolturasModalOpen, setIsEnvolturasModalOpen] = useState(false);
  
  // REGLA: Si es flor individual máx 2 papeles, si es ramo usa la configuración original
  const limiteEnvolturas = type === 'flor' ? 2 : (data.ramo_envolturas?.reduce(
    (acc: number, curr: any) => acc + (curr.cantidad || 1), 0
  ) || 1);

  // Estado para las envolturas seleccionadas
  const [envolturasSeleccionadas, setEnvolturasSeleccionadas] = useState<string[]>(
    opciones?.idsOriginales || []
  );

  // Estado para flores extra y dedicatoria
  const [floresExtra, setFloresExtra] = useState<{[key: string]: number}>({});
  const [dedicatoria, setDedicatoria] = useState("");

  // DETECCIÓN DE OFERTA
  const esOferta = type === 'ramo' && data.es_oferta && data.precio_oferta;

  // Precio base para cálculos de extras (se usa el de oferta si existe)
  const precioActualCalculo = esOferta 
    ? Number(data.precio_oferta) 
    : Number(data.precio_base || data.precio_unitario || 0);

  const foto = data.foto_principal || data.foto;
  const descripcion = data.descripcion || `Selección especial de ${data.nombre}.`;

  const totalPapelesSeleccionados = envolturasSeleccionadas.length;
  const sePasoDelLimite = totalPapelesSeleccionados > limiteEnvolturas;

  // Función para calcular solo el costo de los extras añadidos
  const calcularExtras = () => {
    let extra = 0;
    
    // Sumar costo de Flores Extra
    if (opciones?.flores) {
      Object.keys(floresExtra).forEach(fId => {
        const flor = opciones.flores.find((f: any) => f.id.toString() === fId);
        if (flor) extra += Number(flor.precio_unitario) * floresExtra[fId];
      });
    }

    // Sumar costo de Envolturas (Solo si es 'flor')
    if (opciones?.envolturas && type === 'flor') {
       envolturasSeleccionadas.forEach(envId => {
         const env = opciones.envolturas.find((e: any) => e.id.toString() === envId);
         if (env) extra += Number(env.precio_unitario || 0);
       });
    }

    return extra;
  };

  const handleUpdateEnvoltura = (envId: string) => {
    setEnvolturasSeleccionadas(prev => {
      if (prev.includes(envId)) return prev.filter(id => id !== envId); 
      
      if (prev.length >= limiteEnvolturas) {
         if (type === 'ramo' && limiteEnvolturas === 1) return [envId];
         return prev; 
      }
      return [...prev, envId]; 
    });
  };

  const handleUpdateCantidad = (id: string, val: number | string, setFn: Function) => {
    setFn((prev: any) => {
      let nuevaCant: number;
      if (typeof val === 'string') {
        nuevaCant = val === '' ? 0 : parseInt(val) || 0;
      } else {
        nuevaCant = (prev[id] || 0) + val;
      }
      return { ...prev, [id]: Math.max(0, nuevaCant) };
    });
  };

  const personalizacionParaCarrito = {
     envolturas: envolturasSeleccionadas.reduce((acc, id) => ({...acc, [id]: 1}), {}),
     floresExtra,
     dedicatoria: type === 'ramo' ? dedicatoria : undefined 
  };

  const cartId = `${id}-${envolturasSeleccionadas.sort().join('-')}-${Object.entries(floresExtra).filter(([_,v])=>v>0).map(([k,v])=>`${k}x${v}`).join('-')}`;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 pt-24 md:pt-32 flex flex-col md:flex-row gap-10 md:gap-16 items-start">
      
      {/* IMAGEN DEL PRODUCTO */}
      <div className="w-full md:w-80 aspect-square relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 flex-shrink-0 mx-auto md:mx-0">
        {foto ? (
          <Image src={foto} alt={data.nombre} fill className="object-cover" priority />
        ) : (
          <div className="bg-zinc-100 w-full h-full flex items-center justify-center text-zinc-400">Sin foto</div>
        )}
        {esOferta && (
          <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
            OFERTA
          </div>
        )}
      </div>

      {/* INFORMACIÓN */}
      <div className="flex-1 flex flex-col justify-start w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-2">
              <span>Catálogo</span> <span className="text-zinc-300">/</span> <span>{type}</span> <span className="text-zinc-300">/</span> <span className="text-zinc-900">{data.nombre}</span>
            </nav>
            <h1 className="text-4xl md:text-6xl font-black text-zinc-900 uppercase tracking-tighter leading-none">
              {data.nombre}
            </h1>
            
            <div className="mt-3 flex gap-2">
              {data.tipo && (
                <span className="bg-zinc-900 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg border border-zinc-800">
                  Estilo: {data.tipo}
                </span>
              )}
              {esOferta && (
                 <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-red-100 flex items-center gap-1">
                   <Tag size={12}/> Oferta Especial
                 </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest block mb-1">Precio Unitario</span>
            {esOferta ? (
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-400 line-through font-medium">Bs. {Number(data.precio_base).toFixed(2)}</span>
                <span className="text-2xl md:text-3xl font-bold text-red-600 tracking-tighter">Bs. {Number(data.precio_oferta).toFixed(2)}</span>
              </div>
            ) : (
              <span className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tighter">Bs. {precioActualCalculo.toFixed(2)}</span>
            )}
          </div>
        </div>

        <p className="text-zinc-500 text-sm md:text-base mb-10 leading-relaxed max-w-md">
          {descripcion}
        </p>

        <div className="space-y-12">
            
            {/* COMPOSICIÓN BASE */}
            {type === 'ramo' && (
              <div className="border-t-2 border-zinc-100 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
                    <Flower2 className="w-6 h-6 text-[#D4AF37]" /> Composición Floral
                  </h3>
                  <button onClick={() => setIsFloresModalOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm hover:bg-amber-100 transition-all">
                    <Plus className="w-3 h-3" /> Añadir flores
                  </button>
                </div>
                
                <div className="space-y-3">
                  {data.ramo_detalle?.map((d: any) => (
                    <div key={d.flores.id} className="flex items-center justify-between bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-white bg-white shadow-sm flex-shrink-0">
                          {d.flores.foto && <Image src={d.flores.foto} alt={d.flores.nombre} fill className="object-cover" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-zinc-800 leading-tight uppercase">{d.flores.nombre} {d.flores.color || ""}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Cantidad Base: {d.cantidad_base}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {Object.keys(floresExtra).map(fId => {
                    const flor = opciones?.flores.find((f: any) => f.id.toString() === fId);
                    if (!flor || floresExtra[fId] === 0) return null;
                    return (
                      <div key={fId} className="flex items-center justify-between bg-amber-50/40 p-2 rounded-2xl border border-amber-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-white bg-white flex-shrink-0">
                            <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-zinc-800 leading-tight">{flor.nombre} (Extra)</span>
                            <span className="text-[10px] text-[#D4AF37] font-bold uppercase">Bs. {Number(flor.precio_unitario).toFixed(2)} c/u</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-amber-100 rounded-full p-1 shadow-sm mr-1">
                          <button onClick={() => handleUpdateCantidad(fId, -1, setFloresExtra)} className="text-[#D4AF37] font-black w-6 h-6 flex items-center justify-center hover:bg-zinc-100 rounded-full">-</button>
                          <input type="number" value={floresExtra[fId]} onChange={(e) => handleUpdateCantidad(fId, e.target.value, setFloresExtra)} className="w-8 text-center text-xs font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                          <button onClick={() => handleUpdateCantidad(fId, 1, setFloresExtra)} className="text-[#D4AF37] font-black w-6 h-6 flex items-center justify-center hover:bg-zinc-100 rounded-full">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN ENVOLTURAS */}
            <div className="border-t-2 border-zinc-100 pt-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
                    <Palette className="w-6 h-6 text-[#D4AF37]" /> {type === 'flor' ? 'Elegir Envoltura (Máx 2)' : 'Envoltura del diseño'}
                  </h3>
                  <div className={`flex items-center gap-2 mt-1 ${sePasoDelLimite ? 'text-red-500' : 'text-amber-600'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest">Seleccionado: {totalPapelesSeleccionados} / {limiteEnvolturas}</span>
                    {sePasoDelLimite && <AlertCircle size={12} className="animate-pulse" />}
                  </div>
                </div>
                <button onClick={() => setIsEnvolturasModalOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4AF37] bg-amber-50 px-4 py-2 rounded-full border border-amber-100 shadow-sm transition-all hover:bg-amber-100">
                  <Plus className="w-3 h-3" /> {type === 'flor' ? 'Seleccionar' : 'Cambiar papeles'}
                </button>
              </div>

              <div className="space-y-3">
                {envolturasSeleccionadas.map(envId => {
                  const env = opciones?.envolturas.find((e: any) => e.id.toString() === envId);
                  if (!env) return null;
                  return (
                    <div key={envId} className="flex items-center justify-between bg-zinc-50 p-2 rounded-2xl border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-white bg-white shadow-sm flex-shrink-0">
                          {env.foto && <Image src={env.foto} alt={env.nombre} fill className="object-cover" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-zinc-800 leading-tight uppercase">{env.nombre}</span>
                          <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-tight">Papel Seleccionado</span>
                        </div>
                      </div>
                      <button onClick={() => handleUpdateEnvoltura(envId)} className="text-zinc-400 hover:text-red-500 p-2">
                         <X className="w-5 h-5"/>
                      </button>
                    </div>
                  );
                })}
              </div>

              {type === 'flor' && (
                 <div className="mt-4 pt-4 border-t border-dashed border-zinc-200">
                    <h3 className="text-sm font-bold uppercase mb-3 flex items-center gap-2">
                       <Flower2 className="w-4 h-4 text-[#D4AF37]" /> ¿Deseas agregar más flores?
                    </h3>
                    <div className="space-y-2 mb-3">
                       {Object.keys(floresExtra).map(fId => {
                         const flor = opciones?.flores.find((f: any) => f.id.toString() === fId);
                         if (!flor || floresExtra[fId] === 0) return null;
                         return (
                           <div key={fId} className="flex items-center justify-between bg-amber-50/40 p-2 rounded-xl border border-amber-100">
                              <span className="text-xs font-bold uppercase ml-2">{flor.nombre} x{floresExtra[fId]}</span>
                              <span className="text-[10px] text-[#D4AF37] font-bold mr-2">Bs. {(Number(flor.precio_unitario) * floresExtra[fId]).toFixed(2)}</span>
                           </div>
                         );
                       })}
                    </div>
                    <button onClick={() => setIsFloresModalOpen(true)} className="w-full py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 font-bold uppercase text-[10px] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center justify-center gap-2">
                       <Plus className="w-3 h-3" /> Agregar Flores Extra
                    </button>
                 </div>
              )}
            </div>

            {/* DEDICATORIA */}
            {type === 'ramo' && (
              <div className="border-t border-zinc-100 pt-8">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" /> Dedicatoria Especial
                </label>
                <textarea value={dedicatoria} onChange={(e) => setDedicatoria(e.target.value)} placeholder="Escribe el mensaje aquí..." className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-6 text-sm focus:bg-white focus:border-[#D4AF37] outline-none transition-all resize-none shadow-inner" rows={3} />
              </div>
            )}

            {/* FOOTER Y BOTÓN DE ACCIÓN */}
            <div className="mt-12 pt-8 border-t-2 border-zinc-100 flex flex-col gap-4 w-full">
              {sePasoDelLimite && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle className="text-red-500 shrink-0" size={20} />
                  <p className="text-[11px] font-bold text-red-600 uppercase tracking-tight leading-tight">
                    Has excedido el límite de papeles permitido ({limiteEnvolturas}).
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between gap-8">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest block mb-1">Total Final</span>
                  <div className="flex items-baseline gap-2">
                    {esOferta && <span className="text-sm text-gray-400 line-through">Bs. {Number(data.precio_base).toFixed(2)}</span>}
                    <span className={`text-xl md:text-3xl font-bold tracking-tight ${esOferta ? 'text-red-600' : 'text-zinc-900'}`}>
                      Bs. {(precioActualCalculo + calcularExtras()).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={`flex-1 ${sePasoDelLimite ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                  <AddToCartButton 
                    id={cartId}
                    productoId={id}
                    nombre={data.nombre}
                    // SE PASAN LOS DATOS DE OFERTA CALCULADOS
                    precioBase={Number(data.precio_base || data.precio_unitario || 0) + calcularExtras()}
                    precioOferta={esOferta ? (Number(data.precio_oferta) + calcularExtras()) : undefined}
                    esOferta={!!esOferta}
                    foto={foto}
                    type={type} 
                    personalizacion={personalizacionParaCarrito}
                    className="!py-5 !text-[11px] !rounded-2xl shadow-xl hover:scale-[1.02] transition-transform w-full"
                  />
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* MODAL ENVOLTURAS */}
      {isEnvolturasModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsEnvolturasModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Elegir Papel</h2>
              <button onClick={() => setIsEnvolturasModalOpen(false)}><X size={24} className="text-zinc-400 hover:text-zinc-900" /></button>
            </div>
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 scrollbar-hide">
              {opciones?.envolturas.map((env: any) => {
                const idEnv = env.id.toString();
                const isSelected = envolturasSeleccionadas.includes(idEnv);
                return (
                  <button 
                    key={env.id} 
                    onClick={() => handleUpdateEnvoltura(idEnv)} 
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all hover:scale-[1.01] ${
                      isSelected ? 'border-[#D4AF37] bg-amber-50 shadow-sm ring-1 ring-[#D4AF37]' : 'border-zinc-100 bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 relative rounded-xl overflow-hidden border bg-white flex-shrink-0">{env.foto && <Image src={env.foto} alt={env.nombre} fill className="object-cover" />}</div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-zinc-800 uppercase tracking-tight mb-1">{env.nombre}</p>
                        <p className="text-[10px] text-[#D4AF37] font-bold">Bs. {Number(env.precio_unitario || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="text-[#D4AF37]" size={22} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setIsEnvolturasModalOpen(false)} className="w-full mt-4 py-4 bg-black text-[#D4AF37] font-bold uppercase text-[10px] rounded-2xl shadow-lg">Listo</button>
          </div>
        </div>
      )}

      {/* MODAL FLORES EXTRA */}
      {isFloresModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsFloresModalOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-zinc-100 pb-3">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Añadir Flores</h2>
              <button onClick={() => setIsFloresModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors"><X size={24}/></button>
            </div>
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-1 scrollbar-hide">
              {opciones?.flores.map((flor: any) => {
                const idF = flor.id.toString();
                if (type === 'flor' && idF === id) return null;

                const cant = floresExtra[idF] || 0;
                return (
                  <div key={idF} className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 transition-all hover:bg-zinc-100/50">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 relative rounded-xl overflow-hidden border bg-white shadow-sm flex-shrink-0">{flor.foto && <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />}</div>
                      <div>
                        <p className="text-sm font-bold text-zinc-800 leading-none mb-1 uppercase tracking-tight">{flor.nombre} {flor.color || ""}</p>
                        <p className="text-xs text-[#D4AF37] font-bold">Bs. {Number(flor.precio_unitario).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-full p-1 shadow-sm">
                      <button onClick={() => handleUpdateCantidad(idF, -1, setFloresExtra)} className="text-[#D4AF37] font-bold w-6 h-6 hover:bg-zinc-50 rounded-full">-</button>
                      <input type="number" value={cant} onChange={(e) => handleUpdateCantidad(idF, e.target.value, setFloresExtra)} className="w-8 text-center text-xs font-bold bg-transparent outline-none [appearance:textfield]" />
                      <button onClick={() => handleUpdateCantidad(idF, 1, setFloresExtra)} className="text-[#D4AF37] font-bold w-6 h-6 hover:bg-zinc-50 rounded-full">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setIsFloresModalOpen(false)} className="w-full mt-6 py-4 bg-black text-[#D4AF37] font-bold uppercase text-[10px] rounded-2xl shadow-lg">Listo</button>
          </div>
        </div>
      )}
    </div>
  );
}