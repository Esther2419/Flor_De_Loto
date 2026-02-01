"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import FilterBar, { ActiveFilters } from "./FilterBar";

interface Ramo {
  id: string;
  nombre: string;
  precio_base: number;
  es_oferta: boolean;
  precio_oferta: number | null;
  foto_principal: string | null;
  activo: boolean;
  categoria_id: string;
  flores_nombres: string[];
  colores: string[];
}

export default function NuestrosRamos({ ramos, categorias }: { ramos: Ramo[], categorias: any[] }) {
  const INITIAL_COUNT = 12; 
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActiveFilters | null>(null);
  const router = useRouter();

  // Opciones dinámicas para el filtro
  const filterOptions = useMemo(() => ({
    flores: Array.from(new Set(ramos.flatMap(r => r.flores_nombres || []).map(f => f.trim()))).sort(),
    colores: Array.from(new Set(ramos.flatMap(r => r.colores || []))).sort(),
    categorias: categorias.map(c => ({ id: c.id, nombre: c.nombre })),
    precioMaximoData: Math.max(...ramos.map(r => r.precio_base), 0)
  }), [ramos, categorias]);

  // Lógica de filtrado combinada
  const ramosFiltrados = useMemo(() => {
    if (!filters) return ramos;
    return ramos.filter(ramo => {
      const matchCat = filters.categorias.length === 0 || filters.categorias.includes(ramo.categoria_id);
      const matchFlor = filters.flores.length === 0 || ramo.flores_nombres?.some(f => filters.flores.includes(f));
      const matchColor = filters.colores.length === 0 || ramo.colores?.some(c => filters.colores.includes(c));
      const matchPrecio = ramo.precio_base <= filters.precioMax;
      return matchCat && matchFlor && matchColor && matchPrecio;
    });
  }, [filters, ramos]);

  const handleAction = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (loadingId) return;
    setLoadingId(id);
    router.push(`/detalles/ramo/${id}`);
  };

  const visibleRamos = ramosFiltrados.slice(0, visibleCount);
  const isExpanded = visibleCount >= ramosFiltrados.length;

  return (
    <section id="ramos" className="pt-0 -mt-2 pb-12 px-2 md:px-4 bg-white scroll-mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#C5A059] uppercase mb-0 block">Catálogo Completo</span>
          <h2 className="font-serif text-xl md:text-2xl text-[#0A0A0A] italic drop-shadow-sm">Nuestros Ramos</h2>
          <div className="w-8 h-0.5 bg-[#C5A059] mx-auto rounded-full mt-1" />
        </div>

        {/* COMPONENTE DE FILTRADO */}
        <FilterBar options={filterOptions} onFilterChange={setFilters} />

        {ramosFiltrados.length === 0 ? (
          <div className="text-center text-gray-400 py-20 border-2 border-dashed border-gray-50 rounded-3xl">
            <p className="font-serif italic text-lg">No hay ramos que coincidan con esos filtros.</p>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {visibleRamos.map((ramo) => (
                  <div key={ramo.id} onClick={(e) => handleAction(e, ramo.id)} className={`group relative bg-white rounded-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg block cursor-pointer ${!ramo.activo ? 'opacity-80' : 'hover:-translate-y-1'}`}>
                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                      {ramo.foto_principal ? (
                        <Image src={ramo.foto_principal} alt={ramo.nombre} fill sizes="(max-width: 768px) 50vw, 16vw" className={`object-cover transition-transform duration-700 ${ramo.activo ? 'group-hover:scale-110' : 'grayscale'}`} />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300 text-xl">💐</div>
                      )}
                      {!ramo.activo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <span className="bg-black/70 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-white/20">Agotado</span>
                        </div>
                      )}
                      {ramo.activo && ramo.es_oferta && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider z-10">Oferta</div>
                      )}
                    </div>

                    <div className="p-2 flex flex-col gap-0.5">
                      <h3 className="font-serif text-xs font-bold text-[#0A0A0A] line-clamp-2 min-h-[2.4em] leading-tight group-hover:text-[#C5A059] transition-colors">{ramo.nombre}</h3>
                      <div className="flex items-baseline gap-1.5 mt-2">
                        {ramo.es_oferta && ramo.precio_oferta ? (
                          <>
                            <span className="text-red-500 font-bold text-sm">Bs {ramo.precio_oferta}</span>
                            <span className="text-gray-400 text-[9px] line-through">Bs {ramo.precio_base}</span>
                          </>
                        ) : (
                          <span className="text-[#C5A059] font-bold text-sm">Bs {ramo.precio_base}</span>
                        )}
                      </div>
                      <button onClick={(e) => handleAction(e, ramo.id)} disabled={!ramo.activo || loadingId === ramo.id} className="mt-2 w-full py-2 bg-[#0A0A0A] text-white text-[9px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 hover:bg-[#C5A059] transition-colors disabled:bg-gray-200">
                        {loadingId === ramo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ShoppingBag className="w-3 h-3" /> Comprar</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!isExpanded && <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent z-20 pointer-events-none" />}
            </div>

            <div className="flex flex-col items-center mt-8 relative z-30">
              {!isExpanded ? (
                <button onClick={() => setVisibleCount(prev => prev + 12)} className="group flex flex-col items-center gap-1 bg-white border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg">
                  Ver más diseños <ChevronDown className="w-4 h-4 animate-bounce group-hover:animate-none" />
                </button>
              ) : (
                ramosFiltrados.length > INITIAL_COUNT && (
                  <button onClick={() => setVisibleCount(INITIAL_COUNT)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#C5A059] px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all">
                    <ChevronUp className="w-4 h-4" /> Ver menos
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}