export default function AdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Resumen del Negocio</h2>
          <p className="text-sm text-gray-500">Vista general del estado de Flor de Loto hoy.</p>
        </div>
        <div className="text-xs font-medium text-gray-400 uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          Actualizado: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Ventas Totales</h3>
            <span className="text-green-500 bg-green-50 text-[10px] px-2 py-1 rounded-full font-bold">+12%</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">Bs 1,250.00</p>
          <div className="w-full h-1.5 bg-gray-50 rounded-full mt-4 overflow-hidden">
            <div className="bg-[#C5A059] h-full w-[70%] rounded-full" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Pedidos Pendientes</h3>
            <span className="text-amber-500 bg-amber-50 text-[10px] px-2 py-1 rounded-full font-bold">Urgente</span>
          </div>
          <p className="text-3xl font-bold text-[#C5A059]">4</p>
          <p className="text-[11px] text-gray-400 mt-4 italic">2 requieren entrega inmediata</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">Ramos Activos</h3>
            <span className="text-gray-400 bg-gray-50 text-[10px] px-2 py-1 rounded-full font-bold">Catálogo</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">12</p>
          <p className="text-[11px] text-gray-400 mt-4 italic">Mostrados en la página principal</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-serif italic text-lg text-gray-700">Avisos del Sistema</h3>
        </div>
        <div className="p-8 text-center">
          <div className="max-w-xs mx-auto">
            <p className="text-sm text-gray-400 italic">
              "El éxito no es la clave de la felicidad. La felicidad es la clave del éxito. Si amas lo que haces, tendrás éxito."
            </p>
            <div className="w-8 h-0.5 bg-[#C5A059]/30 mx-auto mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}