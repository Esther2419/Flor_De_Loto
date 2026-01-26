import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import { getDetalleRamoConOpciones } from "@/app/actions/personalizacion";
import DetailClient from "./DetailClient";

export default async function DetallePage({ params }: { params: { type: string, id: string } }) {
  const { type, id } = params;
  const numericId = BigInt(id);

  let data: any = null;
  let opciones: any = null;

  if (type === 'ramo') {
    // Cargamos el ramo con sus flores y envolturas originales
    [data, opciones] = await Promise.all([
      prisma.ramos.findUnique({ 
        where: { id: numericId },
        include: {
          ramo_envolturas: { include: { envolturas: true } },
          ramo_detalle: { include: { flores: true } },
          categorias: true
        }
      }),
      getDetalleRamoConOpciones(id)
    ]);
  } else if (type === 'flor') {
    data = await prisma.flores.findUnique({ where: { id: numericId } });
  } else if (type === 'envoltura') {
    data = await prisma.envolturas.findUnique({ where: { id: numericId } });
  }

  if (!data) return notFound();

  // Serializamos los datos para el componente de cliente
  const serializedData = JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
  const serializedOpciones = opciones ? JSON.parse(JSON.stringify(opciones)) : null;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <DetailClient 
        data={serializedData} 
        type={type} 
        id={id} 
        opciones={serializedOpciones} 
      />
    </main>
  );
}