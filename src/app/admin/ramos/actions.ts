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
    prisma.envolturas.findMany({ where: { disponible: true }, select: { id: true, nombre: true, precio_unitario: true, foto: true }, orderBy: { nombre: 'asc' } }),
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
      ramo_envolturas: {
        include: { envolturas: { select: { nombre: true, precio_unitario: true } } }
      },
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

        ramo_detalle: {
          create: (data.detalles || []).map((d: any) => ({
            flor_id: BigInt(d.flor_id),
            cantidad_base: parseInt(d.cantidad)
          }))
        },

        ramo_envolturas: {
          create: (data.envolturas || []).map((e: any) => ({
            envoltura_id: BigInt(e.envoltura_id),
            cantidad: parseInt(e.cantidad)
          }))
        },

        ramo_imagenes: {
          create: (data.imagenes_extra || []).map((url: string) => ({
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
        
        // Actualizar Flores
        ramo_detalle: {
          deleteMany: {}, 
          create: (data.detalles || []).map((d: any) => ({
            flor_id: BigInt(d.flor_id),
            cantidad_base: parseInt(d.cantidad)
          }))
        },

        // Actualizar Envolturas
        ramo_envolturas: {
          deleteMany: {},
          create: (data.envolturas || []).map((e: any) => ({
            envoltura_id: BigInt(e.envoltura_id),
            cantidad: parseInt(e.cantidad)
          }))
        },

        // Actualizar Imágenes
        ramo_imagenes: {
          deleteMany: {}, 
          create: (data.imagenes_extra || []).map((url: string) => ({
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
    return { success: false, error: "Error al eliminar. Puede tener reservas asociadas." };
  }
}