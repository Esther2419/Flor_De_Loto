import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const { type, id } = params;
    const numericId = BigInt(id);
    let data = null;

    if (type === 'ramo') {
      data = await prisma.ramos.findUnique({
        where: { id: numericId },
        include: {
          ramo_detalle: { include: { flores: true } },
          ramo_envolturas: { include: { envolturas: true } }
        }
      });
    } else if (type === 'flor') {
      data = await prisma.flores.findUnique({ where: { id: numericId } });
    } else if (type === 'envoltura') {
      data = await prisma.envolturas.findUnique({ where: { id: numericId } });
    }

    if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Serialización para BigInt
    return NextResponse.json(JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )));
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}