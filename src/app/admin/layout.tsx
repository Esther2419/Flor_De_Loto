import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PanelAdmin from "@/components/PanelAdmin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Si no hay sesión, PanelAdmin mostrará el login negro
  if (!session) {
    return <PanelAdmin>{children}</PanelAdmin>;
  }

  // CORRECCIÓN: Convertimos a minúsculas para que "Admin", "ADMIN" o "admin" funcionen
  const userRole = session.user.role?.toLowerCase();

  if (userRole !== "admin") {
    redirect("/");
  }

  return (
    <PanelAdmin>
      {children}
    </PanelAdmin>
  );
}