"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import { getSession } from "next-auth/react";
import { createEnvoltura, getEnvolturas, deleteEnvoltura, updateEnvoltura } from "./actions";
import { Gift, Plus, LayoutGrid } from "lucide-react";

type Envoltura = {
  id: string;
  nombre: string;
  color: string | null;
  diseno: string | null;
  foto: string | null;
  precio_unitario: number;
  cantidad: number;
  disponible: boolean;
};

const PRIMARY_PRESETS = [
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Negro', hex: '#000000' },
  { name: 'Rosado', hex: '#EC4899' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Verde', hex: '#10B981' },
  { name: 'Dorado', hex: '#C5A059' },
  { name: 'Celeste', hex: '#60A5FA' },
  { name: 'Violeta', hex: '#8B5CF6' },
];

const COLOR_DETECTION_REF = [
  ...PRIMARY_PRESETS,
  { name: 'Rojo Oscuro', hex: '#7F1D1D' },
  { name: 'Vino', hex: '#722F37' },
  { name: 'Marrón', hex: '#78350F' },
  { name: 'Chocolate', hex: '#452214' },
  { name: 'Café', hex: '#8D6E63' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Crema', hex: '#F9F6EE' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Azul Marino', hex: '#1E3A8A' },
  { name: 'Turquesa', hex: '#22D3EE' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Verde Limón', hex: '#84CC16' },
  { name: 'Amarillo', hex: '#E8CF2B' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Fucsia', hex: '#D946EF' },
  { name: 'Lila', hex: '#C4B5FD' },
  { name: 'Rosado Pastel', hex: '#FBCFE8' },
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
    const dist = Math.sqrt(Math.pow(r1-r2, 2) + Math.pow(g1-g2, 2) + Math.pow(b1-b2, 2));
    if (dist < minDistance) { minDistance = dist; nearest = color; }
  });
  return nearest.name;
};

const getColorStyle = (nombreColor: string | null) => {
  if (!nombreColor) return '#ccc';
  const match = COLOR_DETECTION_REF.find(c => c.name.toLowerCase() === nombreColor.toLowerCase());
  if (match) return match.hex;
  return nombreColor.startsWith('#') ? nombreColor : '#C5A059';
};

export default function EnvolturasAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [envolturas, setEnvolturas] = useState<Envoltura[]>([]);
  const [selectedEnvoltura, setSelectedEnvoltura] = useState<Envoltura | null>(null);
  const [currentUser, setCurrentUser] = useState("");
  const [formData, setFormData] = useState({
    id: "", nombre: "", color: "", diseno: "", precio: "", cantidad: "", foto: "", disponible: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (activeTab === "ver") loadEnvolturas(); }, [activeTab]);
  useEffect(() => { getSession().then((s) => { if (s?.user?.email) setCurrentUser(s.user.email); }); }, []);
  
  useEffect(() => {
    const qty = parseInt(formData.cantidad) || 0;
    if (qty === 0) setFormData(p => ({ ...p, disponible: false }));
  }, [formData.cantidad]);

  const loadEnvolturas = async () => {
    setLoading(true);
    const data = await getEnvolturas();
    setEnvolturas(data);
    setLoading(false);
  };

  const analyzeColor = (url: string) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 100; canvas.height = 100;
      ctx?.drawImage(img, 0, 0, 100, 100);
      const imageData = ctx?.getImageData(30, 30, 40, 40).data;
      if (!imageData) return;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        const pr = imageData[i], pg = imageData[i+1], pb = imageData[i+2];
        const brightness = (pr + pg + pb) / 3;
        if (brightness < 245 && brightness > 15) { r += pr; g += pg; b += pb; count++; }
      }
      if (count > 0) {
        const hex = `#${((1 << 24) + (Math.round(r/count) << 16) + (Math.round(g/count) << 8) + Math.round(b/count)).toString(16).slice(1)}`;
        setFormData(prev => ({ ...prev, color: getNameFromHex(hex.toUpperCase()) }));
      }
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileName = `env_${Date.now()}.${file.name.split('.').pop()}`;
    try {
      await supabase.storage.from('envolturas').upload(fileName, file);
      const { data: urlData } = supabase.storage.from('envolturas').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, foto: urlData.publicUrl }));
      analyzeColor(urlData.publicUrl);
    } catch (error) { alert("Error al subir imagen."); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar" && formData.id) 
        ? await updateEnvoltura(formData.id, formData, currentUser)
        : await createEnvoltura(formData, currentUser);
    if (res.success) {
      alert(activeTab === "editar" ? "¡Envoltura actualizada!" : "¡Envoltura registrada!");
      resetForm(); setActiveTab("ver"); loadEnvolturas();
    } else { alert(res.error); }
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: "", nombre: "", color: "", diseno: "", precio: "", cantidad: "", foto: "", disponible: true });

  const handleEditClick = (env: Envoltura) => {
    setSelectedEnvoltura(null);
    setFormData({ id: env.id, nombre: env.nombre, color: env.color || "", diseno: env.diseno || "", precio: env.precio_unitario.toString(), cantidad: env.cantidad.toString(), foto: env.foto || "", disponible: env.disponible });
    setActiveTab("editar");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar permanentemente?")) {
        const res = await deleteEnvoltura(id);
        if (res.success) { setSelectedEnvoltura(null); loadEnvolturas(); } else { alert(res.error); }
    }
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER TIPO PEDIDOS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Inventario de Envolturas</h2>
          <p className="text-sm text-gray-500">Papeles, cajas, cintas y detalles.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab("ver")} 
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
           >
             <LayoutGrid size={14} className="inline mr-2 -mt-0.5" />
             Ver Todo
           </button>
           <button 
             onClick={() => { setActiveTab("crear"); resetForm(); }} 
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
           >
             <Plus size={14} className="inline mr-2 -mt-0.5" />
             Añadir Material
           </button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif italic text-xl text-gray-800">{activeTab === "crear" ? "Registrar Nuevo Material" : "Editar Envoltura"}</h3>
                <button onClick={() => setActiveTab('ver')} className="text-xs text-red-400 hover:text-red-500 font-bold uppercase">Cancelar</button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="col-span-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 hover:bg-white hover:border-[#C5A059] transition-colors cursor-pointer relative group">
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" accept="image/*" />
                    {uploading ? <span className="text-xs font-bold text-[#C5A059] animate-pulse">Analizando imagen...</span> : formData.foto ? <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg"><Image src={formData.foto} alt="Preview" fill className="object-cover" /></div> : <div className="text-center"><span className="text-4xl mb-2 block">🎁</span><span className="text-xs text-gray-400 uppercase tracking-widest">Subir Foto</span></div>}
                 </div>

                 <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej: Papel Kraft" />
                 </div>

                 <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Color</label>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            {PRIMARY_PRESETS.map((c) => (
                                <button key={c.hex} type="button" onClick={() => setFormData({ ...formData, color: c.name })} className={`w-6 h-6 rounded-full border transition-all ${formData.color === c.name ? 'ring-1 ring-[#0A0A0A] ring-offset-1 scale-110' : 'border-white shadow-sm hover:scale-105'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                            ))}
                            <div className="relative w-6 h-6 rounded-full border-2 border-dashed border-[#C5A059] flex items-center justify-center bg-white overflow-hidden group">
                                <span className="text-[10px]">🎨</span>
                                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" onChange={(e) => setFormData({ ...formData, color: getNameFromHex(e.target.value) })} />
                            </div>
                        </div>
                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059] font-bold text-sm outline-none" placeholder="Ej: Rojo, Dorado" />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Diseño / Acabado</label>
                    <input type="text" value={formData.diseno} onChange={e => setFormData({...formData, diseno: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej: Lunares, Metalizado" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} onWheel={(e) => e.currentTarget.blur()} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="0.00" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cantidad (Stock)</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} onWheel={(e) => e.currentTarget.blur()} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 text-[#0A0A0A] focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="0" />
                 </div>

                 <div className={`col-span-full p-4 rounded-xl flex items-center justify-between border transition-colors ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col"><span className="text-sm font-bold text-[#0A0A0A]">Disponibilidad</span><span className="text-xs text-gray-400">{isStockZero ? "Desactivado automáticamente por falta de stock." : "¿Visible para ventas?"}</span></div>
                    <label className={`relative inline-flex items-center ${isStockZero ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} disabled={isStockZero} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                 </div>
               </div>

               <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all mt-4 disabled:opacity-50">
                 {loading ? "Guardando..." : "Guardar Cambios"}
               </button>
            </form>
        </div>
      )}

      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in">
            {envolturas.map((env) => (
                <div key={env.id} onClick={() => setSelectedEnvoltura(env)} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${!env.disponible ? 'border-red-100 opacity-80' : 'border-gray-100'}`}>
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm ${env.cantidad > 0 ? 'bg-white/90 text-[#0A0A0A]' : 'bg-red-500 text-white'}`}>
                            Stock: {env.cantidad}
                        </span>
                    </div>
                    <div className="relative h-40 md:h-48 bg-gray-50">
                        {env.foto ? <Image src={env.foto} alt={env.nombre} fill className={`object-cover ${!env.disponible ? 'grayscale' : ''}`} /> : <div className="flex items-center justify-center h-full text-3xl opacity-20">🎁</div>}
                        <div className="absolute bottom-2 right-2 z-10">{env.disponible ? <span className="bg-[#25D366]/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm">Disponible</span> : <span className="bg-red-500/90 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-sm">Agotado</span>}</div>
                    </div>
                    <div className="p-4">
                        <div className="flex flex-col mb-2">
                             <h3 className="font-serif font-bold text-lg text-[#0A0A0A] leading-tight line-clamp-1">{env.nombre}</h3>
                             <span className="text-[#C5A059] font-bold text-sm">Bs {env.precio_unitario}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1 mb-2">{env.diseno ? env.diseno : "Estándar"}</p>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
                            <div className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: getColorStyle(env.color) }}></div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold truncate">{env.color || "Sin color"}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

        {selectedEnvoltura && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedEnvoltura(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelectedEnvoltura(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-1 transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    <div className="relative h-64 bg-gray-100">{selectedEnvoltura.foto && <Image src={selectedEnvoltura.foto} alt={selectedEnvoltura.nombre} fill className="object-cover" />}</div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4"><h3 className="font-serif text-2xl text-[#0A0A0A] leading-tight">{selectedEnvoltura.nombre}</h3><span className="text-[#C5A059] font-bold text-xl whitespace-nowrap">Bs {selectedEnvoltura.precio_unitario}</span></div>
                        <div className="space-y-4 mb-8 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {selectedEnvoltura.color && <span className="bg-gray-100 px-2 py-1 rounded">Color: {selectedEnvoltura.color}</span>}
                            <span className="bg-gray-100 px-2 py-1 rounded">Stock: {selectedEnvoltura.cantidad}</span>
                            <span className={`px-2 py-1 rounded ${selectedEnvoltura.disponible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{selectedEnvoltura.disponible ? "Disponible" : "No Disponible"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleEditClick(selectedEnvoltura)} className="bg-[#0A0A0A] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-colors flex items-center justify-center gap-2"><span>✏️</span> Editar</button>
                            <button onClick={() => handleDelete(selectedEnvoltura.id)} className="bg-red-50 text-red-500 border border-red-100 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><span>🗑️</span> Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}