import PanelAdmin from "@/components/PanelAdmin";
import { Suspense } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <PanelAdmin>
        {children}
      </PanelAdmin>
    </Suspense>
  );
}