import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Buscar al usuario en la base de datos de "Flor de Loto"
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
    });

    // 2. Si el usuario no existe
    if (!usuario) {
      return NextResponse.json(
        { success: false, message: "El correo no está registrado" },
        { status: 401 }
      );
    }

    // 3. Verificar si la cuenta está activa
    if (!usuario.activo) {
      return NextResponse.json(
        { success: false, message: "Esta cuenta ha sido desactivada" },
        { status: 403 }
      );
    }

    // 4. Comparar la contraseña ingresada con la cifrada en la DB
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (passwordMatch) {
      // Aquí puedes devolver los datos básicos para la sesión
      return NextResponse.json({
        success: true,
        user: {
          id: usuario.id.toString(),
          nombre: usuario.nombre_completo,
          email: usuario.email,
          rol: usuario.rol,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Contraseña incorrecta" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}