import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel"; // Carrusel pe

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categorias = await prisma.categorias.findMany({
    where: { categoria_padre_id: null },
    orderBy: { nombre: 'asc' },
  });

  return (
    <main className="min-h-screen bg-crema">
      
      {}
      <Navbar /> 

      {}
      <HeroCarousel />

      {}
      <section className="max-w-7xl mx-auto px-4 py-16 -mt-10 relative z-20">
        
        {categorias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categorias.map((cat) => (
              <Link 
                key={cat.id.toString()} 
                href={`/catalogo/${cat.id.toString()}`} 
                className="group relative h-96 overflow-hidden rounded-md bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-[#C5A059]/10"
              >
                {/* Foto de cada Categoría */}
                {cat.foto ? (
                  <Image 
                    src={cat.foto} 
                    alt={cat.nombre} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#F9F6EE] flex items-center justify-center">
                    <span className="text-6xl text-[#C5A059]/20 font-serif">❀</span>
                  </div>
                )}
                
                {/* Textos de Categoría */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-0 left-0 w-full p-8 text-center">
                  <h3 className="font-serif text-3xl text-[#F3E5AB] italic group-hover:text-white transition-colors">
                    {cat.nombre}
                  </h3>
                  <div className="w-12 h-[1px] bg-[#C5A059] mx-auto my-3 group-hover:w-24 transition-all duration-500" />
                  <span className="text-xs text-white/80 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                    Ver Diseño
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-[#C5A059]/30">
            <p className="text-xl text-gray-500 font-serif">Cargando el catálogo...</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-12 text-center bg-[#050505] text-[#C5A059]/60 text-xs tracking-widest uppercase">
        © 2026 Flor de Loto • Cochabamba
      </footer>
    </main>
  );
}