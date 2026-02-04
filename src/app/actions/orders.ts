"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface OrderData {
  nombre_contacto: string;
  telefono_contacto: string;
  fecha_entrega: string;
  quien_recoge: string;
  hora_recojo: string;
  total: number;
  items: any[];
}

function getValidId(id: string | number): bigint {
  const stringId = String(id);
  const numericPart = stringId.match(/\d+/)?.[0];
  if (!numericPart) throw new Error(`ID inválido: ${id}`);
  return BigInt(numericPart);
}

function getMinutesTotal(input: any): number {
  if (input instanceof Date) {
    return input.getUTCHours() * 60 + input.getUTCMinutes();
  }
  const parts = String(input).split(':');
  if (parts.length < 2) return 0;
  return Number(parts[0]) * 60 + Number(parts[1]);
}

// Helper para extraer HH:mm de un Date (DB) de forma segura
function getTimeFromDate(date: any): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date.substring(0, 5);
  if (date instanceof Date) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'America/La_Paz' });
  }
  return null;
}

// --- NUEVA FUNCIÓN: Verificar disponibilidad (Cliente) ---
export async function checkAvailabilityAction(fecha: string, hora: string) {
  try {
    const fechaString = `${fecha}T${hora}:00-04:00`;
    const fechaDate = new Date(fechaString);
    
    if (isNaN(fechaDate.getTime())) return { available: false, message: "Fecha inválida" };

    // 1. Verificar Bloqueo de Día
    const startDay = new Date(fechaDate); startDay.setHours(0,0,0,0);
    const endDay = new Date(fechaDate); endDay.setHours(23,59,59,999);
    
    const bloqueos = await prisma.bloqueos_horario.findMany({
      where: { fecha: { gte: startDay, lte: endDay } }
    } as any);
    
    for (const bloqueo of bloqueos) {
      const bInicio = getTimeFromDate(bloqueo.hora_inicio);
      const bFin = getTimeFromDate(bloqueo.hora_fin);

      // Si no tiene horas definidas, es bloqueo de día completo
      if (!bInicio || !bFin) {
        return { available: false, message: `Fecha bloqueada: ${bloqueo.motivo || "Cierre administrativo"}` };
      }
      // Si tiene horas, verificar colisión (hora es string "HH:mm")
      if (hora >= bInicio && hora < bFin) {
        return { available: false, message: `Horario no disponible (${bInicio} - ${bFin}): ${bloqueo.motivo}` };
      }
    }

    // 2. Verificar Cupo por Hora
    const startHour = new Date(fechaDate); startHour.setMinutes(0,0,0);
    const endHour = new Date(fechaDate); endHour.setMinutes(59,59,999);

    const [count, config] = await Promise.all([
      prisma.pedidos.count({
        where: { fecha_entrega: { gte: startHour, lte: endHour }, estado: { not: 'cancelado' } }
      }),
      prisma.configuracion.findUnique({ where: { id: 1 } })
    ]);

    const limit = (config as any)?.pedidos_por_hora || 5;
    
    if (count >= limit) return { available: false, message: "Cupos llenos para este horario." };

    return { available: true };
  } catch (error) {
    return { available: false, message: "Error al verificar disponibilidad." };
  }
}

export async function createOrderAction(data: OrderData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false, message: "No autenticado" };

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
  });

  if (!usuario) return { success: false, message: "Usuario no encontrado" };

  try {
    const ahoraBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));

    const pedido = await prisma.$transaction(async (tx) => {
      const config = await tx.configuracion.findUnique({ where: { id: 1 } });
      
      if (!config || !config.horario_apertura || !config.horario_cierre) {
        throw new Error("Configuración de horarios no disponible.");
      }

      if (!config.tienda_abierta || (config as any).cierre_temporal) {
        throw new Error("La tienda se encuentra cerrada actualmente.");
      }

      const bufferMinutos = Number((config as any).minutos_preparacion) || 120;
      
      // --- FIX DEFINITIVO PARA EL FORMATO DE FECHA ---
      // Si data.fecha_entrega viene como "2026-02-01T06:10...", tomamos solo "2026-02-01"
      const soloFecha = data.fecha_entrega.split('T')[0].trim();
      const horaLimpia = data.hora_recojo.trim();
      
      // Armamos el string ISO correcto para Bolivia
      const fechaString = `${soloFecha}T${horaLimpia}:00-04:00`;
      const fechaEntregaExacta = new Date(fechaString);

      if (isNaN(fechaEntregaExacta.getTime())) {
        throw new Error(`Error de formato. Recibido: ${data.fecha_entrega}, Procesado: ${fechaString}`);
      }
      // -----------------------------------------------

      const diffMinutos = Math.floor((fechaEntregaExacta.getTime() - ahoraBolivia.getTime()) / 60000);
      if (diffMinutos < bufferMinutos) {
        throw new Error(`Necesitamos por lo menos ${bufferMinutos} minutos para preparar tu pedido.`);
      }

      const [hPedido, mPedido] = horaLimpia.split(':').map(Number);
      const minutosPedido = hPedido * 60 + mPedido;
      const minApertura = getMinutesTotal(config.horario_apertura);
      const minCierre = getMinutesTotal(config.horario_cierre);

      if (minutosPedido < minApertura || minutosPedido >= minCierre) {
        throw new Error("HORARIO NO PERMITIDO. La tienda está fuera de su horario de atención.");
      }

      // --- VALIDACIÓN DE ÚLTIMO MINUTO (Backend Robustness) ---
      // 1. Verificar si el día está bloqueado en la tabla de excepciones
      const startDay = new Date(fechaEntregaExacta); startDay.setHours(0,0,0,0);
      const endDay = new Date(fechaEntregaExacta); endDay.setHours(23,59,59,999);
      
      const bloqueosDia = await (tx as any).bloqueos_horario.findMany({
        where: { fecha: { gte: startDay, lte: endDay } }
      });

      for (const bloqueo of bloqueosDia) {
        const bInicio = getTimeFromDate(bloqueo.hora_inicio);
        const bFin = getTimeFromDate(bloqueo.hora_fin);

        if (!bInicio || !bFin) {
           throw new Error(`Lo sentimos, esta fecha acaba de ser bloqueada: ${bloqueo.motivo}`);
        }
        if (horaLimpia >= bInicio && horaLimpia < bFin) {
           throw new Error(`Lo sentimos, el horario ${horaLimpia} acaba de ser bloqueado: ${bloqueo.motivo}`);
        }
      }

      // 2. Verificar cupo de pedidos por hora (Concurrency Check)
      const startHour = new Date(fechaEntregaExacta); startHour.setMinutes(0,0,0);
      const endHour = new Date(fechaEntregaExacta); endHour.setMinutes(59,59,999);

      const pedidosEnEsaHora = await tx.pedidos.count({
        where: { fecha_entrega: { gte: startHour, lte: endHour }, estado: { not: 'cancelado' } }
      });

      const limitePorHora = (config as any).pedidos_por_hora || 5;
      if (pedidosEnEsaHora >= limitePorHora) {
        throw new Error(`Lo sentimos, el horario de las ${horaLimpia} se acaba de llenar. Por favor elige otra hora.`);
      }
      // -------------------------------------------------------

      const nuevoPedido = await tx.pedidos.create({
        data: {
          usuario_id: usuario.id,
          nombre_contacto: data.nombre_contacto,
          telefono_contacto: data.telefono_contacto,
          fecha_pedido: ahoraBolivia, 
          fecha_entrega: fechaEntregaExacta,
          nombre_receptor: data.quien_recoge,
          total_pagar: data.total,
          estado: "pendiente"
        }
      });

      for (const item of data.items) {
        const idProducto = getValidId(item.productoId || item.id);
        await tx.detalle_pedidos.create({
          data: {
            pedido_id: nuevoPedido.id,
            ramo_id: item.tipo !== 'flor' ? idProducto : null,
            flor_id: item.tipo === 'flor' ? idProducto : null,
            cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio),
            subtotal: Number(item.precio) * Number(item.cantidad),
            personalizacion: item.personalizacion ? JSON.parse(JSON.stringify(item.personalizacion)) : undefined
          }
        });
      }

      const carrito = await tx.carrito.findFirst({ where: { usuario_id: usuario.id } });
      if (carrito) {
        await tx.carrito_detalle.deleteMany({ where: { carrito_id: carrito.id } });
      }

      return nuevoPedido;
    });

    revalidatePath("/mis-pedidos");
    return { success: true, orderId: pedido.id.toString() };

  } catch (error: any) {
    console.error("Error en createOrderAction:", error.message);
    return { success: false, message: error.message || "Error al procesar el pedido" };
  }
}

// --- NUEVA FUNCIÓN: Cancelar Pedido ---
export async function cancelOrderAction(orderId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false, message: "No autenticado" };

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) return { success: false, message: "Usuario no encontrado" };

    // Convertir ID de manera segura
    const id = getValidId(orderId);

    const pedido = await prisma.pedidos.findUnique({
      where: { id },
    });

    if (!pedido) return { success: false, message: "Pedido no encontrado" };

    // 1. Verificar propiedad
    if (pedido.usuario_id !== usuario.id) {
      return { success: false, message: "No tienes permiso para cancelar este pedido" };
    }

    // 2. Verificar estado (Solo se puede cancelar si es 'pendiente')
    if (pedido.estado !== 'pendiente') {
      return { success: false, message: "El pedido ya ha sido procesado y no se puede cancelar." };
    }

    // 3. Proceder a cancelar
    await prisma.pedidos.update({
      where: { id },
      data: { 
        estado: 'rechazado',
        fecha_rechazado: new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" })),
        motivo_rechazo: "Cancelado por el cliente"
      },
    });

    revalidatePath("/mis-pedidos");
    return { success: true, message: "Pedido cancelado correctamente" };

  } catch (error: any) {
    console.error("Error al cancelar pedido:", error);
    return { success: false, message: error.message || "Error al procesar la cancelación" };
  }
}