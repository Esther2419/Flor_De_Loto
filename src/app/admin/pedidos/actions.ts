"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function gestionarEstadoPedido(pedidoId: string, nuevoEstado: string, observacion?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { success: false, message: "No autorizado" };

  const adminId = BigInt(session.user.id);
  const idPedido = BigInt(pedidoId);
  const ahora = new Date();

  try {
    const pedidoActual = await prisma.pedidos.findUnique({ 
        where: { id: idPedido },
        include: { usuarios_pedidos_aceptado_por_idTousuarios: true }
    });
    
    if (!pedidoActual) throw new Error("Pedido no encontrado");

    let observacionFinal = observacion || `Estado cambiado a ${nuevoEstado}`;
    const dataUpdate: any = { estado: nuevoEstado };
    
    // Lógica de Emergencia: Si ya estaba aceptado y otro admin lo toma
    if (nuevoEstado === 'aceptado') {
      if (pedidoActual.estado === 'aceptado' && pedidoActual.aceptado_por_id !== adminId) {
        observacionFinal = `🚨 EMERGENCIA: El admin ${session.user.name} tomó el relevo del pedido.`;
      }
      dataUpdate.aceptado_por_id = adminId;
      dataUpdate.fecha_aceptado = ahora;
    } else if (nuevoEstado === 'terminado') {
      dataUpdate.terminado_por_id = adminId;
      dataUpdate.fecha_terminado = ahora;
    } else if (nuevoEstado === 'entregado') {
      dataUpdate.entregado_por_id = adminId;
      dataUpdate.fecha_entregado = ahora;
    } else if (nuevoEstado === 'rechazado') {
      dataUpdate.rechazado_por_id = adminId;
      dataUpdate.fecha_rechazado = ahora;
      dataUpdate.motivo_rechazo = observacion;
    }

    await prisma.$transaction([
      prisma.pedidos.update({
        where: { id: idPedido },
        data: dataUpdate
      }),
      prisma.pedidos_historial.create({
        data: {
          pedido_id: idPedido,
          usuario_id: adminId,
          estado_anterior: pedidoActual.estado,
          estado_nuevo: nuevoEstado,
          observacion: observacionFinal
        }
      })
    ]);

    revalidatePath(`/admin/pedidos/${pedidoId}`);
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}