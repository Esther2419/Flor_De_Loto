import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryExplorer from "@/components/CategoryExplorer"; 

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
    children: cat.other_categorias.map((child) => ({
      id: child.id.toString(),
      nombre: child.nombre,
      foto: child.foto,
      children: [], 
    })).sort((a, b) => a.nombre.localeCompare(b.nombre)) 
  }));

  return (
    <main className="min-h-screen bg-crema">
      
      {/* HEADER */}
      <Navbar /> 

      {/* CARRUSEL */}
      <HeroCarousel />

      {/* SECCIÓN CATEGORÍAS */}
      <div className="bg-[#FFF5F7] min-h-[600px] border-t border-[#E5A1A6]/20">
        <CategoryExplorer categories={categorias} />
      </div>

      {/* Footer */}
      <footer className="py-12 text-center bg-[#050505] text-[#C5A059]/60 text-xs tracking-widest uppercase border-t border-[#C5A059]/10">
        © 2026 Flor de Loto • Cochabamba
      </footer>
    </main>
  );
}