"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createCategoria, getCategorias, deleteCategoria, updateCategoria } from "./actions";
import { Layers, Plus, FolderTree, Camera, ImageIcon, Check, X, ZoomIn, Trash2 } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';

// --- TIPOS ---
type Categoria = {
  id: string;
  nombre: string;
  descripcion: string;
  foto: string;
  portada: string;
  categoria_padre_id: string | null;
  categorias?: { nombre: string };
};

// --- UTILIDADES DE IMAGEN ---
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
  const image = await new Promise<HTMLImageElement>((resolve) => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
  });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "categoria.webp", { type: "image/webp" }));
    }, 'image/webp', 0.8);
  });
};

export default function CategoriasAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // REFERENCIAS INPUTS
  const iconFileRef = useRef<HTMLInputElement>(null);
  const iconCamRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const coverCamRef = useRef<HTMLInputElement>(null);

  // ESTADOS RECORTE
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropType, setCropType] = useState<"foto" | "portada">("foto");

  const [formData, setFormData] = useState({
    id: "", nombre: "", descripcion: "", padreId: "", foto: "", portada: ""
  });

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [uploadingPortada, setUploadingPortada] = useState(false);

  useEffect(() => { loadCategorias(); }, []);

  const loadCategorias = async () => {
    setLoading(true);
    const data = await getCategorias();
    setCategorias(data);
    setLoading(false);
  };

  const deleteImageFromStorage = async (url: string) => {
    if (!url) return;
    try {
      const fileName = url.split('/').pop();
      if (fileName) await supabase.storage.from('categorias').remove([fileName]);
    } catch (e) { console.error("Error limpieza storage:", e); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "foto" | "portada") => {
    if (e.target.files && e.target.files.length > 0) {
      setCropType(type);
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    const setter = cropType === "foto" ? setUploadingFoto : setUploadingPortada;
    setter(true);
    setImageToCrop(null);

    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const options = {
        maxSizeMB: cropType === "foto" ? 0.4 : 0.8,
        maxWidthOrHeight: cropType === "foto" ? 500 : 1200,
        useWebWorker: true,
        fileType: "image/webp"
      };
      const compressedFile = await imageCompression(croppedFile, options);

      if (formData[cropType]) await deleteImageFromStorage(formData[cropType]);

      const fileName = `${cropType}_${Date.now()}.webp`;
      const { error } = await supabase.storage.from('categorias').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('categorias').getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, [cropType]: data.publicUrl }));
    } catch (err) {
      alert("Error procesando imagen");
    } finally { setter(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar" && formData.id) 
        ? await updateCategoria(formData.id, formData)
        : await createCategoria(formData);
    
    if (res.success) {
      limpiarForm(); setActiveTab("ver"); loadCategorias();
    } else alert(res.error);
    setLoading(false);
  };

  const limpiarForm = () => setFormData({ id: "", nombre: "", descripcion: "", padreId: "", foto: "", portada: "" });

  const handleEditClick = (cat: Categoria) => {
    setFormData({ id: cat.id, nombre: cat.nombre, descripcion: cat.descripcion || "", padreId: cat.categoria_padre_id || "", foto: cat.foto || "", portada: cat.portada || "" });
    setActiveTab("editar");
  };

  const handleDeleteCat = async (id: string) => {
    if (confirm("¿Eliminar categoría? Si tiene hijos o productos fallará.")) {
        const cat = categorias.find(c => c.id === id);
        if (cat?.foto) await deleteImageFromStorage(cat.foto);
        if (cat?.portada) await deleteImageFromStorage(cat.portada);
        const res = await deleteCategoria(id);
        if (res.success) loadCategorias(); else alert(res.error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-4 md:p-0">
      
      {/* MODAL CROP - OPTIMIZADO PARA MÓVIL */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2 md:p-4 backdrop-blur-sm">
          <div className="relative w-full h-[55vh] md:h-[65vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper 
              image={imageToCrop} 
              crop={crop} 
              zoom={zoom} 
              aspect={cropType === "foto" ? 1 : 16/9} 
              onCropChange={setCrop} 
              onCropComplete={onCropComplete} 
              onZoomChange={setZoom} 
            />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <ZoomIn size={16} className="text-[#C5A059]" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-white/10">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"><Check size={14} /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800 text-center md:text-left">Categorías</h2>
          <p className="text-sm text-gray-500 text-center md:text-left">Estructura del catálogo (padres e hijos).</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
           <button 
             onClick={() => { setActiveTab("ver"); loadCategorias(); }} 
             className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}
           >
             <FolderTree size={14} className="inline mr-2 -mt-0.5" />
             Estructura
           </button>
           <button 
             onClick={() => { setActiveTab("crear"); limpiarForm(); }} 
             className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}
           >
             <Plus size={14} className="inline mr-2 -mt-0.5" />
             Nueva
           </button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-5 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif italic text-xl text-gray-800">{activeTab === "crear" ? "Crear Categoría" : "Editar Categoría"}</h3>
                <button onClick={() => setActiveTab('ver')} className="text-xs text-red-400 hover:text-red-500 font-bold uppercase">Cancelar</button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ICONO */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Icono / Miniatura (1:1)</span>
                    <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group">
                        {uploadingFoto ? (
                          <div className="text-[#C5A059] animate-pulse">...</div> 
                        ) : formData.foto ? (
                          <>
                            <Image src={formData.foto} alt="Icono" fill className="object-cover" unoptimized /> 
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.foto); setFormData({...formData, foto: ""}) }} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><Trash2 size={20}/></button>
                          </>
                        ) : (
                          <div className="flex flex-col gap-1 p-2 w-full h-full justify-center">
                              <button type="button" onClick={() => iconCamRef.current?.click()} className="bg-[#0A0A0A] text-[#C5A059] py-1.5 rounded-lg text-[8px] font-bold uppercase"><Camera size={12} className="inline mr-1" /> Cámara</button>
                              <button type="button" onClick={() => iconFileRef.current?.click()} className="bg-white border text-gray-500 py-1.5 rounded-lg text-[8px] font-bold uppercase">Galería</button>
                              <input ref={iconCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                              <input ref={iconFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                          </div>
                        )}
                    </div>
                  </div>

                  {/* PORTADA */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Portada / Cabecera (16:9)</span>
                    <div className="relative w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group">
                        {uploadingPortada ? (
                          <div className="text-[#C5A059] animate-pulse">...</div> 
                        ) : formData.portada ? (
                          <>
                            <Image src={formData.portada} alt="Portada" fill className="object-cover" unoptimized /> 
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.portada); setFormData({...formData, portada: ""}) }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"><Trash2 size={14}/></button>
                          </>
                        ) : (
                          <div className="flex gap-3">
                                <button type="button" onClick={() => coverCamRef.current?.click()} className="bg-[#0A0A0A] text-[#C5A059] p-3 rounded-xl"><Camera size={20}/></button>
                                <button type="button" onClick={() => coverFileRef.current?.click()} className="bg-white border border-gray-200 text-gray-400 p-3 rounded-xl"><ImageIcon size={20}/></button>
                                <input ref={coverCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                                <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej. Fiestas" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría Padre</label>
                    <select value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] text-sm outline-none">
                        <option value="">-- Es Categoría Principal --</option>
                        {categorias.filter(c => c.id !== formData.id).map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" rows={3} placeholder="Breve descripción..." />
                  </div>
                </div>

                <button disabled={loading || uploadingFoto || uploadingPortada} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl">
                  {loading ? "Cargando..." : "Guardar Categoría"}
                </button>
            </form>
        </div>
      )}

      {/* VISTA LISTA - ADAPTADA PARA MÓVIL */}
      {activeTab === "ver" && (
        <div className="animate-in fade-in">
            {categorias.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <span className="text-4xl block mb-2 opacity-30">📂</span>
                    <p className="text-gray-500 font-serif">No hay categorías registradas.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* ENCABEZADO OCULTO EN MÓVIL */}
                    <div className="hidden md:grid grid-cols-12 gap-4 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-100 pb-2 px-6 pt-4">
                        <div className="col-span-1">Img</div>
                        <div className="col-span-5">Nombre</div>
                        <div className="col-span-4">Tipo / Padre</div>
                        <div className="col-span-2 text-right">Acciones</div>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {categorias.map((cat) => (
                            <div key={cat.id} className="grid grid-cols-12 gap-4 items-center p-4 md:px-6 hover:bg-gray-50 transition-colors">
                                {/* IMAGEN */}
                                <div className="col-span-3 md:col-span-1">
                                    <div className="relative w-12 h-12 md:w-10 md:h-10 rounded-xl md:rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                        {cat.foto ? <Image src={cat.foto} alt="" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-[8px]">X</span>}
                                    </div>
                                </div>
                                {/* TEXTO */}
                                <div className="col-span-9 md:col-span-5">
                                    <p className="font-serif font-bold text-gray-800 text-sm md:text-base">{cat.nombre}</p>
                                    <p className="text-[10px] text-gray-400 truncate md:max-w-xs">{cat.descripcion}</p>
                                    {/* INFO EXTRA SOLO VISIBLE EN MÓVIL */}
                                    <div className="md:hidden mt-1">
                                        {cat.categoria_padre_id ? (
                                            <span className="text-[8px] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded-full font-bold uppercase">Sub: {cat.categorias?.nombre}</span>
                                        ) : (
                                            <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Principal</span>
                                        )}
                                    </div>
                                </div>
                                {/* TIPO (Solo Desktop) */}
                                <div className="hidden md:block col-span-4 text-xs">
                                    {cat.categoria_padre_id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-[#C5A059]"></div>
                                            <span className="text-gray-600">Subcategoría de <strong>{cat.categorias?.nombre}</strong></span>
                                        </div>
                                    ) : (
                                        <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">Principal</span>
                                    )}
                                </div>
                                {/* ACCIONES */}
                                <div className="col-span-12 md:col-span-2 flex justify-end gap-2 mt-2 md:mt-0 border-t md:border-none pt-2 md:pt-0">
                                    <button onClick={() => handleEditClick(cat)} className="flex-1 md:flex-none h-9 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-gray-50 md:bg-transparent text-gray-400 md:hover:bg-gray-200 transition-all">✏️ <span className="md:hidden ml-2 text-[10px] font-bold">EDITAR</span></button>
                                    <button onClick={() => handleDeleteCat(cat.id)} className="flex-1 md:flex-none h-9 md:w-8 md:h-8 flex items-center justify-center rounded-lg bg-red-50 md:bg-transparent text-red-400 md:hover:bg-red-100 transition-all">🗑️ <span className="md:hidden ml-2 text-[10px] font-bold">ELIMINAR</span></button>
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