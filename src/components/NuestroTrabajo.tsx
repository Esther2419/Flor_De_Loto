"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getGaleria } from "@/app/admin/galeria/actions";
import { ZoomIn, X, ChevronDown, ChevronUp } from "lucide-react";

interface GaleriaItem {
  id: string | number;
  url_foto: string;
  descripcion?: string;
}

export default function NuestroTrabajo() {
  const INITIAL_COUNT = 12; // Misma cantidad inicial que tus ramos
  const [items, setItems] = useState<GaleriaItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getGaleria();
        setItems(data as unknown as GaleriaItem[]);
      } catch (error) {
        console.error("Error cargando galería:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  const isExpanded = visibleCount >= items.length;
  const visibleItems = items.slice(0, visibleCount);

  if (loading || items.length === 0) return null;

  return (
    <section id="trabajo" className="pt-8 pb-12 px-2 md:px-4 bg-white scroll-mt-20 relative z-10">
      <div className="max-w-7xl mx-auto">
        
        {/* CABECERA ESTILO FLOR DE LOTO */}
        <div className="text-center mb-6">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#C5A059] uppercase mb-0 block">
            Nuestra Trayectoria
          </span>
          <h2 className="font-serif text-xl md:text-2xl text-[#0A0A0A] italic drop-shadow-sm">
            Nuestro Trabajo
          </h2>
          <div className="w-8 h-0.5 bg-[#C5A059] mx-auto rounded-full mt-1" />
        </div>

        <div className="relative">
          {/* GRID IDENTICO AL DE RAMOS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {visibleItems.map((item) => (
              <div 
                key={item.id.toString()} 
                onClick={() => setSelectedImg(item.url_foto)}
                className="group relative bg-white rounded-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg cursor-pointer hover:-translate-y-1"
              >
                <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                  <Image 
                    src={item.url_foto} 
                    alt={item.descripcion || "Trabajo Flor de Loto"} 
                    fill 
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    unoptimized 
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 p-2 rounded-full">
                      <ZoomIn className="text-[#C5A059] w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <p className="font-serif text-[10px] italic text-gray-400 truncate text-center">
                    {item.descripcion || "Diseño Floral"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* GRADIENTE DE DESVANECIMIENTO (Solo si no está expandido) */}
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent z-20 pointer-events-none" />
          )}
        </div>

        {/* BOTONES VER MÁS / VER MENOS IDENTICOS A TUS RAMOS */}
        <div className="flex flex-col items-center mt-8 relative z-30">
          {!isExpanded ? (
            <button 
              onClick={() => setVisibleCount(prev => prev + 12)}
              className="group flex flex-col items-center gap-1 bg-white border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-white px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg"
            >
              Ver más fotos
              <ChevronDown className="w-4 h-4 animate-bounce group-hover:animate-none" />
            </button>
          ) : (
            items.length > INITIAL_COUNT && (
              <button 
                onClick={() => {
                    setVisibleCount(INITIAL_COUNT);
                    document.getElementById('trabajo')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#C5A059] px-6 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
              >
                <ChevronUp className="w-4 h-4" />
                Ver menos
              </button>
            )
          )}
        </div>
      </div>

      {/* LIGHTBOX */}
      {selectedImg && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedImg(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-[#C5A059]"><X size={32} /></button>
          <div className="relative w-full max-w-4xl h-[80vh]">
            <Image src={selectedImg} alt="Ampliado" fill className="object-contain" unoptimized />
          </div>
        </div>
      )}
    </section>
  );
}