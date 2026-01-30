"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Función auxiliar para validar IDs
function getValidId(id: string | number): bigint {
  const stringId = String(id);
  const numericPart = stringId.match(/^\d+/)?.[0];
  if (!numericPart) throw new Error(`ID inválido: ${id}`);
  return BigInt(numericPart);
}

// ----------------------------------------------------------------------
// 1. Obtener el carrito del usuario
// ----------------------------------------------------------------------
export async function getCartAction() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return [];

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
  });

  if (!usuario) return [];

  const carrito = await prisma.carrito.findFirst({
    where: { usuario_id: usuario.id },
    include: {
      carrito_detalle: {
        include: {
          ramos: { include: { ramo_imagenes: true } },
          flores: true,
          envolturas: true
        }
      }
    }
  });

  if (!carrito) return [];

  return carrito.carrito_detalle.map((detalle) => {
    const esFlor = !!detalle.flores;
    
    // Recuperar datos según el tipo
    let nombre = "Producto desconocido";
    let precio = 0;
    let foto = null;
    let productoId = "";

    if (esFlor && detalle.flores) {
      nombre = detalle.flores.nombre;
      precio = Number(detalle.flores.precio_unitario);
      foto = detalle.flores.foto;
      productoId = detalle.flores.id.toString();
    } else if (detalle.ramos) {
      nombre = detalle.ramos.nombre;
      precio = Number(detalle.ramos.precio_base);
      foto = detalle.ramos.foto_principal || detalle.ramos.ramo_imagenes[0]?.url_foto;
      productoId = detalle.ramos.id.toString();
    }

    return {
      id: detalle.id.toString(),
      productoId: productoId, 
      nombre: nombre,
      precio: precio,
      foto: foto,
      cantidad: detalle.cantidad,
      tipo: esFlor ? 'flor' : 'ramo',
      personalizacion: detalle.personalizacion ? JSON.parse(JSON.stringify(detalle.personalizacion)) : undefined
    };
  });
}

// ----------------------------------------------------------------------
// 2. Sincronizar carrito local
// ----------------------------------------------------------------------
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

  for (const item of localItems) {
    await addToCartAction(item);
  }

  return getCartAction();
}

// ----------------------------------------------------------------------
// 3. Agregar item (CORREGIDO CON UNDEFINED)
// ----------------------------------------------------------------------
export async function addToCartAction(item: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  const usuario = await prisma.usuarios.findUnique({ where: { email: session.user.email } });
  if (!usuario) return;

  let carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { usuario_id: usuario.id } });
  }

  const idProducto = getValidId(item.productoId || item.id);
  const esFlor = item.tipo === 'flor';
  const personalizacionJson = item.personalizacion ? JSON.parse(JSON.stringify(item.personalizacion)) : null;

  const itemsExistentes = await prisma.carrito_detalle.findMany({
    where: { 
      carrito_id: carrito.id, 
      ramo_id: !esFlor ? idProducto : null as any, 
      flor_id: esFlor ? idProducto : null as any
    }
  });

  let itemEncontrado = null;

  for (const existente of itemsExistentes) {
    const persExistente = JSON.stringify(existente.personalizacion);
    const persNueva = JSON.stringify(personalizacionJson);
    
    if ((!existente.personalizacion && !personalizacionJson) || persExistente === persNueva) {
      itemEncontrado = existente;
      break;
    }
  }

  if (itemEncontrado) {
    await prisma.carrito_detalle.update({
      where: { id: itemEncontrado.id },
      data: { cantidad: itemEncontrado.cantidad + (item.cantidad || 1) }
    });
  } else {

    await prisma.carrito_detalle.create({
      data: {
        carrito_id: carrito.id,
        ramo_id: !esFlor ? idProducto : undefined,
        flor_id: esFlor ? idProducto : undefined,
        cantidad: item.cantidad || 1,
        personalizacion: personalizacionJson || undefined,
        envoltura_id: undefined
      }
    });
  }
  
  revalidatePath("/");
}

// ----------------------------------------------------------------------
// 4. Remover item
// ----------------------------------------------------------------------
export async function removeFromCartAction(itemId: string) {
  try {
    await prisma.carrito_detalle.delete({
      where: { id: BigInt(itemId) }
    });
    revalidatePath("/");
  } catch (error) {
    console.error("Error al eliminar item:", error);
  }
}

// ----------------------------------------------------------------------
// 5. Actualizar cantidad
// ----------------------------------------------------------------------
export async function updateQuantityAction(itemId: string, delta: number) {
  try {
    const detalle = await prisma.carrito_detalle.findUnique({
      where: { id: BigInt(itemId) }
    });

    if (detalle) {
      const nuevaCantidad = detalle.cantidad + delta;
      if (nuevaCantidad > 0) {
        await prisma.carrito_detalle.update({
          where: { id: detalle.id },
          data: { cantidad: nuevaCantidad }
        });
      }
    }
    revalidatePath("/");
  } catch (error) {
    console.error("Error actualizando cantidad:", error);
  }
}