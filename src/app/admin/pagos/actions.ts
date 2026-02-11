// src/app/admin/pagos/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Acción para componentes cliente (usada en PaymentRow.tsx)
export async function validarPago(pedidoId: string, accion: 'confirmar' | 'rechazar') {
  try {
    const nuevoEstado = accion === 'confirmar' ? 'aceptado' : 'rechazado';
    const fechaCampo = accion === 'confirmar' ? { fecha_aceptado: new Date() } : { fecha_rechazado: new Date() };
    
    await prisma.pedidos.update({
      where: { id: BigInt(pedidoId) },
      data: { 
        estado: nuevoEstado,
        ...fechaCampo
      }
    });

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error validando pago/pedido:", error);
    return { success: false, error: "Error al actualizar el pedido" };
  }
}

// Acción para eliminar un comprobante (liberar espacio y limpiar campo en pedido)
export async function eliminarPago(pedidoId: string) {
  try {
    const id = BigInt(pedidoId);
    
    // 1. Obtenemos el registro para saber qué archivo borrar
    const pedido = await prisma.pedidos.findUnique({
      where: { id },
      select: { comprobante_pago: true }
    });

    if (pedido?.comprobante_pago) {
      // 2. Extraer el nombre del archivo
      const fileName = pedido.comprobante_pago.split('/').pop();
      
      if (fileName) {
        // Verificado: es "comprobantes" en el resto del proyecto
        // Usamos supabaseAdmin para asegurar permisos de borrado (ignora RLS)
        const { error: storageError } = await (supabaseAdmin || supabase).storage
          .from("comprobantes")
          .remove([fileName]);

        if (storageError) {
          console.error("Error al borrar de Supabase Storage:", storageError);
        }
      }

      // 3. Actualizamos la base de datos para que el campo sea NULL
      await prisma.pedidos.update({
        where: { id },
        data: { 
          comprobante_pago: null 
        }
      });
    }

    revalidatePath("/admin/pedidos");
    revalidatePath("/admin/pagos");
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error eliminando comprobante:", error);
    return { success: false, error: "No se pudo actualizar la base de datos" };
  }
}

// --- GESTIÓN DIRECTA DEL BUCKET (Sin cambios) ---
export async function getBucketFiles() {
  try {
    const { data, error } = await supabase.storage.from('comprobantes').list(undefined, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (error) throw error;

    return data.map((file) => {
      const { data: { publicUrl } } = supabase.storage.from('comprobantes').getPublicUrl(file.name);
      return {
        name: file.name,
        created_at: file.created_at,
        size: file.metadata?.size,
        publicUrl
      };
    });
  } catch (error) {
    console.error("Error obteniendo archivos del bucket:", error);
    return [];
  }
}

export async function deleteBucketFile(fileName: string) {
  try {
    // Usamos supabaseAdmin para asegurar permisos de borrado (ignora RLS)
    const { error } = await (supabaseAdmin || supabase).storage.from('comprobantes').remove([fileName]);
    if (error) throw error;
    
    // Actualizar pedidos que tengan esta imagen para que no muestren un link roto
    await prisma.pedidos.updateMany({
      where: {
        comprobante_pago: {
          contains: fileName
        }
      },
      data: {
        comprobante_pago: null
      }
    });

    revalidatePath("/admin/pagos");
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar archivo físico" };
  }
}

// Acción para actualizar el estado de verificación del pago (Total/Parcial/Pendiente)
export async function actualizarEstadoPago(pedidoId: string, estadoPago: string) {
  try {
    await prisma.pedidos.update({
      where: { id: BigInt(pedidoId) },
      data: { pago_confirmado: estadoPago }
    });
    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${pedidoId}`);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando estado de pago:", error);
    return { success: false, error: "Error al actualizar el estado de pago" };
  }
}
