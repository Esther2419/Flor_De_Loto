import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ReservaClient from "./ReservaClient";

export default async function ReservarPage() {

  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    redirect("/login?callbackUrl=/reservar");
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user.email },
    select: {
      nombre_completo: true,
      celular: true,
      email: true
    }
  });

  const userData = {
    nombre: usuario?.nombre_completo || session.user.name || "Cliente",
    celular: usuario?.celular || "",
    email: usuario?.email || session.user.email || ""
  };

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <ReservaClient userData={userData} />
      </main>
    </div>
  );
}