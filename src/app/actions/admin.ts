"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- GESTIÓN DE CONFIGURACIÓN (Pedidos por hora) ---
export async function updatePedidosPorHora(cantidad: number) {
  try {
    await prisma.configuracion.update({
      where: { id: 1 },
      data: { pedidos_por_hora: cantidad } as any // Casting por si el tipo no se ha regenerado
    });
    revalidatePath("/reservar");
    return { success: true };
  } catch (error) {
    console.error("Error actualizando pedidos por hora:", error);
    return { success: false, error: "Error al actualizar configuración" };
  }
}

// --- GESTIÓN DE BLOQUEOS (Días feriados/cerrados) ---

// Nueva función para crear bloqueos específicos
export async function crearBloqueoAction(fecha: string, horaInicio: string | null, horaFin: string | null, motivo: string) {
  try {
    const fechaDate = new Date(`${fecha}T00:00:00-04:00`); // Forzamos zona horaria Bolivia
    
    // CORRECCIÓN: Convertir strings de hora a objetos Date completos si existen
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

// Función para eliminar un bloqueo específico por ID
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

// Mantenemos esta para compatibilidad simple (toggle de día completo)
export async function toggleBloqueoFecha(fecha: string) {
  try {
    const fechaDate = new Date(`${fecha}T00:00:00-04:00`);
    // Buscamos si existe un bloqueo de día completo (sin horas)
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
  try {
    const bloqueos = await prisma.bloqueos_horario.findMany({
      orderBy: { fecha: 'asc' }
    } as any);
    
    // Retornamos objetos completos formateando las fechas a strings HH:mm
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
