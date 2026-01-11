import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryExplorer from "@/components/CategoryExplorer"; 
import BrandIntro from "@/components/BrandIntro"; 
import BrandValues from "@/components/BrandValues"; 
import LocationSection from "@/components/LocationSection"; 

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

  return (
    <main className="min-h-screen bg-crema">
      <Navbar /> 
      <HeroCarousel />

      <BrandIntro />
      
      <div id="categorias" className="min-h-[400px] border-t border-[#E5A1A6]/20 relative z-10 bg-[#F9F6EE] scroll-mt-24">
        <CategoryExplorer categories={categorias} />
      </div>

      <BrandValues />

      <LocationSection />

      <footer className="py-12 text-center bg-[#0A0A0A] text-[#C5A059]/60 text-xs tracking-widest uppercase border-t border-[#C5A059]/10">
        <div className="mb-4">
           <span className="block text-2xl mb-1">❀</span>
           <span className="font-serif italic">Flor de Loto</span>
        </div>
        © 2026 Flor de Loto • Cochabamba
      </footer>
    </main>
  );
}