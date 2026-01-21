"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getValidRamoId(id: string | number): bigint {
  const stringId = String(id);
  const numericPart = stringId.match(/^\d+/)?.[0];
  if (!numericPart) throw new Error(`ID de producto inválido: ${id}`);
  return BigInt(numericPart);
}

// Obtener el carrito del usuario
export async function getCartAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
  });

  if (!usuario) return null;

  const carrito = await prisma.carrito.findFirst({
    where: { usuario_id: usuario.id },
    include: {
      carrito_detalle: {
        include: {
          ramos: true
        }
      }
    }
  });

  if (!carrito) return [];

  // Mapeamos incluyendo la personalización y un ID único de base de datos si es necesario
  return carrito.carrito_detalle.map((detalle) => ({
    id: detalle.ramo_id.toString(),
    nombre: detalle.ramos.nombre,
    precio: Number(detalle.ramos.precio_base),
    foto: detalle.ramos.foto_principal,
    cantidad: detalle.cantidad,
    personalizacion: detalle.personalizacion
  }));
}

// Sincronizar carrito local con BD
export async function syncCartAction(localItems: any[]) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  if (!usuario) return;

  // Buscar o crear carrito
  let carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { usuario_id: usuario.id } });
  }

  // Insertar items locales uno por uno usando la lógica de addToCartAction
  for (const item of localItems) {
    await addToCartAction(item);
  }

  return getCartAction();
}

// Agregar item (con soporte para personalización)
export async function addToCartAction(item: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  if (!usuario) return;

  let carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { usuario_id: usuario.id } });
  }

  const ramoId = getValidRamoId(item.id);
  const personalizacionJson = item.personalizacion ? JSON.parse(JSON.stringify(item.personalizacion)) : null;

  // Buscamos si ya existe este ramo en el carrito
  const itemsExistentes = await prisma.carrito_detalle.findMany({
    where: { carrito_id: carrito.id, ramo_id: ramoId }
  });

  let itemEncontrado = null;

  // Verificamos si alguno tiene la misma personalización
  for (const existente of itemsExistentes) {
    const persExistente = JSON.stringify(existente.personalizacion);
    const persNueva = JSON.stringify(personalizacionJson);
    if (persExistente === persNueva) {
      itemEncontrado = existente;
      break;
    }
  }

  if (itemEncontrado) {
    // Si existe igual, sumamos cantidad
    await prisma.carrito_detalle.update({
      where: { id: itemEncontrado.id },
      data: { cantidad: itemEncontrado.cantidad + 1 }
    });
  } else {
    // Si es nuevo o tiene personalización distinta, creamos nueva línea
    await prisma.carrito_detalle.create({
      data: {
        carrito_id: carrito.id,
        ramo_id: ramoId,
        cantidad: item.cantidad || 1,
        personalizacion: personalizacionJson || undefined
      }
    });
  }
}

// Remover item
export async function removeFromCartAction(itemId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  if (!usuario) return;

  const carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) return;

  const ramoId = getValidRamoId(itemId);

  // Nota: Al borrar por ID de ramo, se borrarán todas las variantes de ese ramo.
  // Para borrar una variante específica necesitaríamos el ID de la fila (carrito_detalle.id).
  // Por seguridad y consistencia con el ID que recibe la función, borramos por ramo_id.
  await prisma.carrito_detalle.deleteMany({
    where: { 
      carrito_id: carrito.id, 
      ramo_id: ramoId 
    }
  });
}

export async function updateQuantityAction(itemId: string, delta: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  if (!usuario) return;

  const carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) return;

  const ramoId = getValidRamoId(itemId);

  const detalles = await prisma.carrito_detalle.findMany({
    where: { carrito_id: carrito.id, ramo_id: ramoId }
  });

  for (const detalle of detalles) {
    const nuevaCantidad = detalle.cantidad + delta;
    if (nuevaCantidad > 0) {
      await prisma.carrito_detalle.update({
        where: { id: detalle.id },
        data: { cantidad: nuevaCantidad }
      });
    }
  }
}