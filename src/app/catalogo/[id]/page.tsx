import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CatalogoView from "@/components/CatalogoView"; 
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function CatalogoPage({ params }: { params: { id: string } }) {
  const categoryId = params.id;

  const categoria = await prisma.categorias.findUnique({
    where: { id: BigInt(categoryId) },
    include: {
      other_categorias: { 
        orderBy: { nombre: 'asc' }
      }
    }
  });

  if (!categoria) return notFound();

  const subCategoryIds = categoria.other_categorias.map(c => c.id);
  const allCategoryIds = [BigInt(categoryId), ...subCategoryIds];

  const ramosRaw = await prisma.ramos.findMany({
    where: {
      categoria_id: { in: allCategoryIds },
      activo: true 
    },
    include: {
      ramo_envolturas: {
        include: {
          envolturas: { select: { nombre: true } }
        }
      },
      ramo_detalle: {
        include: {
          flores: { select: { nombre: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  const subcategorias = categoria.other_categorias.map(c => ({
    id: c.id.toString(),
    nombre: c.nombre,
    foto: c.foto
  }));

  const ramos = ramosRaw.map(r => {
    const listaEnvolturas = r.ramo_envolturas
      .map(re => re.envolturas.nombre)
      .join(", ");

    return {
      id: r.id.toString(),
      nombre: r.nombre,
      precio_base: Number(r.precio_base),
      es_oferta: r.es_oferta ?? false,
      precio_oferta: r.precio_oferta ? Number(r.precio_oferta) : null,
      foto_principal: r.foto_principal,
      categoria_id: r.categoria_id ? r.categoria_id.toString() : "0",
      envoltura: listaEnvolturas || null,
      flores: r.ramo_detalle.map(d => `${d.cantidad_base} ${d.flores.nombre}`)
    };
  });

  return (
    <main>
      <Navbar />
      <CatalogoView 
        categoriaNombre={categoria.nombre}
        categoriaDescripcion={categoria.descripcion}
        categoriaPortada={categoria.portada}
        subcategorias={subcategorias}
        ramos={ramos}
      />
    </main>
  );
}