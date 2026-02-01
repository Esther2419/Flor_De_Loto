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

export async function createOrderAction(data: OrderData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { success: false, message: "No autenticado" };

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
  });

  if (!usuario) return { success: false, message: "Usuario no encontrado" };

  try {
    const ahoraBolivia = new Date(new Date().toLocaleString("en-US", { timeZone: "America/La_Paz" }));
    const minutosAhora = ahoraBolivia.getHours() * 60 + ahoraBolivia.getMinutes();

    const pedido = await prisma.$transaction(async (tx) => {
      const config = await tx.configuracion.findUnique({ where: { id: 1 } });
      
      if (!config || !config.horario_apertura || !config.horario_cierre) {
        throw new Error("Configuración de horarios no disponible.");
      }

      if (!config.tienda_abierta || (config as any).cierre_temporal) {
        throw new Error("La tienda se encuentra cerrada actualmente.");
      }

      const bufferMinutos = Number((config as any).minutos_preparacion) || 120;
      
      // --- CORRECCIÓN PARA "INVALID DATE" ---
      // Limpiamos posibles espacios y aseguramos formato YYYY-MM-DDTHH:mm:00-04:00
      const fechaLimpia = data.fecha_entrega.trim();
      const horaLimpia = data.hora_recojo.trim();
      
      const fechaString = `${fechaLimpia}T${horaLimpia}:00-04:00`;
      const fechaEntregaExacta = new Date(fechaString);

      // Verificamos si la fecha es válida antes de seguir
      if (isNaN(fechaEntregaExacta.getTime())) {
        throw new Error(`Formato de fecha u hora inválido: ${fechaString}`);
      }
      // ---------------------------------------

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