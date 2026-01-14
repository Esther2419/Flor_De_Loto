import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import CatalogoView from "@/components/CatalogoView"; 
import { notFound } from "next/navigation";

// Configuraciones para Cloudflare Pages
export const dynamic = 'force-dynamic';
//export const runtime = 'edge';

/**
 * En Next.js 15, 'params' es una Promesa.
 * Debemos definirla como tal y usar 'await' para obtener los datos.
 */
export default async function CatalogoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Resolvemos la promesa de los parámetros
  const resolvedParams = await params;
  const categoryId = resolvedParams.id;

  // 2. Consulta a la base de datos usando Prisma
  const categoria = await prisma.categorias.findUnique({
    where: { id: BigInt(categoryId) },
    include: {
      other_categorias: { 
        orderBy: { nombre: 'asc' }
      }
    }
  });

  // Si la categoría de flores no existe, enviamos a 404
  if (!categoria) return notFound();

  // 3. Procesamos las subcategorías (Añadimos tipos 'any' para evitar errores de TS)
  const subCategoryIds = categoria.other_categorias.map((c: any) => c.id);
  const allCategoryIds = [BigInt(categoryId), ...subCategoryIds];

  // 4. Obtenemos los ramos de la florería
  const ramosRaw = await prisma.ramos.findMany({
    where: {
      categoria_id: { in: allCategoryIds },
      activo: true 
    },
    include: {
      ramo_envolturas: {
        include: {
          envolturas: { select: { nombre: true, foto: true } }
        }
      },
      ramo_detalle: {
        include: {
          flores: { select: { nombre: true, foto: true } }
        }
      }
    },
    orderBy: { id: 'desc' }
  });

  // 5. Formateamos subcategorías para la vista
  const subcategorias = categoria.other_categorias.map((c: any) => ({
    id: c.id.toString(),
    nombre: c.nombre,
    foto: c.foto
  }));

  // 6. Formateamos los ramos (Mapeo con tipos 'any' para el Build exitoso)
  const ramos = ramosRaw.map((r: any) => {
    return {
      id: r.id.toString(),
      nombre: r.nombre,
      descripcion: r.descripcion,
      precio_base: Number(r.precio_base),
      es_oferta: r.es_oferta ?? false,
      precio_oferta: r.precio_oferta ? Number(r.precio_oferta) : null,
      foto_principal: r.foto_principal,
      categoria_id: r.categoria_id ? r.categoria_id.toString() : "0",
      
      envolturas: r.ramo_envolturas.map((re: any) => ({
        nombre: re.envolturas.nombre,
        foto: re.envolturas.foto
      })),

      flores: r.ramo_detalle.map((d: any) => ({
        texto: `${d.cantidad_base} ${d.flores.nombre}`,
        foto: d.flores.foto
      }))
    };
  });

  // 7. Renderizado de la página
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