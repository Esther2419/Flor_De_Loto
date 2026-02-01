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

  if (session.user.rol !== "Admin") {
    redirect("/");
  }

  return (
    <PanelAdmin>
      {children}
    </PanelAdmin>
  );
}