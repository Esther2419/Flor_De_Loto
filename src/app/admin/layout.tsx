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


  const esAdmin = 
    session?.user?.rol === "admin" || 
    session?.user?.email === "miguelangelmassigeronimo@gmail.com";

  if (!session) {
    redirect("/login");
  }

  if (!esAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <PanelAdmin />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}