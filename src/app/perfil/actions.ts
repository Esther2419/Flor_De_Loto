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

// Acción para actualizar la contraseña corregida para tipos TS
export async function updatePasswordAction({ email, password }: { email: string, password: string }) {
  const session = await getServerSession(authOptions);
  
  // Verificación de seguridad: el email debe coincidir con la sesión activa
  if (!session?.user?.email || session.user.email !== email) {
    return { error: "No autorizado" };
  }

  try {
    const usuario = await prisma.usuarios.findUnique({
      where: { email: session.user.email },
    });

    if (!usuario) return { error: "Usuario no encontrado" };

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuarios.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Contraseña actualizada correctamente" };
  } catch (error) {
    console.error("Error en updatePasswordAction:", error);
    return { error: "Error al procesar la solicitud" };
  }
}