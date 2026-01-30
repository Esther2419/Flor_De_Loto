import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { User, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PasswordForm from "@/components/PasswordForm";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/perfil");
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { email: session.user?.email! }
  });

  // Verificar si ya tiene contraseña (si ingresó por Google, suele estar vacío o ser un hash especial)
  // En tu lógica de auth.ts, los de Google se crean con password: ""
  const hasPassword = !!usuario?.password && usuario.password !== "";

  return (
    <div className="min-h-screen bg-crema">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-32 pb-20 px-4 animate-in fade-in duration-700">
        {/* ... (Cabecera se mantiene igual) */}

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-[#050505] p-8 flex flex-col items-center text-center">
            {/* ... (Avatar y nombre se mantienen igual) */}
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{usuario?.nombre_completo}</h2>
            <p className="text-[#C5A059] text-xs font-bold uppercase tracking-[0.3em] mt-1">{usuario?.rol || "Cliente"}</p>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Información Personal */}
              <div className="space-y-8">
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
              </div>

              {/* Seguridad y Fechas */}
              <div className="space-y-8">
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

                <div className="flex items-center gap-2 bg-green-50 p-4 rounded-2xl border border-green-100">
                  <ShieldCheck className="text-green-600" size={20} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-green-700 tracking-wider">Estado de cuenta</p>
                    <p className="text-xs text-green-600/80">Verificada y activa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nueva Sección de Contraseña */}
            <div className="mt-12 pt-8 border-t border-gray-100">
               <div className="max-w-md">
                 <h3 className="text-xl font-serif italic text-gris mb-2">Seguridad de la cuenta</h3>
                 <p className="text-sm text-gray-400 mb-6">
                   {hasPassword 
                    ? "Actualiza tu contraseña regularmente para mantener tu cuenta protegida." 
                    : "Como ingresaste con Google, te recomendamos establecer una contraseña para el acceso local."}
                 </p>
                 <PasswordForm email={usuario?.email!} hasPassword={hasPassword} />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}