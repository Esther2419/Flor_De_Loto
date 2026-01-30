"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  const numericPart = stringId.match(/^\d+/)?.[0];
  if (!numericPart) throw new Error(`ID inválido: ${id}`);
  return BigInt(numericPart);
}

export async function createOrderAction(data: OrderData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { success: false, message: "No autenticado" };
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
  });

  if (!usuario) {
    return { success: false, message: "Usuario no encontrado" };
  }

  try {
    const pedido = await prisma.$transaction(async (tx) => {
      // 1. Configurar fecha exacta
      const fechaExacta = new Date(data.fecha_entrega);
      const [horas, minutos] = data.hora_recojo.split(':').map(Number);
      fechaExacta.setHours(horas, minutos, 0, 0);

      // 2. Crear cabecera del pedido
      const nuevoPedido = await tx.pedidos.create({
        data: {
          usuario_id: usuario.id,
          nombre_contacto: data.nombre_contacto,
          telefono_contacto: data.telefono_contacto,
          fecha_entrega: fechaExacta,
          nombre_receptor: data.quien_recoge,
          total_pagar: data.total,
          estado: "pendiente"
        }
      });

      // 3. Crear detalles (Mapeando correctamente Flor vs Ramo)
      for (const item of data.items) {
        // Detectamos tipo
        const esFlor = item.tipo === 'flor';
        const idProducto = getValidId(item.productoId || item.id);
        
        await tx.detalle_pedidos.create({
          data: {
            pedido_id: nuevoPedido.id,
            // Asignar al campo correcto según el tipo
            ramo_id: !esFlor ? idProducto : null,
            flor_id: esFlor ? idProducto : null,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: item.precio * item.cantidad,
            personalizacion: item.personalizacion ? JSON.parse(JSON.stringify(item.personalizacion)) : undefined
          }
        });
      }

      // 4. Limpiar carrito tras pedido exitoso
      const carrito = await tx.carrito.findFirst({ where: { usuario_id: usuario.id } });
      if (carrito) {
        await tx.carrito_detalle.deleteMany({ where: { carrito_id: carrito.id } });
      }

      return nuevoPedido;
    });

    return { success: true, orderId: pedido.id.toString() };

  } catch (error) {
    console.error("Error creando pedido:", error);
    return { success: false, message: "Error interno al procesar el pedido" };
  }
}