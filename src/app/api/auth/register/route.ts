import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { email, password, nombre } = await req.json();

    const existe = await prisma.usuarios.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        email,
        nombre_completo: nombre,
        password: hashedPassword,
        rol: "cliente",
      },
    });

    return NextResponse.json({ message: "Usuario creado con éxito" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}