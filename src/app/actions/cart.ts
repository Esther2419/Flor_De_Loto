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
    
    let nombre = "Producto desconocido";
    let foto = null;
    let productoId = "";
    let precioBaseDB = 0;

    if (esFlor && detalle.flores) {
      nombre = detalle.flores.nombre;
      precioBaseDB = Number(detalle.flores.precio_unitario);
      foto = detalle.flores.foto;
      productoId = detalle.flores.id.toString();
    } else if (detalle.ramos) {
      nombre = detalle.ramos.nombre;
      precioBaseDB = Number(detalle.ramos.precio_base);
      foto = detalle.ramos.foto_principal || detalle.ramos.ramo_imagenes[0]?.url_foto;
      productoId = detalle.ramos.id.toString();
    }

    // RECUPERACIÓN: Leemos el precio y el estado de oferta desde el JSON de personalización
    const pers = detalle.personalizacion as any;
    
    return {
      id: detalle.id.toString(),
      productoId: productoId, 
      nombre: nombre,
      // Si guardamos el precio en la personalización lo usamos, si no, el de la DB
      precio: pers?.precioComprado || precioBaseDB, 
      precioOriginal: pers?.precioOriginal || precioBaseDB,
      esOferta: pers?.esOferta || false,
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

  let carrito = await prisma.carrito.findFirst({ where: { usuario_id: usuario.id } });
  if (!carrito) {
    carrito = await prisma.carrito.create({ data: { usuario_id: usuario.id } });
  }

  for (const item of localItems) {
    try {
      await addToCartAction(item);
    } catch (error) {
      // Si un item falla (ej: sin stock), lo ignoramos y seguimos con el resto
      console.warn(`Item ${item.nombre} no se pudo sincronizar:`, error);
    }
  }

  return getCartAction();
}

// ----------------------------------------------------------------------
// 3. Agregar item 
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

  // --- VALIDACIÓN DE STOCK Y DISPONIBILIDAD ---
  let productoDB: any = null;
  
  if (esFlor) {
    productoDB = await prisma.flores.findUnique({ where: { id: idProducto } });
    if (!productoDB) throw new Error("La flor seleccionada no existe.");
    if (!productoDB.disponible) throw new Error(`La flor "${productoDB.nombre}" ya no está disponible.`);
  } else {
    productoDB = await prisma.ramos.findUnique({ where: { id: idProducto } });
    if (!productoDB) throw new Error("El ramo seleccionado no existe.");
    if (!productoDB.activo) throw new Error(`El ramo "${productoDB.nombre}" ya no está activo.`);
  }

  // Si existe columna de stock, validamos (asumiendo que null = infinito)
  if (productoDB.stock !== null && productoDB.stock !== undefined) {
    // La validación final de cantidad total se hace más abajo, sumando lo que ya hay en el carrito
  }

  // GUARDADO: Metemos el precio de oferta y el flag dentro del JSON de personalización
  const personalizacionJson = {
    ...(item.personalizacion || {}),
    esOferta: item.esOferta || false,
    precioOriginal: item.precioOriginal || item.precio,
    precioComprado: item.precio // Este es el valor de oferta (Bs. 20)
  };

  const itemsExistentes = await prisma.carrito_detalle.findMany({
    where: { 
      carrito_id: carrito.id, 
      ramo_id: !esFlor ? idProducto : undefined, 
      flor_id: esFlor ? idProducto : undefined
    }
  });

  let itemEncontrado = null;
  const persNuevaStr = JSON.stringify(personalizacionJson);

  for (const existente of itemsExistentes) {
    if (JSON.stringify(existente.personalizacion) === persNuevaStr) {
      itemEncontrado = existente;
      break;
    }
  }

  if (itemEncontrado) {
    const nuevaCantidad = itemEncontrado.cantidad + (item.cantidad || 1);
    
    // Validar stock acumulado
    if (productoDB.stock !== null && productoDB.stock !== undefined) {
      if (nuevaCantidad > productoDB.stock) {
        throw new Error(`Stock insuficiente. Máximo disponible: ${productoDB.stock}`);
      }
    }

    await prisma.carrito_detalle.update({
      where: { id: itemEncontrado.id },
      data: { cantidad: nuevaCantidad }
    });
  } else {
    await prisma.carrito_detalle.create({
      data: {
        carrito_id: carrito.id,
        ramo_id: !esFlor ? idProducto : undefined,
        flor_id: esFlor ? idProducto : undefined,
        cantidad: item.cantidad || 1,
        // Eliminado el campo 'precio' ya que no existe en tu tabla
        personalizacion: personalizacionJson,
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
      where: { id: BigInt(itemId) },
      include: { flores: true, ramos: true } // Incluimos relación para ver stock
    });

    if (detalle) {
      const nuevaCantidad = detalle.cantidad + delta;
      if (nuevaCantidad > 0) {
        
        // VALIDACIÓN DE STOCK AL ACTUALIZAR
        const producto = detalle.flores || detalle.ramos;
        if (producto) {
          const stock = (producto as any).stock;
          if (stock !== null && stock !== undefined) {
            if (nuevaCantidad > stock) {
              throw new Error(`No puedes agregar más. Stock máximo: ${stock}`);
            }
          }
        }

        await prisma.carrito_detalle.update({
          where: { id: detalle.id },
          data: { cantidad: nuevaCantidad }
        });
      }
    }
    revalidatePath("/");
  } catch (error) {
    console.error("Error actualizando cantidad:", error);
    throw error; // Re-lanzamos el error para que el cliente (CartContext) lo capture y haga rollback
  }
}