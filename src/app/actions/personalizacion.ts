// src/app/actions/personalizacion.ts
"use server";

import prisma from "@/lib/prisma";

export async function getDetalleRamoConOpciones(ramoId: string) {
  const [flores, envolturas, ramoEnvolturas] = await Promise.all([
    prisma.flores.findMany({ where: { disponible: true } }),
    prisma.envolturas.findMany({ where: { disponible: true } }),
    prisma.ramo_envolturas.findMany({ where: { ramo_id: BigInt(ramoId) } })
  ]);

  // Extraemos los IDs de las envolturas que ya tiene el ramo
  const idsOriginales = ramoEnvolturas.map(re => re.envoltura_id.toString());

  return JSON.parse(JSON.stringify({ 
    flores, 
    envolturas, 
    idsOriginales 
  }, (key, value) => typeof value === 'bigint' ? value.toString() : value));
}