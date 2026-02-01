import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { isValidNumber } from "libphonenumber-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, nombre, nombre_completo, celular, rol } = body;
    
    // Priorizamos nombre_completo que es el que enviamos desde el panel de usuarios
    const nombreFinal = nombre_completo || nombre;

    // 1. Validar Contraseña Segura (Incluye el punto '.' en la validación)
    // Explicación del Regex: 
    // Mínimo 8 caracteres, al menos una minuscula, una mayúscula, un número y un símbolo del grupo [@$!%*?&.]
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, números y símbolos (ej: @ o .)." }, 
        { status: 400 }
      );
    }

    // 2. Validar que el nombre no contenga números
    if (!nombreFinal || /[0-9]/.test(nombreFinal)) {
      return NextResponse.json(
        { error: "El nombre es obligatorio y no puede contener números." }, 
        { status: 400 }
      );
    }

    // 3. Validar número de celular internacional (Requiere prefijo ej: +591)
    if (!celular || !isValidNumber(celular)) {
      return NextResponse.json(
        { error: "El formato del celular es inválido. Asegúrese de seleccionar el país correcto." }, 
        { status: 400 }
      );
    }

    // 4. Verificar duplicados
    const existe = await prisma.usuarios.findUnique({ where: { email } });
    if (existe) {
      return NextResponse.json(
        { error: "Este correo electrónico ya está registrado." }, 
        { status: 400 }
      );
    }

    // 5. Encriptación
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Creación en Base de Datos
    await prisma.usuarios.create({
      data: {
        email,
        nombre_completo: nombreFinal,
        password: hashedPassword,
        celular: celular,
        // Si el rol viene del panel de control lo usa, si es registro público usa "cliente"
        rol: rol || "cliente", 
        activo: true
      },
    });

    return NextResponse.json({ message: "Usuario creado con éxito" }, { status: 201 });

  } catch (error) {
    console.error("Error crítico en API registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la solicitud." }, 
      { status: 500 }
    );
  }
}