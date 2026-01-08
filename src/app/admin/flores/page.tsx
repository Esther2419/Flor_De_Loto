"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { getSession } from "next-auth/react";
import { createFlor, getFlores, deleteFlor, updateFlor } from "./actions";

type Flor = {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  foto: string;
  precio_unitario: number;
  cantidad: number;
  disponible: boolean;
};

const getColorStyle = (nombreColor: string) => {
  if (!nombreColor) return '#ccc';
  if (nombreColor.startsWith('#')) return nombreColor;

  const colores: { [key: string]: string } = {
    'rojo': '#EF4444', 'red': '#EF4444',
    'azul': '#3B82F6', 'blue': '#3B82F6',
    'verde': '#10B981', 'green': '#10B981',
    'amarillo': '#e8cf2bff', 'yellow': '#e8cf2bff',
    'rosa': '#EC4899', 'pink': '#EC4899',
    'blanco': '#FFFFFF', 'white': '#FFFFFF',
    'negro': '#000000', 'black': '#000000',
    'morado': '#8B5CF6', 'purple': '#8B5CF6',
    'naranja': '#F97316', 'orange': '#F97316',
    'lila': '#C4B5FD',
    'crema': '#F9F6EE',
    'dorado': '#C5A059'
  };

  const key = nombreColor.toLowerCase().split(' ')[0];
  return colores[key] || '#C5A059';
};

export default function FloresAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [currentUser, setCurrentUser] = useState("");
  
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    color: "",
    precio: "",
    cantidad: "",
    foto: "",
    disponible: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeTab === "ver") loadFlores();
  }, [activeTab]);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user?.email) {
        setCurrentUser(session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    const qty = parseInt(formData.cantidad) || 0;
    if (qty === 0) {

      setFormData(prev => ({ ...prev, disponible: false }));
    }
  }, [formData.cantidad]);

  const loadFlores = async () => {
    setLoading(true);
    const data = await getFlores();
    setFlores(data);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('flores').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('flores').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, foto: data.publicUrl }));
    } catch (error) {
      console.error(error);
      alert("Error al subir imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === "editar" && formData.id) {
        await updateFlor(formData.id, formData, currentUser);
        alert("¡Inventario actualizado!");
    } else {
        await createFlor(formData, currentUser);
        alert("¡Flor registrada!");
    }

    setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true });
    setActiveTab("ver");
    loadFlores();
    setLoading(false);
  };

  const handleEditClick = (flor: Flor) => {
    setFormData({
        id: flor.id,
        nombre: flor.nombre,
        descripcion: flor.descripcion || "",
        color: flor.color || "",
        precio: flor.precio_unitario.toString(),
        cantidad: flor.cantidad ? flor.cantidad.toString() : "0",
        foto: flor.foto || "",
        disponible: flor.disponible
    });
    setActiveTab("editar");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar permanentemente?")) {
        await deleteFlor(id);
        loadFlores();
    }
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#0A0A0A] pb-20">
      <nav className="bg-[#0A0A0A] text-white p-4 border-b border-[#C5A059] flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#C5A059] hover:text-white transition-colors flex items-center text-xs uppercase tracking-widest">
            ← Volver al Panel
          </Link>
          <div className="h-4 w-px bg-[#C5A059]/30"></div>
          <h1 className="font-serif text-lg italic text-white">Administración de Flores</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        
        <div className="mb-8 text-center">
          <h2 className="font-serif text-4xl text-[#0A0A0A] mb-2">Gestión de Catálogo</h2>
          <p className="text-gray-500 font-light text-sm">Control de stock, precios y disponibilidad.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
          <button onClick={() => setActiveTab("ver")} className={`p-4 rounded-xl border transition-all ${activeTab === "ver" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">📋 Ver Inventario</span>
          </button>
          <button onClick={() => { setActiveTab("crear"); setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true }); }} 
            className={`p-4 rounded-xl border transition-all ${activeTab === "crear" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">✨ Añadir Flor</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#C5A059]/10 p-8 min-h-[500px]">
          
          {(activeTab === "crear" || activeTab === "editar") && (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="font-serif text-2xl text-[#0A0A0A] mb-6 text-center border-b border-[#C5A059]/20 pb-4">
                 {activeTab === "crear" ? "Registrar Nueva Variedad" : "Editar Datos de la Flor"}
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* FOTO */}
                 <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-[#C5A059]/30 rounded-xl p-8 bg-[#F9F6EE] hover:bg-white transition-colors cursor-pointer relative group">
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" />
                    {uploading ? (
                        <span className="text-xs font-bold text-[#C5A059] animate-pulse">Subiendo...</span>
                    ) : formData.foto ? (
                        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image src={formData.foto} alt="Preview" fill className="object-cover" />
                        </div>
                    ) : (
                        <div className="text-center">
                            <span className="text-4xl mb-2 block">📷</span>
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Subir Foto</span>
                        </div>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059]" placeholder="Nombre de la flor" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color</label>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059]" placeholder="Ej: Rojo, Amarillo." />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio (Bs)</label>
                    <input 
                      required 
                      type="number" 
                      step="0.5" 
                      value={formData.precio} 
                      onChange={e => setFormData({...formData, precio: e.target.value})} 
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059]" 
                      placeholder="0.00" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cantidad (Stock)</label>
                    <input 
                      required 
                      type="number" 
                      value={formData.cantidad} 
                      onChange={e => setFormData({...formData, cantidad: e.target.value})} 
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059]" 
                      placeholder="0" 
                    />
                 </div>

                 <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059]" rows={3} placeholder="Detalles..." />
                 </div>

                 {activeTab === "editar" && (
                   <div className={`col-span-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-[#0A0A0A]">Disponibilidad</span>
                       <span className="text-xs text-gray-400">
                         {isStockZero 
                           ? "Desactivado automáticamente por falta de stock." 
                           : "¿Visible para ventas?"}
                       </span>
                     </div>
                     <label className={`relative inline-flex items-center ${isStockZero ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                       <input 
                         type="checkbox" 
                         checked={formData.disponible} 
                         onChange={e => setFormData({...formData, disponible: e.target.checked})} 
                         disabled={isStockZero}
                         className="sr-only peer" 
                       />
                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                     </label>
                   </div>
                 )}
               </div>

               <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all mt-4 disabled:opacity-50">
                 {loading ? "Guardando..." : "Guardar Cambios"}
               </button>
            </form>
          )}

          {activeTab === "ver" && (
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 animate-in fade-in">
                {flores.map((flor) => (
                    <div key={flor.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group relative ${!flor.disponible ? 'border-red-100 opacity-80' : 'border-gray-100'}`}>
                        
                        <div className="absolute top-1 left-1 md:top-3 md:left-3 z-10 flex flex-col gap-1">
                            <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm ${flor.cantidad > 0 ? 'bg-white/90 text-[#0A0A0A]' : 'bg-red-500 text-white'}`}>
                                Stock: {flor.cantidad}
                            </span>
                        </div>

                        <div className="relative h-24 md:h-48 bg-gray-100">
                            {flor.foto ? (
                                <Image src={flor.foto} alt={flor.nombre} fill className={`object-cover ${!flor.disponible ? 'grayscale' : ''}`} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-xl md:text-3xl opacity-20">🌸</div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(flor)} className="bg-white p-1.5 md:p-3 rounded-full hover:bg-[#C5A059] hover:text-white transition-colors shadow-lg" title="Editar">✏️</button>
                                <button onClick={() => handleDelete(flor.id)} className="bg-white p-1.5 md:p-3 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-lg" title="Eliminar">🗑️</button>
                            </div>

                            <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-10">
                                {flor.disponible ? (
                                    <span className="bg-[#25D366]/90 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm">
                                        <span className="md:hidden">Disp.</span><span className="hidden md:inline">Disponible</span>
                                    </span>
                                ) : (
                                    <span className="bg-red-500/90 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm">
                                        <span className="md:hidden">No Disp.</span><span className="hidden md:inline">No Disponible</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-2 md:p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-1 md:mb-2 gap-0.5 md:gap-0">
                                <h3 className="font-serif font-bold text-[10px] md:text-lg text-[#0A0A0A] leading-tight line-clamp-1">{flor.nombre}</h3>
                                <span className="text-[#C5A059] font-bold text-[9px] md:text-sm bg-[#F9F6EE] px-1.5 py-0.5 md:px-2 md:py-1 rounded whitespace-nowrap">Bs {flor.precio_unitario}</span>
                            </div>
                            
                            <p className="text-[9px] md:text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                {flor.descripcion || "Sin descripción detallada."}
                            </p>

                            <div className="flex items-center gap-1 md:gap-2 pt-1 md:pt-2 border-t border-gray-100">
                                <div 
                                  className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-gray-200 shadow-sm"
                                  style={{ backgroundColor: getColorStyle(flor.color) }}
                                ></div>
                                <span className="text-[8px] md:text-[10px] text-gray-400 uppercase tracking-wider font-bold truncate">
                                  {flor.color || "Sin color"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}