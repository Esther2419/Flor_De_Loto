import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/perfil");
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user?.email! }
  });

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-4 animate-in fade-in duration-700">
        <div className="text-center mb-12">
          <h1 className="font-serif italic text-4xl md:text-5xl text-gris mb-4">Mi Perfil</h1>
          <div className="w-20 h-1 bg-[#C5A059] mx-auto rounded-full" />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[#050505] p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-[#C5A059]/20 flex items-center justify-center border-2 border-[#C5A059] text-[#C5A059] mb-4">
              <User size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{usuario?.nombre_completo}</h2>
            <p className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.3em] mt-1">{usuario?.rol || "Cliente"}</p>
          </div>

          <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Mail size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Correo Electrónico</span>
              </div>
              <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">{usuario?.email}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Phone size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Celular / WhatsApp</span>
              </div>
              <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">
                {usuario?.celular || "No registrado"}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Calendar size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Miembro desde</span>
              </div>
              <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">
                {usuario?.fecha_registro 
                  ? format(new Date(usuario.fecha_registro), "MMMM yyyy", { locale: es }) 
                  : "Recientemente"}
              </p>
            </div>

            <div className="flex items-end">
              <button className="w-full bg-[#C5A059]/10 border border-[#C5A059] text-[#C5A059] py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-white transition-all">
                Editar Datos
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}