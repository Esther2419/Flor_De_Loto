import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelAdmin from "@/components/PanelAdmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const rolUsuario = session.user.rol?.toLowerCase();

  const tienePermisoAdmin = rolUsuario === "admin" || rolUsuario === "adminmenor";

  if (!tienePermisoAdmin) {
    redirect("/");
  }

  return (
    <PanelAdmin>
      {children}
    </PanelAdmin>
  );
}