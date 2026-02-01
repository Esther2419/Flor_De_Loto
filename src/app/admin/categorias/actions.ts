"use server";

import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function serialize(data: any) {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  return usuario?.id || null;
}

export async function getCategorias() {
  const categorias = await prisma.categorias.findMany({
    orderBy: { nombre: 'asc' },
    include: {
      categorias: {
        select: { nombre: true } 
      }
    }
  });
  return serialize(categorias);
}

export async function createCategoria(formData: any) {
  try {
    const usuarioId = await getCurrentUserId();
    
    const padreId = formData.padreId ? BigInt(formData.padreId) : null;

    await prisma.categorias.create({
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        foto: formData.foto,
        portada: formData.portada,
        categoria_padre_id: padreId,
        fecha_actualizacion: new Date(),
        usuario_actualizacion_id: usuarioId
      }
    });
    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    console.error("Error creando categoría:", error);
    return { success: false, error: "Error al crear" };
  }
}

export async function updateCategoria(id: string, formData: any) {
  try {
    // 1. Obtener anterior
    const catAnterior = await prisma.categorias.findUnique({ where: { id: BigInt(id) } });

    const usuarioId = await getCurrentUserId();
    const padreId = formData.padreId ? BigInt(formData.padreId) : null;

    if (padreId === BigInt(id)) {
        return { success: false, error: "Una categoría no puede ser su propio padre" };
    }

    await prisma.categorias.update({
      where: { id: BigInt(id) },
      data: {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        foto: formData.foto,
        portada: formData.portada,
        categoria_padre_id: padreId,
        fecha_actualizacion: new Date(),
        usuario_actualizacion_id: usuarioId
      }
    });

    // 3. Limpieza de imágenes
    if (catAnterior?.foto && catAnterior.foto !== formData.foto) {
        const fileName = catAnterior.foto.split('/').pop();
        if (fileName) await supabase.storage.from('categorias').remove([fileName]);
    }
    if (catAnterior?.portada && catAnterior.portada !== formData.portada) {
        const fileName = catAnterior.portada.split('/').pop();
        if (fileName) await supabase.storage.from('categorias').remove([fileName]);
    }

    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    console.error("Error actualizando:", error);
    return { success: false, error: "Error al actualizar" };
  }
}

export async function deleteCategoria(id: string) {
  try {
    await prisma.categorias.delete({
       where: { id: BigInt(id) }
    });
    revalidatePath('/admin/categorias');
    return { success: true };
  } catch (error) {
    console.error("Error eliminando:", error);
    return { success: false, error: "No se puede eliminar porque tiene subcategorías asociadas." };
  }
}