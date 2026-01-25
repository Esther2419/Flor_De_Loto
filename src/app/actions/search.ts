"use server";

import prisma from "@/lib/prisma";

export async function getQuickSearchResults(query: string) {
  if (!query || query.length < 2) return { ramos: [], flores: [], envolturas: [] };

  const searchTerm = query.toLowerCase();

  const [ramos, flores, envolturas] = await Promise.all([
    prisma.ramos.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { descripcion: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 6,
      select: { 
        id: true, 
        nombre: true, 
        foto_principal: true, 
        precio_base: true, 
        es_oferta: true, 
        precio_oferta: true 
      }
    }),
    prisma.flores.findMany({
      where: {
        disponible: true,
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { color: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 4,
      select: { id: true, nombre: true, foto: true, color: true }
    }),
    prisma.envolturas.findMany({
      where: {
        disponible: true,
        OR: [
          { nombre: { contains: searchTerm, mode: 'insensitive' } },
          { color: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 4,
      select: { id: true, nombre: true, foto: true, color: true }
    })
  ]);

  return {
    ramos: ramos.map(r => ({ ...r, id: r.id.toString(), type: 'ramo' })),
    flores: flores.map(f => ({ ...f, id: f.id.toString(), type: 'flor' })),
    envolturas: envolturas.map(e => ({ ...e, id: e.id.toString(), type: 'envoltura' }))
  };
}