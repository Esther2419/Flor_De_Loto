"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

export async function updatePasswordAction(email: string, newPassword: string) {
  try {
    // Hashear la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.usuarios.update({
      where: { email },
      data: { password: hashedPassword }
    });

    revalidatePath("/perfil");
    return { success: true, message: "Contraseña actualizada correctamente" };
  } catch (error) {
    console.error("Error al actualizar contraseña:", error);
    return { success: false, message: "No se pudo actualizar la contraseña" };
  }
}