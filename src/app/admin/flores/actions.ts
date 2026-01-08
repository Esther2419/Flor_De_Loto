"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function serialize(data: any) {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function getFlores() {
  const flores = await prisma.flores.findMany({
    orderBy: { id: 'desc' }, 
  });
  return serialize(flores);
}

export async function createFlor(formData: any, usuario: string) {
  try {
    const cantidad = parseInt(formData.cantidad) || 0;
    const disponible = cantidad > 0 ? true : false; 

    const usuarioDb = await prisma.usuarios.findUnique({ where: { email: usuario } });
    const fechaAjustada = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    await prisma.flores.create({
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        color: formData.color,
        precio_unitario: parseFloat(formData.precio),
        foto: formData.foto,
        cantidad: cantidad,
        disponible: disponible,
        usuario_actualizacion_id: usuarioDb?.id,
        fecha_actualizacion: fechaAjustada
      }
    });
    revalidatePath('/admin/flores');
    return { success: true };
  } catch (error) {
    console.error("Error creando flor:", error);
    return { success: false, error: "Error al crear la flor" };
  }
}

export async function updateFlor(id: string, formData: any, usuario: string) {
  try {
    const cantidad = parseInt(formData.cantidad) || 0;
    const disponible = cantidad === 0 ? false : formData.disponible;

    const usuarioDb = await prisma.usuarios.findUnique({ where: { email: usuario } });
    const fechaAjustada = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    await prisma.flores.update({
      where: { id: BigInt(id) },
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        color: formData.color,
        precio_unitario: parseFloat(formData.precio),
        cantidad: cantidad,
        disponible: disponible,
        foto: formData.foto,
        usuario_actualizacion_id: usuarioDb?.id,
        fecha_actualizacion: fechaAjustada
      }
    });
    revalidatePath('/admin/flores');
    return { success: true };
  } catch (error) {
    console.error("Error actualizando flor:", error);
    return { success: false, error: "Error al actualizar" };
  }
}

export async function deleteFlor(id: string) {
  try {
    await prisma.flores.delete({
       where: { id: BigInt(id) }
    });
    revalidatePath('/admin/flores');
    return { success: true };
  } catch (error) {
    console.error("Error eliminando flor:", error);
    return { success: false, error: "Error al eliminar" };
  }
}