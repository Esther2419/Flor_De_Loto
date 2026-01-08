import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const categoryId = BigInt(params.id);

  const category = await prisma.categorias.findUnique({
    where: { id: categoryId },
    include: {
      other_categorias: {
        orderBy: { nombre: 'asc' }
      },
      ramos: {
        where: { activo: true },
        include: {
          envolturas: true,
        }
      }
    }
  });

  if (!category) {
    return notFound();
  }

  const subcategories = category.other_categorias;
  const products = category.ramos;
  const hasSubcategories = subcategories.length > 0;
  const hasProducts = products.length > 0;

  return (
    <div className="min-h-screen bg-[#F9F9F9] pb-20">
      
      {/* --- HERO SECTION CON NAVBAR INTEGRADO --- */}
      <div className="relative h-[60vh] min-h-[500px] w-full flex flex-col">
        
        {/* IMAGEN DE FONDO */}
        <div className="absolute inset-0 z-0">
          {category.foto ? (
            <Image
              src={category.foto}
              alt={category.nombre}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-[#050505] flex items-center justify-center">
               <div className="absolute inset-0 bg-[url('/pattern-bg.png')] opacity-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
        </div>

        <div className="relative z-50">
           <Navbar />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10">
          <h1 className="font-serif text-5xl md:text-7xl text-[#C5A059] italic mb-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            {category.nombre}
          </h1>
          
          <div className="w-32 h-1.5 bg-[#E5A1A6] mx-auto rounded-full mb-8 shadow-lg" />

          {category.descripcion && (
            <p className="text-white/95 font-['Lato'] font-light text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed drop-shadow-md">
              {category.descripcion}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
        
        {hasSubcategories && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-8">
            {subcategories.map((sub) => (
              <Link 
                key={sub.id.toString()}
                href={`/catalogo/${sub.id}`}
                className="group bg-white rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center p-6 backdrop-blur-sm"
              >
                <div className="relative w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-[#F9F9F9] shadow-inner group-hover:border-[#E5A1A6] transition-colors mb-4">
                  {sub.foto ? (
                    <Image 
                      src={sub.foto} 
                      alt={sub.nombre} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[#E5A1A6]/30 text-4xl">❀</div>
                  )}
                </div>
                <h3 className="font-serif text-[#5D4E4E] text-lg text-center font-bold group-hover:text-[#C5A059] transition-colors">
                  {sub.nombre}
                </h3>
              </Link>
            ))}
          </div>
        )}

        {hasProducts && (
          <div className={`${hasSubcategories ? 'mt-20' : 'mt-0'}`}>
            {!hasSubcategories && (
              <div className="bg-white p-6 rounded-xl shadow-lg mb-10 text-center border border-[#C5A059]/10 max-w-2xl mx-auto">
                <p className="text-[#5D4E4E] font-serif italic text-lg">Explora nuestra selección exclusiva de {category.nombre}</p>
              </div>
            )}

            {hasSubcategories && (
               <div className="flex items-center gap-4 mb-10">
                 <div className="h-px bg-[#C5A059]/30 flex-1"></div>
                 <span className="text-[#C5A059] uppercase tracking-widest text-sm font-bold">Todos los ramos</span>
                 <div className="h-px bg-[#C5A059]/30 flex-1"></div>
               </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product) => (
                <Link 
                  key={product.id.toString()}
                  href={`/producto/${product.id}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col border border-gray-100"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    {product.foto_principal ? (
                      <Image 
                        src={product.foto_principal} 
                        alt={product.nombre} 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-5xl">✿</div>
                    )}
                    {product.es_oferta && (
                      <span className="absolute top-3 right-3 bg-[#E5A1A6] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Oferta
                      </span>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-serif text-lg text-[#5D4E4E] mb-2 group-hover:text-[#C5A059] transition-colors line-clamp-2">
                      {product.nombre}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-end justify-between">
                      <div className="flex flex-col">
                         {product.es_oferta && product.precio_oferta ? (
                           <>
                             <span className="text-gray-400 line-through text-xs mb-1">Bs {Number(product.precio_base).toFixed(2)}</span>
                             <span className="text-[#C5A059] font-bold text-xl">Bs {Number(product.precio_oferta).toFixed(2)}</span>
                           </>
                         ) : (
                           <span className="text-[#5D4E4E] font-bold text-xl">Bs {Number(product.precio_base).toFixed(2)}</span>
                         )}
                      </div>
                      <span className="text-[#E5A1A6] text-xs font-bold uppercase tracking-widest border-b border-[#E5A1A6] pb-0.5 group-hover:border-[#C5A059] group-hover:text-[#C5A059] transition-colors">
                        Ver
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* --- MENSAJE VACÍO --- */}
        {!hasSubcategories && !hasProducts && (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 mt-8">
            <span className="text-5xl block mb-4 opacity-40 grayscale">🥀</span>
            <p className="text-gray-500 font-serif text-lg">Aún no hay diseños disponibles en esta categoría.</p>
            <Link href="/" className="mt-6 inline-block px-6 py-2 bg-[#050505] text-[#C5A059] rounded-full hover:bg-[#C5A059] hover:text-white transition-all text-sm uppercase tracking-widest">
              Volver al inicio
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}