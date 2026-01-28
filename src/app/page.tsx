import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryExplorer from "@/components/CategoryExplorer"; 
import BrandIntro from "@/components/BrandIntro"; 
import BrandValues from "@/components/BrandValues"; 
import LocationSection from "@/components/LocationSection"; 
import NuestrosRamos from "@/components/NuestrosRamos";
import NuestrasFlores from "@/components/NuestrasFlores";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categoriasRaw = await prisma.categorias.findMany({
    where: { categoria_padre_id: null },
    include: { 
      other_categorias: true 
    },
    orderBy: { nombre: 'asc' },
  });

  const categorias = categoriasRaw.map((cat) => ({
    id: cat.id.toString(),
    nombre: cat.nombre,
    foto: cat.foto,
    portada: cat.portada,
    descripcion: cat.descripcion,
    children: cat.other_categorias.map((child) => ({
      id: child.id.toString(),
      nombre: child.nombre,
      foto: child.foto,
      children: [], 
    })).sort((a, b) => a.nombre.localeCompare(b.nombre)) 
  }));

  const floresRaw = await prisma.flores.findMany({
    orderBy: { nombre: 'asc' },
  });

  const flores = floresRaw.map(f => ({
    id: f.id.toString(),
    nombre: f.nombre,
    precio_unitario: Number(f.precio_unitario),
    foto: f.foto,
    disponible: f.disponible ?? false, 
    color: f.color
  }));

  const ramosRaw = await prisma.ramos.findMany({
    orderBy: { fecha_creacion: 'desc' },
  });

  const ramos = ramosRaw.map(r => ({
    id: r.id.toString(),
    nombre: r.nombre,
    precio_base: Number(r.precio_base),
    es_oferta: r.es_oferta || false,
    precio_oferta: r.precio_oferta ? Number(r.precio_oferta) : null,
    foto_principal: r.foto_principal,
    activo: r.activo ?? true
  }));

  return (
    <main className="min-h-screen bg-crema">
      <Navbar /> 
      <HeroCarousel />

      <div id="categorias" className="border-t border-[#E5A1A6]/20 relative z-10 bg-white scroll-mt-24">
        <CategoryExplorer categories={categorias} />
      </div>

      <NuestrosRamos ramos={ramos} />
      <NuestrasFlores flores={flores} />
      
      <LocationSection />
      <BrandValues />
      <BrandIntro />

      {/* Tu Footer original completo */}
      <footer className="bg-[#050505] text-[#C5A059] border-t border-[#C5A059]/20 pt-8 md:pt-16 pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto px-2 md:px-6 grid grid-cols-3 gap-2 md:gap-12 mb-6 md:mb-12">
          
          <div className="flex flex-col items-start text-left">
             <div className="mb-2 md:mb-4 relative w-10 h-10 md:w-16 md:h-16 opacity-80">
                <Image src="/LogoSinLetra.png" alt="Logo" fill className="object-contain" />
             </div>
             <h3 className="font-serif text-sm md:text-2xl italic text-[#F3E5AB] mb-1 md:mb-2">Flor de Loto</h3>
             <p className="text-[9px] md:text-sm text-white/60 font-light leading-tight md:leading-relaxed max-w-xs">
               Creando momentos inolvidables con la elegancia y frescura que solo la naturaleza puede ofrecer.
             </p>
          </div>

          <div className="text-left">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] text-white mb-2 md:mb-6">Contacto</h4>
            <div className="space-y-2 md:space-y-4 text-[9px] md:text-sm text-white/70 font-light leading-tight">
              <div>
                <strong className="block text-[#C5A059]">Ubicación:</strong>
                <span className="block">Av. General Galindo frente a la Plazuela Tarija.</span>
              </div>
              <div>
                <strong className="block text-[#C5A059]">Teléfono:</strong>
                <span>+591 79783761</span>
              </div>
              <div>
                <strong className="block text-[#C5A059]">Horarios:</strong>
                Lun - Sáb: 07:00 am - 21:00 pm <br/>
                Dom: 08:00 am - 18:00 pm
              </div>
            </div>
          </div>

          <div className="text-left">
            <h4 className="font-bold text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.2em] text-white mb-2 md:mb-6">Explorar</h4>
            <ul className="space-y-1 md:space-y-2 text-[9px] md:text-sm text-white/70 mb-4 md:mb-8">
              <li><Link href="/#categorias" className="hover:text-[#C5A059] transition-colors">Categorías</Link></li>
              <li><Link href="/#ramos" className="hover:text-[#C5A059] transition-colors">Nuestros Ramos</Link></li>
              <li><Link href="/#encuentranos" className="hover:text-[#C5A059] transition-colors">Ubicación</Link></li>
              <li>
                <a 
                  href="https://wa.me/59179783761?text=Hola%20Flor%20de%20Loto%20quiero%20contactarme%20para..." 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-[#C5A059] transition-colors"
                >
                  Contáctanos
                </a>
              </li>
            </ul>
            
            <div className="flex justify-start gap-2 md:gap-4">
               <a href="#" className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#C5A059]/30 flex items-center justify-center hover:bg-[#C5A059] hover:text-black transition-all">
                 <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.871v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
               </a>
               <a href="#" className="w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#C5A059]/30 flex items-center justify-center hover:bg-[#C5A059] hover:text-black transition-all">
                 <svg className="w-3 h-3 md:w-4 md:h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
               </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#C5A059]/10 pt-4 md:pt-8 text-center">
           <p className="text-[#C5A059]/40 text-[8px] md:text-[10px] tracking-widest uppercase">
             © 2026 Flor de Loto • Cochabamba
           </p>
        </div>
      </footer>
    </main>
  );
}