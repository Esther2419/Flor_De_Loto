import { Suspense } from "react";
import PanelAdmin from "../../components/PanelAdmin";

function AdminLoading() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-[#C5A059] font-serif italic text-xl animate-pulse">
        Cargando Panel...
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <PanelAdmin>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjetas de Dashboard */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Ventas Totales</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">Bs 1,250.00</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Pedidos Pendientes</h3>
            <p className="text-2xl font-bold text-[#C5A059] mt-2">4</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Ramos Activos</h3>
            <p className="text-2xl font-bold text-gray-800 mt-2">12</p>
          </div>
        </div>
      </PanelAdmin>
    </Suspense>
  );
}