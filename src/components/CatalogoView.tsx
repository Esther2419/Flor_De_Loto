"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import FilterBar, { ActiveFilters } from "./FilterBar";

interface DetalleConFoto { texto: string; foto: string | null; }
interface EnvolturaConFoto { nombre: string; foto: string | null; }

interface Ramo {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  es_oferta: boolean;
  precio_oferta: number | null;
  foto_principal: string | null;
  categoria_id: string;
  envolturas: EnvolturaConFoto[];
  flores: DetalleConFoto[];
  flores_nombres: string[];
  colores: string[];
}

interface SubCategoria { id: string; nombre: string; foto: string | null; }

interface CatalogoViewProps {
  categoriaNombre: string;
  categoriaDescripcion?: string | null;
  categoriaPortada?: string | null;
  subcategorias: SubCategoria[];
  ramos: Ramo[];
}

export default function CatalogoView({ 
  categoriaNombre, categoriaDescripcion, categoriaPortada, subcategorias, ramos 
}: CatalogoViewProps) {
  
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters | null>(null);
  const router = useRouter();

  // Opciones para el filtrador basadas en los ramos disponibles
  const filterOptions = useMemo(() => ({
    flores: Array.from(new Set(ramos.flatMap(r => r.flores_nombres || []).map(f => f.trim()))).sort(),
    colores: Array.from(new Set(ramos.flatMap(r => r.colores || []))).sort(),
    categorias: subcategorias.map(c => ({ id: c.id, nombre: c.nombre })),
    precioMaximoData: ramos.length > 0 ? Math.max(...ramos.map(r => r.precio_base)) : 500
  }), [ramos, subcategorias]);

  const handleCardClick = (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    router.push(`/detalles/ramo/${id}`);
  };

  // Filtrado DOBLE: Por subcategoría (tus botones arriba) y por el nuevo FilterBar
  const ramosFiltradosFinal = useMemo(() => {
    return ramos.filter(r => {
      // 1. Filtro de tus botones de subcategoría
      const matchSub = !selectedSubId || r.categoria_id === selectedSubId;
      
      // 2. Filtros del FilterBar
      if (!filters) return matchSub;
      const matchFlor = filters.flores.length === 0 || r.flores_nombres?.some(f => filters.flores.includes(f));
      const matchColor = filters.colores.length === 0 || r.colores?.some(c => filters.colores.includes(c));
      const matchPrecio = r.precio_base <= filters.precioMax;
      // Nota: No filtramos por categoría aquí si ya tenemos los botones de arriba, 
      // pero se incluye por si el usuario usa el desplegable.
      const matchCatPanel = filters.categorias.length === 0 || filters.categorias.includes(r.categoria_id);

      return matchSub && matchFlor && matchColor && matchPrecio && matchCatPanel;
    });
  }, [selectedSubId, filters, ramos]);

  const getDiscountPercent = (base: number, offer: number) => {
    if (!base || !offer) return 0;
    return Math.round(((base - offer) / base) * 100);
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] pb-20">
      <div className="relative h-[35vh] w-full overflow-hidden bg-black">
        {categoriaPortada ? (
          <Image src={categoriaPortada} alt={categoriaNombre} fill className="object-cover opacity-60" priority />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] to-[#2D2D2D]" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="font-serif text-4xl md:text-5xl text-[#F3E5AB] italic drop-shadow-lg mb-2">{categoriaNombre}</h1>
          {categoriaDescripcion && <p className="text-white/90 text-sm md:text-base font-light max-w-xl font-serif">"{categoriaDescripcion}"</p>}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        
        {/* TUS SUBCATEGORÍAS ORIGINALES */}
        {subcategorias.length > 0 && (
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-6 md:gap-10">
              <button onClick={() => setSelectedSubId(null)} className={`flex flex-col items-center group transition-all duration-300 ${selectedSubId === null ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 bg-white shadow-sm transition-colors ${selectedSubId === null ? 'border-[#C5A059]' : 'border-gray-200 group-hover:border-[#C5A059]'}`}>
                   <span className="text-xl">∞</span>
                </div>
                <span className={`font-serif text-xs uppercase tracking-wider ${selectedSubId === null ? 'text-[#C5A059] font-bold' : 'text-gray-500'}`}>Todos</span>
              </button>
              {subcategorias.map((sub) => (
                <button key={sub.id} onClick={() => setSelectedSubId(sub.id === selectedSubId ? null : sub.id)} className={`flex flex-col items-center group transition-all duration-300 ${selectedSubId === sub.id ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                  <div className={`w-16 h-16 relative rounded-full border-2 overflow-hidden mb-2 shadow-sm transition-colors ${selectedSubId === sub.id ? 'border-[#C5A059]' : 'border-gray-200 group-hover:border-[#C5A059]'}`}>
                    {sub.foto ? <Image src={sub.foto} alt={sub.nombre} fill className="object-cover" /> : <div className="flex items-center justify-center h-full bg-gray-50 text-xs">❀</div>}
                  </div>
                  <span className={`font-serif text-xs uppercase tracking-wider ${selectedSubId === sub.id ? 'text-[#C5A059] font-bold' : 'text-gray-500'}`}>{sub.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NUEVO FILTRADOR DESPLEGABLE */}
        <div className="mb-8 flex justify-center">
            <FilterBar options={filterOptions} onFilterChange={setFilters} />
        </div>

        {ramosFiltradosFinal.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <span className="text-4xl block mb-2">🥀</span>
            <p className="font-serif text-lg">No hay diseños disponibles con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {ramosFiltradosFinal.map((ramo) => (
              <div key={ramo.id} onClick={() => handleCardClick(ramo.id)} className={`group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border flex flex-col h-full cursor-pointer ${ramo.es_oferta ? 'border-red-100 ring-1 ring-red-50' : 'border-gray-100'}`}>
                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  {ramo.foto_principal ? <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="flex items-center justify-center h-full text-gray-300 text-2xl">💐</div>}
                  {ramo.es_oferta && ramo.precio_oferta && (
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse uppercase tracking-wider">Oferta</span>
                      <span className="bg-white/90 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-red-100">-{getDiscountPercent(ramo.precio_base, ramo.precio_oferta)}%</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-[#C5A059] shadow-sm flex flex-col items-end">
                    {ramo.es_oferta && ramo.precio_oferta ? (
                      <><span className="text-[9px] text-gray-400 line-through decoration-red-300">Bs {ramo.precio_base}</span><span className="text-red-500 text-sm">Bs {ramo.precio_oferta}</span></>
                    ) : (<span>Bs {ramo.precio_base}</span>)}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <h4 className="font-serif text-sm text-[#0A0A0A] font-bold mb-2 leading-tight line-clamp-2 group-hover:text-[#C5A059] transition-colors">{ramo.nombre}</h4>
                  <div className="mb-3 flex-grow">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Composición:</p>
                    <div className="flex items-center -space-x-2">
                      {[...ramo.flores, ...ramo.envolturas].slice(0, 5).map((item, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 relative shadow-sm" title={'texto' in item ? item.texto : item.nombre}>
                          {item.foto ? <Image src={item.foto} alt="item" fill className="object-cover rounded-full" /> : <span className="flex items-center justify-center h-full text-xs">{'texto' in item ? '🌸' : '🎁'}</span>}
                        </div>
                      ))}
                      {(ramo.flores.length + ramo.envolturas.length) > 5 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 relative shadow-sm flex items-center justify-center z-10">
                          <span className="text-[9px] font-bold text-gray-500">+{ramo.flores.length + ramo.envolturas.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button className="w-full mt-auto bg-[#050505] text-[#D4AF37] border border-[#D4AF37] py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-[#D4AF37] hover:text-[#050505] transition-colors flex items-center justify-center gap-2">
                    {loadingId === ramo.id ? <Loader2 className="animate-spin w-3 h-3" /> : "Comprar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}