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
import NuestroTrabajo from "@/components/NuestroTrabajo"; 

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
    // CORRECCIÓN: Incluimos las relaciones para obtener flores y colores
    include: {
      ramo_detalle: {
        include: { flores: { select: { nombre: true, color: true } } }
      },
      ramo_envolturas: {
        include: { envolturas: { select: { color: true } } }
      }
    }
  });

  const ramos = ramosRaw.map(r => ({
    id: r.id.toString(),
    nombre: r.nombre,
    precio_base: Number(r.precio_base),
    es_oferta: r.es_oferta || false,
    precio_oferta: r.precio_oferta ? Number(r.precio_oferta) : null,
    foto_principal: r.foto_principal,
    activo: r.activo ?? true,
    categoria_id: r.categoria_id ? r.categoria_id.toString() : "",
    flores_nombres: r.ramo_detalle.map(d => d.flores.nombre),
    colores: Array.from(new Set([
      ...r.ramo_detalle.map(d => d.flores.color),
      ...r.ramo_envolturas.map(e => e.envolturas.color)
    ].filter((c): c is string => Boolean(c))))
  }));

  return (
    <main className="min-h-screen bg-crema">
      <Navbar /> 
      <HeroCarousel />

      <div id="categorias" className="border-t border-[#E5A1A6]/20 relative z-10 bg-white scroll-mt-24">
        <CategoryExplorer categories={categorias} />
      </div>

      {/* CORRECCIÓN: Pasamos ramos y categorias al componente */}
      <NuestrosRamos ramos={ramos} categorias={categorias} />
      
      <NuestrasFlores flores={flores} />
      
      {/* 2. INSERTAMOS LA GALERÍA AQUÍ */}
      <NuestroTrabajo />
      
      <LocationSection />
      <BrandValues />
      <BrandIntro />

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
              <li><Link href="/#trabajo" className="hover:text-[#C5A059] transition-colors">Nuestro Trabajo</Link></li>
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