"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createCategoria, getCategorias, deleteCategoria, updateCategoria } from "./actions";
import { Layers, Plus, FolderTree } from "lucide-react";
import imageCompression from 'browser-image-compression';

type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  foto: string;
  portada: string;
  categoria_padre_id: string | null;
  categorias?: { nombre: string };
};

export default function CategoriasAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    padreId: "",
    foto: "",
    portada: ""
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingPortada, setUploadingPortada] = useState(false);

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    setLoading(true);
    const data = await getCategorias();
    setCategorias(data);
    setLoading(false);
  };

  const handleUpload = async (file: File, type: "foto" | "portada") => {
    if (!file) return;
    
    const setter = type === "foto" ? setUploadingFoto : setUploadingPortada;
    setter(true);

    try {
      // CONFIGURACIÓN DE COMPRESIÓN UNIFICADA
      const options = {
        maxSizeMB: type === "foto" ? 0.4 : 0.8, // Menos peso para el icono, un poco más para portada
        maxWidthOrHeight: type === "foto" ? 500 : 1200, 
        useWebWorker: true,
        fileType: "image/webp" // Convertimos a webp para máxima eficiencia
      };

      const compressedFile = await imageCompression(file, options);
      const fileName = `${type}_${Date.now()}.webp`;

      const { error } = await supabase.storage
        .from('categorias')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('categorias')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, [type]: urlData.publicUrl }));

    } catch (error: any) {
      console.error("Error detallado:", error);
      alert(`❌ Error al subir: ${error.message || "Error desconocido"}`);
    } finally {
      setter(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === "editar" && formData.id) {
        const res = await updateCategoria(formData.id, formData);
        if (!res.success) alert(res.error);
    } else {
        const res = await createCategoria(formData);
        if (!res.success) alert(res.error);
    }

    limpiarForm();
    setActiveTab("ver");
    loadCategorias();
    setLoading(false);
  };

  const limpiarForm = () => {
    setFormData({ id: "", nombre: "", descripcion: "", padreId: "", foto: "", portada: "" });
  };

  const handleEditClick = (cat: Categoria) => {
    setFormData({
        id: cat.id,
        nombre: cat.nombre,
        descripcion: cat.descripcion || "",
        padreId: cat.categoria_padre_id || "",
        foto: cat.foto || "",
        portada: cat.portada || ""
    });
    setActiveTab("editar");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar categoría? Si tiene hijos o productos fallará.")) {
        const res = await deleteCategoria(id);
        if (!res.success) alert(res.error);
        else loadCategorias();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Categorías</h2>
          <p className="text-sm text-gray-500">Estructura del catálogo (padres e hijos).</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button 
             onClick={() => { setActiveTab("ver"); loadCategorias(); }} 
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
           >
             <FolderTree size={14} className="inline mr-2 -mt-0.5" />
             Estructura
           </button>
           <button 
             onClick={() => { setActiveTab("crear"); limpiarForm(); }} 
             className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}
           >
             <Plus size={14} className="inline mr-2 -mt-0.5" />
             Nueva Categoría
           </button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif italic text-xl text-gray-800">{activeTab === "crear" ? "Crear Categoría" : "Editar Categoría"}</h3>
                <button onClick={() => setActiveTab('ver')} className="text-xs text-red-400 hover:text-red-500 font-bold uppercase">Cancelar</button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Icono / Miniatura</span>
                    <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#C5A059] hover:bg-white transition-colors">
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'foto')} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                        {uploadingFoto ? 
                          <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C5A059]">
                            <span className="text-xl animate-spin">❀</span>
                            <span className="text-[10px] mt-1">Optimizando...</span>
                          </div> 
                        : formData.foto ? 
                          <Image src={formData.foto} alt="Icono" fill className="object-cover" /> 
                        :
                          <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-300 group-hover:text-[#C5A059]">❀</span>
                        }
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Portada (Cabecera)</span>
                    <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden group cursor-pointer hover:border-[#C5A059] hover:bg-white transition-colors">
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'portada')} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                        {uploadingPortada ? 
                          <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C5A059]">
                            <span className="text-xl animate-spin">❀</span>
                            <span className="text-[10px] mt-1">Optimizando...</span>
                          </div> 
                        : formData.portada ? 
                          <Image src={formData.portada} alt="Portada" fill className="object-cover" /> 
                        :
                          <span className="absolute inset-0 flex items-center justify-center text-3xl text-gray-300 group-hover:text-[#C5A059]">🖼️</span>
                        }
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej. Fiestas" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría Padre (Opcional)</label>
                    <select value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] text-sm outline-none">
                        <option value="">-- Es Categoría Principal --</option>
                        {categorias
                          .filter(c => c.id !== formData.id)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} {c.categoria_padre_id ? '(Subcategoría)' : ''}</option>
                        ))}
                    </select>
                  </div>

                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" rows={3} placeholder="Descripción..." />
                  </div>
                </div>

                <button disabled={loading || uploadingFoto || uploadingPortada} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all disabled:opacity-50">
                  {loading ? "Guardando..." : "Guardar Categoría"}
                </button>
            </form>
        </div>
      )}

      {activeTab === "ver" && (
        <div className="animate-in fade-in">
            {categorias.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <span className="text-4xl block mb-2 opacity-30">📂</span>
                    <p className="text-gray-500 font-serif">No hay categorías registradas.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 pb-2 px-6 pt-4">
                        <div className="col-span-1">Img</div>
                        <div className="col-span-5">Nombre</div>
                        <div className="col-span-4">Tipo / Padre</div>
                        <div className="col-span-2 text-right">Acciones</div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {categorias.map((cat) => (
                            <div key={cat.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50 transition-colors">
                                <div className="col-span-1 relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                    {cat.foto ? <Image src={cat.foto} alt="" fill className="object-cover" /> : <span className="flex items-center justify-center h-full text-[8px]">❌</span>}
                                </div>
                                <div className="col-span-5">
                                    <p className="font-serif font-bold text-gray-800">{cat.nombre}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{cat.descripcion}</p>
                                </div>
                                <div className="col-span-4 text-xs">
                                    {cat.categoria_padre_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#C5A059]"></div>
                                            <span className="text-gray-600">Subcategoría de <strong>{cat.categorias?.nombre}</strong></span>
                                        </div>
                                    ) : (
                                        <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">PRINCIPAL</span>
                                    )}
                                </div>
                                <div className="col-span-2 flex justify-end gap-2">
                                    <button onClick={() => handleEditClick(cat)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors" title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors" title="Eliminar">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      )}

    </div>
  );
}