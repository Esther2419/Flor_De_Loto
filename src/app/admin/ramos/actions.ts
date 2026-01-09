"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function serialize(data: any) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'object' && value !== null && 's' in value && 'e' in value) return value.toString();
    return value;
  }));
}

// --- DATOS AUXILIARES ---
export async function getAuxData() {
  const [categorias, envolturas, flores] = await Promise.all([
    prisma.categorias.findMany({ select: { id: true, nombre: true }, orderBy: { nombre: 'asc' } }),
    prisma.envolturas.findMany({ where: { disponible: true }, select: { id: true, nombre: true, precio_unitario: true }, orderBy: { nombre: 'asc' } }),
    prisma.flores.findMany({ 
      where: { disponible: true }, 
      select: { id: true, nombre: true, precio_unitario: true, foto: true, color: true }, 
      orderBy: { nombre: 'asc' } 
    })
  ]);
  return serialize({ categorias, envolturas, flores });
}

// --- LEER RAMOS ---
export async function getRamos() {
  const ramos = await prisma.ramos.findMany({
    orderBy: { id: 'desc' },
    include: {
      categorias: { select: { nombre: true } },
      envolturas: { select: { nombre: true } },
      ramo_detalle: {
        include: { flores: { select: { nombre: true, foto: true, color: true } } }
      },
      ramo_imagenes: true
    }
  });
  return serialize(ramos);
}

// --- CREAR RAMO ---
export async function createRamo(data: any) {
  try {
    await prisma.ramos.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio_base: parseFloat(data.precio_base),
        tipo: data.tipo,
        es_oferta: data.es_oferta,
        precio_oferta: data.es_oferta ? parseFloat(data.precio_oferta) : null,
        activo: data.activo,
        foto_principal: data.foto_principal,
        
        categoria_id: data.categoria_id ? BigInt(data.categoria_id) : null,
        envoltura_default_id: data.envoltura_default_id ? BigInt(data.envoltura_default_id) : null,

        ramo_detalle: {
          create: data.detalles.map((d: any) => ({
            flor_id: BigInt(d.flor_id),
            cantidad_base: parseInt(d.cantidad)
          }))
        },

        ramo_imagenes: {
          create: data.imagenes_extra.map((url: string) => ({
            url_foto: url
          }))
        },
        
        fecha_actualizacion: new Date()
      }
    });
    revalidatePath('/admin/ramos');
    return { success: true };
  } catch (error: any) {
    console.error("Error creando ramo:", error);
    return { success: false, error: error.message };
  }
}

// --- ACTUALIZAR RAMO ---
export async function updateRamo(id: string, data: any) {
  try {
    await prisma.ramos.update({
      where: { id: BigInt(id) },
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio_base: parseFloat(data.precio_base),
        tipo: data.tipo,
        es_oferta: data.es_oferta,
        precio_oferta: data.es_oferta ? parseFloat(data.precio_oferta) : null,
        activo: data.activo,
        foto_principal: data.foto_principal,
        
        categoria_id: data.categoria_id ? BigInt(data.categoria_id) : null,
        envoltura_default_id: data.envoltura_default_id ? BigInt(data.envoltura_default_id) : null,

        ramo_detalle: {
          deleteMany: {}, 
          create: data.detalles.map((d: any) => ({
            flor_id: BigInt(d.flor_id),
            cantidad_base: parseInt(d.cantidad)
          }))
        },

        ramo_imagenes: {
          deleteMany: {}, 
          create: data.imagenes_extra.map((url: string) => ({
            url_foto: url
          }))
        },
        
        fecha_actualizacion: new Date()
      }
    });
    revalidatePath('/admin/ramos');
    return { success: true };
  } catch (error: any) {
    console.error("Error actualizando ramo:", error);
    return { success: false, error: error.message };
  }
}

// --- ELIMINAR RAMO ---
export async function deleteRamo(id: string) {
  try {
    await prisma.ramo_imagenes.deleteMany({
      where: { ramo_id: BigInt(id) }
    });

    await prisma.ramos.delete({
      where: { id: BigInt(id) }
    });
    
    revalidatePath('/admin/ramos');
    return { success: true };
  } catch (error: any) {
    console.error("Error eliminando ramo:", error);
    return { success: false, error: "No se puede eliminar. Verifica reservas activas." };
  }
}