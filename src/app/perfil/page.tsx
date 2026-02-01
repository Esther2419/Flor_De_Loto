import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Calendar, ShieldCheck, Lock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PasswordForm from "@/components/PasswordForm";
import ProfileClientContainer from "./ProfileClientContainer";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/perfil");
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user?.email! }
  });

  const hasPassword = !!usuario?.password && usuario.password !== "";

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="max-w-5xl mx-auto pt-32 pb-20 px-4 animate-in fade-in duration-700">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
          
          <ProfileClientContainer 
            usuario={{
                nombre: usuario?.nombre_completo || "",
                rol: usuario?.rol || "Cliente",
                email: usuario?.email || "",
                celular: usuario?.celular || ""
            }}
          >
            {/* CONTENIDO DERECHO: SEGURIDAD Y ESTADO */}
            <div className="space-y-10">
                <h3 className="text-xl font-serif italic text-gris border-b border-gray-100 pb-4 flex items-center gap-2">
                    <Lock size={18} className="text-[#C5A059]" /> Seguridad de Cuenta
                </h3>

                <div className="space-y-6">
                    <PasswordForm email={usuario?.email!} hasPassword={hasPassword} />
                    
                    <div className="pt-4 space-y-4">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Miembro desde</span>
                        </div>
                        <p className="text-gris font-medium text-lg border-b border-gray-50 pb-2">
                            {usuario?.fecha_registro 
                            ? format(new Date(usuario.fecha_registro), "MMMM yyyy", { locale: es }) 
                            : "Recientemente"}
                        </p>

                        <div className="flex items-center gap-4 bg-green-50/50 p-5 rounded-[1.5rem] border border-green-100/50">
                            <div className="bg-green-100 p-2 rounded-full">
                                <ShieldCheck className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-green-700 tracking-wider leading-none mb-1">Cuenta Verificada</p>
                                <p className="text-[11px] text-green-600/70">Tu acceso está protegido y activo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </ProfileClientContainer>

        </div>
      </main>
    </div>
  );
}