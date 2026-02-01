"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { isValidNumber } from "libphonenumber-js";
import bcrypt from "bcrypt";

// Acción para actualizar datos personales
export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("No autorizado");

  const nombre = formData.get("nombre") as string;
  const celular = formData.get("celular") as string;

  if (/[0-9]/.test(nombre)) {
    return { error: "El nombre no puede contener números." };
  }

  if (celular && !isValidNumber(celular)) {
    return { error: "El formato del número de celular es inválido." };
  }

  try {
    await prisma.usuarios.update({
      where: { email: session.user.email },
      data: {
        nombre_completo: nombre,
        celular: celular,
      },
    });

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    return { error: "Error al actualizar los datos." };
  }
}

// Acción para actualizar la contraseña (La que faltaba)
export async function updatePasswordAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "No autorizado" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Si tiene contraseña (no es solo Google), verificar la actual
    if (usuario.password && usuario.password !== "") {
      const isMatch = await bcrypt.compare(currentPassword, usuario.password);
      if (!isMatch) return { error: "La contraseña actual es incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return { success: "Contraseña actualizada correctamente" };
  } catch (error) {
    return { error: "Error al procesar la solicitud" };
  }
}