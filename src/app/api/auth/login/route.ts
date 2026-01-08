import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const dbUser = "miguelangelmassigeronimo@gmail.com";
    const dbPass = "miguelmg365";

    if (email === dbUser && password === dbPass) {
      return NextResponse.json({ success: true, message: "Acceso concedido" });
    } else {
      return NextResponse.json(
        { success: false, message: "Credenciales incorrectas" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}