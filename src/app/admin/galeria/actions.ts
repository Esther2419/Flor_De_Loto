"use server";

import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

/**
 * Serializa los datos para evitar errores con tipos complejos de Prisma.
 * En el caso de UUID, Next.js los maneja bien como strings.
 */
function serialize(data: any) {
  return JSON.parse(JSON.stringify(data));
}

// --- OBTENER TODOS LOS TRABAJOS ---
export async function getGaleria() {
  try {
    const items = await prisma.galeria.findMany({
      orderBy: { fecha_creacion: 'desc' },
    });
    return serialize(items);
  } catch (error) {
    console.error("Error al obtener galería:", error);
    return [];
  }
}

// --- CONTAR ELEMENTOS (Para el Dashboard) ---
export async function getCountGaleria() {
  try {
    const count = await prisma.galeria.count();
    return count;
  } catch (error) {
    console.error("Error al contar galería:", error);
    return 0;
  }
}

// --- CREAR REGISTRO ---
export async function createGaleriaItem(url: string, descripcion: string) {
  try {
    await prisma.galeria.create({
      data: {
        url_foto: url,
        descripcion: descripcion || "Trabajo Flor de Loto",
      },
    });

    revalidatePath("/admin/galeria");
    revalidatePath("/admin");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error en createGaleriaItem:", error);
    return { success: false, error: "No se pudo guardar en la base de datos." };
  }
}

// --- EDITAR REGISTRO (NUEVA FUNCIÓN) ---
export async function updateGaleriaItem(id: string, url: string, descripcion: string) {
  try {
    // 1. Obtener item anterior
    const itemAnterior = await prisma.galeria.findUnique({ where: { id: id } });

    await prisma.galeria.update({
      where: { 
        id: id // Usamos el ID (string/UUID) para localizar el registro
      },
      data: {
        url_foto: url,
        descripcion: descripcion,
      },
    });

    // 3. Borrar foto anterior si cambió
    if (itemAnterior?.url_foto && itemAnterior.url_foto !== url) {
      const fileName = itemAnterior.url_foto.split('/').pop();
      if (fileName) await supabase.storage.from('galeria').remove([fileName]);
    }

    // Revalidamos las rutas para que el cambio sea instantáneo en toda la web
    revalidatePath("/admin/galeria");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error en updateGaleriaItem:", error);
    return { success: false, error: "No se pudo actualizar el registro en la base de datos." };
  }
}

// --- ELIMINAR REGISTRO (CORREGIDO PARA UUID) ---
export async function deleteGaleriaItem(id: string) {
  try {
    await prisma.galeria.delete({
      where: { 
        id: id 
      },
    });

    revalidatePath("/admin/galeria");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Error en deleteGaleriaItem:", error);
    return { success: false, error: "No se pudo eliminar el registro de la base de datos." };
  }
}