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

// 1. Botones de colores primarios solicitados por el usuario
const PRIMARY_PRESETS = [
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Amarillo', hex: '#E8CF2B' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Lila', hex: '#C4B5FD' },
  { name: 'Rosado', hex: '#EC4899' },
  { name: 'Violeta', hex: '#8B5CF6' },
];

// 2. Lista extendida para la DETECCIÓN inteligente (incluye Negro, Marrón, etc.)
const COLOR_DETECTION_REF = [
  ...PRIMARY_PRESETS,
  { name: 'Negro', hex: '#000000' },
  { name: 'Marrón', hex: '#5D4037' },
  { name: 'Gris', hex: '#808080' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Verde', hex: '#10B981' },
];

const getNameFromHex = (hex: string) => {
  if (!hex || !hex.startsWith('#')) return hex || "Sin color";
  
  const r1 = parseInt(hex.slice(1, 3), 16);
  const g1 = parseInt(hex.slice(3, 5), 16);
  const b1 = parseInt(hex.slice(5, 7), 16);

  let nearest = COLOR_DETECTION_REF[0];
  let minDistance = Infinity;

  COLOR_DETECTION_REF.forEach(color => {
    const r2 = parseInt(color.hex.slice(1, 3), 16);
    const g2 = parseInt(color.hex.slice(3, 5), 16);
    const b2 = parseInt(color.hex.slice(5, 7), 16);
    
    // Fórmula de distancia de color
    const dist = Math.sqrt(Math.pow(r1-r2, 2) + Math.pow(g1-g2, 2) + Math.pow(b1-b2, 2));
    if (dist < minDistance) {
      minDistance = dist;
      nearest = color;
    }
  });

  return nearest.name;
};

const getColorStyle = (nombreColor: string) => {
  if (!nombreColor) return '#ccc';
  const match = COLOR_DETECTION_REF.find(c => c.name.toLowerCase() === nombreColor.toLowerCase());
  if (match) return match.hex;
  return nombreColor.startsWith('#') ? nombreColor : '#C5A059';
};

export default function FloresAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [selectedFlor, setSelectedFlor] = useState<Flor | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [formData, setFormData] = useState({
    id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (activeTab === "ver") loadFlores(); }, [activeTab]);

  useEffect(() => {
    getSession().then((session) => { if (session?.user?.email) setCurrentUser(session.user.email); });
  }, []);

  useEffect(() => {
    const qty = parseInt(formData.cantidad) || 0;
    if (qty === 0) setFormData(prev => ({ ...prev, disponible: false }));
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
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    try {
      const { error: uploadError } = await supabase.storage.from('flores').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('flores').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, foto: data.publicUrl }));
    } catch (error) { alert("Error al subir imagen."); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (activeTab === "editar" && formData.id) {
        await updateFlor(formData.id, formData, currentUser);
    } else {
        await createFlor(formData, currentUser);
    }
    setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true });
    setActiveTab("ver");
    loadFlores();
    setLoading(false);
  };

  const handleEditClick = (flor: Flor) => {
    setSelectedFlor(null);
    setFormData({
        id: flor.id, nombre: flor.nombre, descripcion: flor.descripcion || "",
        color: flor.color || "", precio: flor.precio_unitario.toString(),
        cantidad: flor.cantidad?.toString() || "0", foto: flor.foto || "", disponible: flor.disponible
    });
    setActiveTab("editar");
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
        <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
          <button onClick={() => setActiveTab("ver")} className={`p-4 rounded-xl border transition-all ${activeTab === "ver" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>📋 Ver Inventario</button>
          <button onClick={() => { setActiveTab("crear"); setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true }); }} className={`p-4 rounded-xl border transition-all ${activeTab === "crear" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>✨ Añadir Flor</button>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[#C5A059]/10 shadow-sm min-h-[500px]">
          {(activeTab === "crear" || activeTab === "editar") && (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h3 className="font-serif text-2xl text-center border-b border-[#C5A059]/20 pb-4">{activeTab === "crear" ? "Registrar Nueva Variedad" : "Editar Datos de la Flor"}</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* FOTO */}
                 <div className="col-span-full border-2 border-dashed border-[#C5A059]/30 rounded-xl p-8 bg-[#F9F6EE] relative flex flex-col items-center cursor-pointer group hover:bg-white transition-colors">
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                    {uploading ? <span className="animate-pulse font-bold text-[#C5A059]">Subiendo...</span> : formData.foto ? <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg"><Image src={formData.foto} alt="P" fill className="object-cover" /></div> : <div className="text-center"><span className="text-4xl block mb-2">📷</span><span className="text-xs text-gray-400 uppercase tracking-widest">Subir Foto</span></div>}
                 </div>

                 <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full p-3 bg-[#F9F6EE] rounded-lg focus:ring-1 focus:ring-[#C5A059] text-[#0A0A0A]" />
                 </div>

                 {/* SECCIÓN DE COLOR MEJORADA */}
                 <div className="space-y-3 col-span-full">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Color de la Flor</label>
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        {PRIMARY_PRESETS.map(c => (
                            <button key={c.hex} type="button" onClick={() => setFormData({...formData, color: c.name})} className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-110 shadow-sm ${formData.color === c.name ? 'border-[#0A0A0A] ring-2 ring-offset-2 ring-[#C5A059]' : 'border-white'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                        <div className="w-px h-10 bg-gray-200 mx-2"></div>
                        {/* PALETA EXTRA MÁS NOTORIA */}
                        <div className="relative w-12 h-12 rounded-xl border-2 border-[#C5A059] bg-white flex items-center justify-center overflow-hidden shadow-sm hover:bg-gray-100 transition-colors">
                            <span className="text-2xl">🎨</span>
                            <input type="color" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFormData({...formData, color: getNameFromHex(e.target.value)})} />
                        </div>
                    </div>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full p-3 bg-[#F9F6EE] rounded-lg font-bold text-[#0A0A0A]" placeholder="Nombre del color (Ej: Rojo, Marrón, Negro)" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Precio (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full p-3 bg-[#F9F6EE] rounded-lg" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Stock</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full p-3 bg-[#F9F6EE] rounded-lg" />
                 </div>

                 <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full p-3 bg-[#F9F6EE] rounded-lg" rows={3} />
                 </div>

                 <div className={`col-span-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col"><span className="text-sm font-bold text-[#0A0A0A]">Disponibilidad</span><span className="text-[10px] text-gray-400">{isStockZero ? "Desactivado automáticamente por falta de stock." : "¿Visible para ventas?"}</span></div>
                    <label className={`relative inline-flex items-center ${isStockZero ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} disabled={isStockZero} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                 </div>
               </div>
               <button type="submit" disabled={loading || uploading} className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#C5A059] hover:text-white transition-all">{loading ? "Guardando..." : "Guardar Cambios"}</button>
            </form>
          )}

          {activeTab === "ver" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in">
                {flores.map((flor) => (
                    <div key={flor.id} onClick={() => setSelectedFlor(flor)} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all relative group cursor-pointer ${!flor.disponible ? 'border-red-100 opacity-80' : 'border-gray-100'}`}>
                        {/* BADGE STOCK ORIGINAL (Arriba Izquierda) */}
                        <div className="absolute top-1 left-1 md:top-3 md:left-3 z-10 flex flex-col gap-1">
                            <span className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase tracking-widest shadow-sm ${flor.cantidad > 0 ? 'bg-white/90 text-[#0A0A0A]' : 'bg-red-500 text-white'}`}>
                                Stock: {flor.cantidad}
                            </span>
                        </div>

                        <div className="relative h-24 md:h-48 bg-gray-100">
                            {flor.foto ? <Image src={flor.foto} alt={flor.nombre} fill className={`object-cover ${!flor.disponible ? 'grayscale' : ''}`} /> : <div className="flex items-center justify-center h-full text-xl md:text-3xl opacity-20">🌸</div>}
                            
                            {/* BADGE DISPONIBILIDAD ORIGINAL (Abajo Derecha) */}
                            <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 z-10">
                                <span className={`${flor.disponible ? 'bg-[#25D366]/90' : 'bg-red-500/90'} text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[8px] md:text-[10px] font-bold uppercase shadow-sm backdrop-blur-sm`}>
                                    {flor.disponible ? "Disponible" : "No Disponible"}
                                </span>
                            </div>
                        </div>

                        <div className="p-2 md:p-4">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-1 md:mb-2 gap-0.5">
                                <h3 className="font-serif font-bold text-[10px] md:text-lg text-[#0A0A0A] leading-tight line-clamp-1">{flor.nombre}</h3>
                                <span className="text-[#C5A059] font-bold text-[9px] md:text-sm bg-[#F9F6EE] px-1.5 py-0.5 rounded">Bs {flor.precio_unitario}</span>
                            </div>
                            
                            {/* DESCRIPCION ORIGINAL RESTAURADA */}
                            <p className="text-[9px] md:text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                {flor.descripcion || "Sin descripción detallada."}
                            </p>

                            <div className="flex items-center gap-1 md:gap-2 pt-1 md:pt-2 border-t border-gray-100">
                                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full border border-gray-200" style={{ backgroundColor: getColorStyle(flor.color) }}></div>
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

      {/* MODAL DE DETALLE ORIGINAL */}
      {selectedFlor && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedFlor(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedFlor(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <div className="relative h-64"><Image src={selectedFlor.foto} alt="P" fill className="object-cover" /></div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4"><h3 className="font-serif text-2xl text-[#0A0A0A]">{selectedFlor.nombre}</h3><span className="text-[#C5A059] font-bold text-xl">Bs {selectedFlor.precio_unitario}</span></div>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">{selectedFlor.descripcion || "Sin descripción detallada."}</p>
                        <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8">
                            <span className="bg-gray-100 px-2 py-1 rounded">Color: {selectedFlor.color}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">Stock: {selectedFlor.cantidad}</span>
                            <span className={`px-2 py-1 rounded ${selectedFlor.disponible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{selectedFlor.disponible ? "Disponible" : "No Disponible"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleEditClick(selectedFlor)} className="bg-[#0A0A0A] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-colors">✏️ Editar</button>
                            <button onClick={() => deleteFlor(selectedFlor.id).then(() => loadFlores())} className="bg-red-50 text-red-500 border border-red-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}