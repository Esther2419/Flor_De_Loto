import { Suspense } from "react";
import PanelAdmin from "../../components/PanelAdmin";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#C5A059]">Cargando panel...</div>}>
      <PanelAdmin />
    </Suspense>
  );
}