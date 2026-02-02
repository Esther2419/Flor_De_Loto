import prisma from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import { notFound } from "next/navigation";
import { getDetalleRamoConOpciones } from "@/app/actions/personalizacion";
import DetailClient from "./DetailClient";

export default async function DetallePage({ params }: { params: { type: string, id: string } }) {
  const { type, id } = params;
  
  // Validar que el ID sea un número válido antes de convertir
  if (!/^\d+$/.test(id)) return notFound();
  
  const numericId = BigInt(id);

  let data: any = null;
  let opciones: any = null;

  if (type === 'ramo') {
    // Para RAMOS: Carga normal (Ramo + Opciones)
    [data, opciones] = await Promise.all([
      prisma.ramos.findUnique({ 
        where: { id: numericId },
        include: {
          ramo_envolturas: { include: { envolturas: true } },
          ramo_detalle: { include: { flores: true } },
          categorias: true,
          ramo_imagenes: true
        }
      }),
      getDetalleRamoConOpciones(id)
    ]);
  } else if (type === 'flor') {
    // Para FLORES: Carga la flor Y TAMBIÉN el catálogo de opciones para personalizar
    const [florData, todasLasFlores, todasLasEnvolturas] = await Promise.all([
      prisma.flores.findUnique({ where: { id: numericId } }),
      prisma.flores.findMany({ where: { disponible: true }, orderBy: { nombre: 'asc' } }),
      prisma.envolturas.findMany({ where: { disponible: true }, orderBy: { nombre: 'asc' } })
    ]);
    
    data = florData;
    // Construimos manualmente las opciones para la flor
    opciones = {
      flores: todasLasFlores,
      envolturas: todasLasEnvolturas,
      idsOriginales: [] // Las flores sueltas empiezan sin envoltura
    };
  }

  if (!data) return notFound();

  // Función auxiliar para serializar BigInt
  const replacer = (key: string, value: any) => 
    typeof value === 'bigint' ? value.toString() : value;

  // Serializamos ambos objetos usando el replacer
  const serializedData = JSON.parse(JSON.stringify(data, replacer));
  
  // AQUÍ ESTABA EL ERROR: Ahora aplicamos el 'replacer' también a opciones
  const serializedOpciones = opciones ? JSON.parse(JSON.stringify(opciones, replacer)) : null;

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