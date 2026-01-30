import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { isValidNumber } from "libphonenumber-js";

export async function POST(req: Request) {
  try {
    const { email, password, nombre, celular } = await req.json();

    // 1. Validar Contraseña Segura
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ error: "La contraseña no es lo suficientemente segura." }, { status: 400 });
    }

    // 2. Validar que el nombre no contenga números
    if (/[0-9]/.test(nombre)) {
      return NextResponse.json({ error: "El nombre no puede contener números." }, { status: 400 });
    }

    // 3. Validar número de celular internacional
    if (!isValidNumber(celular)) {
      return NextResponse.json({ error: "El formato del número de celular es inválido." }, { status: 400 });
    }

    const existe = await prisma.usuarios.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.usuarios.create({
      data: {
        email,
        nombre_completo: nombre,
        password: hashedPassword,
        celular: celular,
        rol: "cliente",
      },
    });

    return NextResponse.json({ message: "Usuario creado con éxito" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}