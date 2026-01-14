"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createCategoria, getCategorias, deleteCategoria, updateCategoria } from "./actions";

export const runtime = 'edge';

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

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const scaleSize = MAX_WIDTH / img.width;
          
          const newWidth = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
          const newHeight = img.width > MAX_WIDTH ? img.height * scaleSize : img.height;

          canvas.width = newWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Error al comprimir imagen"));
          }, "image/webp", 0.8); 
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (file: File, type: "foto" | "portada") => {
    if (!file) return;
    
    const setter = type === "foto" ? setUploadingFoto : setUploadingPortada;
    setter(true);

    try {
      console.log(`Comenzando compresión de ${type}...`);
      
      const compressedBlob = await compressImage(file);
      
      // Se comprime antes de subir
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: "image/webp",
      });

      console.log(`Tamaño original: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`Tamaño comprimido: ${(compressedFile.size / 1024).toFixed(2)} KB`);

      const fileName = `${type}_${Date.now()}.webp`;

      const { data, error } = await supabase.storage
        .from('categorias')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtiene el url del bucket al que se subió
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
        else alert("Categoría actualizada");
    } else {
        const res = await createCategoria(formData);
        if (!res.success) alert(res.error);
        else alert("Categoría creada");
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
    <div className="min-h-screen bg-[#F9F6EE] text-[#0A0A0A] pb-20">
      
      <nav className="bg-[#0A0A0A] text-white p-4 border-b border-[#C5A059] flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#C5A059] hover:text-white transition-colors flex items-center text-xs uppercase tracking-widest">
            ← Volver
          </Link>
          <div className="h-4 w-px bg-[#C5A059]/30"></div>
          <h1 className="font-serif text-lg italic text-white">Gestión de Categorías</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-4xl text-[#0A0A0A] mb-2">Categorías y Subcategorías</h2>
          <p className="text-gray-500 font-light text-sm">Organiza tu catálogo. Define padres e hijos.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
          <button onClick={() => { setActiveTab("ver"); loadCategorias(); }} 
            className={`p-4 rounded-xl border transition-all ${activeTab === "ver" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">📋 Ver Estructura</span>
          </button>
          <button onClick={() => { setActiveTab("crear"); limpiarForm(); }} 
            className={`p-4 rounded-xl border transition-all ${activeTab === "crear" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">✨ Nueva Categoría</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#C5A059]/10 p-8 min-h-[500px]">
          
          {(activeTab === "crear" || activeTab === "editar") && (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <h3 className="font-serif text-2xl text-[#0A0A0A] mb-6 text-center border-b border-[#C5A059]/20 pb-4">
                 {activeTab === "crear" ? "Crear Categoría" : "Editar Categoría"}
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Icono / Miniatura</span>
                    <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-[#C5A059]/30 bg-[#F9F6EE] overflow-hidden group cursor-pointer hover:border-[#C5A059] hover:bg-white transition-colors">
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'foto')} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                        {uploadingFoto ? 
                          <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C5A059]">
                            <span className="text-xl animate-spin">❀</span>
                            <span className="text-[10px] mt-1">Comprimiendo...</span>
                          </div> 
                        : formData.foto ? 
                          <Image src={formData.foto} alt="Icono" fill className="object-cover" /> 
                        :
                          <span className="absolute inset-0 flex items-center justify-center text-3xl text-[#C5A059]/30 group-hover:text-[#C5A059]">❀</span>
                        }
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Portada (Cabecera)</span>
                    <div className="relative w-full h-32 rounded-xl border-2 border-dashed border-[#C5A059]/30 bg-[#F9F6EE] overflow-hidden group cursor-pointer hover:border-[#C5A059] hover:bg-white transition-colors">
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'portada')} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" />
                        {uploadingPortada ? 
                          <div className="absolute inset-0 flex items-center justify-center flex-col text-[#C5A059]">
                            <span className="text-xl animate-spin">❀</span>
                            <span className="text-[10px] mt-1">Comprimiendo...</span>
                          </div> 
                        : formData.portada ? 
                          <Image src={formData.portada} alt="Portada" fill className="object-cover" /> 
                        :
                          <span className="absolute inset-0 flex items-center justify-center text-3xl text-[#C5A059]/30 group-hover:text-[#C5A059]">🖼️</span>
                        }
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059]" placeholder="Ej. Fiestas, Velorios, Cumpleaños" />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría Padre (Opcional)</label>
                    <select value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] text-sm">
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
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059]" rows={3} placeholder="Descripción para el cliente..." />
                 </div>
               </div>

               <button disabled={loading || uploadingFoto || uploadingPortada} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all disabled:opacity-50">
                 {loading ? "Guardando..." : "Guardar Categoría"}
               </button>
            </form>
          )}

          {activeTab === "ver" && (
            <div className="animate-in fade-in">
                {categorias.length === 0 ? (
                    <div className="text-center py-20 bg-[#F9F6EE] rounded-xl border border-dashed border-[#C5A059]/30">
                        <span className="text-4xl block mb-2 opacity-30">📂</span>
                        <p className="text-gray-500 font-serif">No hay categorías registradas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 text-[10px] uppercase font-bold text-gray-400 border-b pb-2 px-3">
                            <div className="col-span-1">Img</div>
                            <div className="col-span-4">Nombre</div>
                            <div className="col-span-4">Tipo / Padre</div>
                            <div className="col-span-3 text-right">Acciones</div>
                        </div>

                        {categorias.map((cat) => (
                            <div key={cat.id} className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-100 p-3 rounded-lg hover:shadow-md transition-all">
                                <div className="col-span-1 relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                    {cat.foto ? <Image src={cat.foto} alt="" fill className="object-cover" /> : <span className="flex items-center justify-center h-full text-[8px]">❌</span>}
                                </div>
                                <div className="col-span-4 font-serif font-bold text-[#0A0A0A]">
                                    {cat.nombre}
                                </div>
                                <div className="col-span-4 text-xs">
                                    {cat.categoria_padre_id ? (
                                        <span className="bg-[#F9F6EE] text-[#C5A059] px-2 py-1 rounded-full border border-[#C5A059]/20 font-bold text-[10px]">
                                            ↳ {cat.categorias?.nombre}
                                        </span>
                                    ) : (
                                        <span className="bg-[#0A0A0A] text-white px-2 py-1 rounded-full text-[10px] font-bold tracking-wider">PRINCIPAL</span>
                                    )}
                                </div>
                                <div className="col-span-3 flex justify-end gap-2">
                                    <button onClick={() => handleEditClick(cat)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#C5A059] hover:text-white transition-colors" title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(cat.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-colors" title="Eliminar">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}