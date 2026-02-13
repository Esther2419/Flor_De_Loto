"use server";

import prisma from "@/lib/prisma";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

// --- GESTIÓN DE CONFIGURACIÓN (Pedidos por hora y QR) ---

export async function uploadPaymentQR(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No se proporcionó ningún archivo");

    // Validación de seguridad para TypeScript
    if (!supabaseAdmin) {
      throw new Error("El cliente administrativo no está configurado (falta SUPABASE_SERVICE_ROLE_KEY)");
    }

    const config = await prisma.configuracion.findFirst();
    
    // 1. Borrado previo con cliente Admin
    if (config?.qr_pago) {
      const urlParts = config.qr_pago.split("/");
      const fileName = urlParts.pop()?.split("?")[0]; 
      
      if (fileName) {
        // Aquí ya no da error porque validamos arriba
        await supabaseAdmin.storage.from("comprobantes").remove([fileName]);
      }
    }

    // 2. Subida con nombre único (Forzamos webp)
    const fileName = `qr_pago_${Date.now()}.webp`;
    
    const { data, error: uploadError } = await supabase.storage
      .from("comprobantes")
      .upload(fileName, file, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from("comprobantes")
      .getPublicUrl(fileName);

    // 5. Actualizar la base de datos
    await prisma.configuracion.update({
      where: { id: config?.id || 1 },
      data: { qr_pago: publicUrl } as any,
    });

    revalidatePath("/admin");
    revalidatePath("/reservar");
    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error uploadPaymentQR:", error);
    return { success: false, error: error.message || "Error al subir el QR" };
  }
}

export async function deletePaymentQR() {
  try {
    if (!supabaseAdmin) {
      throw new Error("El cliente administrativo no está configurado");
    }

    const config = await prisma.configuracion.findFirst();
    if (!config?.qr_pago) return { success: true };

    const urlParts = config.qr_pago.split("/");
    const fileName = urlParts.pop()?.split("?")[0];

    if (fileName) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("comprobantes")
        .remove([fileName]);
      
      if (storageError) {
        console.error("Error al borrar archivo de Supabase:", storageError);
      }
    }

    await prisma.configuracion.update({
      where: { id: config.id },
      data: { qr_pago: null } as any,
    });

    revalidatePath("/admin");
    revalidatePath("/reservar");
    return { success: true };
  } catch (error: any) {
    console.error("Error deletePaymentQR:", error);
    return { success: false, error: error.message || "Error al eliminar el QR" };
  }
}

export async function updatePedidosPorHora(cantidad: number, intervalo: number) {
  try {
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { 
        pedidos_por_hora: cantidad,
        intervalo_minutos: intervalo
      } as any
    });
    revalidatePath("/reservar");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando pedidos por hora:", error);
    return { success: false, error: "Error al actualizar configuración" };
  }
}

// --- GESTIÓN DE BLOQUEOS (Días feriados/cerrados) ---

export async function crearBloqueoAction(fecha: string, horaInicio: string | null, horaFin: string | null, motivo: string) {
  try {
    const fechaDate = new Date(`${fecha}T00:00:00-04:00`); 
    let startDateTime = null;
    let endDateTime = null;
    if (horaInicio && horaFin) {
      startDateTime = new Date(`${fecha}T${horaInicio}:00-04:00`);
      endDateTime = new Date(`${fecha}T${horaFin}:00-04:00`);
    }

    await prisma.bloqueos_horario.create({
      data: { 
        fecha: fechaDate, 
        hora_inicio: startDateTime, 
        hora_fin: endDateTime,
        motivo: motivo || "Cierre administrativo" 
      } as any
    });
    
    revalidatePath("/reservar");
    return { success: true };
  } catch (error) {
    console.error("Error creando bloqueo:", error);
    return { success: false, error: "Error al crear bloqueo" };
  }
}

export async function eliminarBloqueoAction(id: string | number) {
  try {
    await prisma.bloqueos_horario.delete({ 
      where: { id: Number(id) } 
    } as any);
    revalidatePath("/reservar");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al eliminar bloqueo" };
  }
}

export async function toggleBloqueoFecha(fecha: string) {
  try {
    const fechaDate = new Date(`${fecha}T00:00:00-04:00`);
    const existente = await prisma.bloqueos_horario.findFirst({
      where: { fecha: fechaDate, hora_inicio: null, hora_fin: null }
    } as any);

    if (existente) {
      await prisma.bloqueos_horario.delete({ where: { id: existente.id } } as any);
    } else {
      await prisma.bloqueos_horario.create({
        data: { fecha: fechaDate, motivo: "Cierre manual" } as any
      });
    }
    revalidatePath("/reservar");
    return { success: true };
  } catch (e) { return { success: false }; }
}

export async function getBloqueosAction() {
  noStore(); // Evitar caché para actualizaciones en tiempo real
  try {
    const bloqueos = await prisma.bloqueos_horario.findMany({
      orderBy: { fecha: 'asc' }
    } as any);
    
    return bloqueos.map((b: any) => {
      const formatTime = (d: any) => {
        if (!d) return null;
        if (d instanceof Date) {
          return d.toLocaleTimeString('en-GB', { 
            hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' 
          });
        }
        return String(d).substring(0, 5);
      };

      return {
        id: b.id,
        fecha: b.fecha.toISOString().split('T')[0],
        hora_inicio: formatTime(b.hora_inicio),
        hora_fin: formatTime(b.hora_fin),
        motivo: b.motivo
      };
    });
  } catch (error) {
    return [];
  }
}

export async function getConfigAction() {
  try {
    const config = await prisma.configuracion.findUnique({ where: { id: 1 } });
    return config;
  } catch (error) {
    return null;
  }
}