"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function serialize(data: any) {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

// --- LEER ---
export async function getEnvolturas() {
  const envolturas = await prisma.envolturas.findMany({
    orderBy: { id: 'desc' },
  });
  return serialize(envolturas);
}

// --- CREAR ---
export async function createEnvoltura(formData: any, usuario: string) {
  try {
    const cantidad = parseInt(formData.cantidad) || 0;
    const disponible = cantidad > 0 ? (formData.disponible !== false) : false; 

    const usuarioDb = await prisma.usuarios.findUnique({ where: { email: usuario } });
    const fechaAjustada = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    await prisma.envolturas.create({
      data: {
        nombre: formData.nombre,
        color: formData.color || null,
        diseno: formData.diseno || null,
        precio_unitario: parseFloat(formData.precio),
        cantidad: cantidad,
        disponible: disponible,
        foto: formData.foto,
        usuario_actualizacion_id: usuarioDb?.id,
        fecha_actualizacion: fechaAjustada
      }
    });
    revalidatePath('/admin/envolturas');
    return { success: true };
  } catch (error) {
    console.error("Error creando envoltura:", error);
    return { success: false, error: "Error al crear la envoltura" };
  }
}

// --- ACTUALIZAR ---
export async function updateEnvoltura(id: string, formData: any, usuario: string) {
  try {
    const cantidad = parseInt(formData.cantidad) || 0;
    const disponible = cantidad === 0 ? false : formData.disponible;

    const usuarioDb = await prisma.usuarios.findUnique({ where: { email: usuario } });
    const fechaAjustada = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    await prisma.envolturas.update({
      where: { id: BigInt(id) },
      data: {
        nombre: formData.nombre,
        color: formData.color || null,
        diseno: formData.diseno || null,
        precio_unitario: parseFloat(formData.precio),
        cantidad: cantidad,
        disponible: disponible,
        foto: formData.foto,
        usuario_actualizacion_id: usuarioDb?.id,
        fecha_actualizacion: fechaAjustada
      }
    });
    revalidatePath('/admin/envolturas');
    return { success: true };
  } catch (error) {
    console.error("Error actualizando envoltura:", error);
    return { success: false, error: "Error al actualizar" };
  }
}

// --- ELIMINAR ---
export async function deleteEnvoltura(id: string) {
  try {
    await prisma.envolturas.delete({
       where: { id: BigInt(id) }
    });
    revalidatePath('/admin/envolturas');
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2003') {
      return { 
        success: false, 
        error: "No se puede eliminar la envoltura porque está siendo utilizada en uno o más ramos del catálogo." 
      };
    }
    console.error("Error eliminando envoltura:", error);
    return { success: false, error: "Error al eliminar la envoltura" };
  }
}