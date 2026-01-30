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
    } catch (e) { console.error("Error storage:", e); }
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
      const options = { maxSizeMB: 0.4, maxWidthOrHeight: 800, useWebWorker: true, fileType: "image/webp" };
      const compressedFile = await imageCompression(croppedFile, options);

      if (formData[cropType]) await deleteImageFromStorage(formData[cropType]);

      const fileName = `${cropType}_${Date.now()}.webp`;
      const { error } = await supabase.storage.from('categorias').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('categorias').getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, [cropType]: data.publicUrl }));
    } catch (err) { alert("Error procesando imagen"); } finally { setter(false); }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCat = async (id: string) => {
    if (confirm("¿Eliminar categoría y sus fotos?")) {
        const cat = categorias.find(c => c.id === id);
        if (cat?.foto) await deleteImageFromStorage(cat.foto);
        if (cat?.portada) await deleteImageFromStorage(cat.portada);
        const res = await deleteCategoria(id);
        if (res.success) loadCategorias(); else alert(res.error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden p-2 md:p-0">
      
      {/* MODAL CROP RESPONSIVO */}
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
              cropShape={cropType === "foto" ? "round" : "rect"}
              showGrid={false}
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

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-serif italic text-gray-800">Categorías</h2>
          <p className="text-sm text-gray-500">Organiza tu catálogo de flores.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
           <button 
             onClick={() => { setActiveTab("ver"); loadCategorias(); }} 
             className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}
           >
             <FolderTree size={14} className="inline mr-2 -mt-0.5" /> Estructura
           </button>
           <button 
             onClick={() => { setActiveTab("crear"); limpiarForm(); }} 
             className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}
           >
             <Plus size={14} className="inline mr-2 -mt-0.5" /> Nueva
           </button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif italic text-xl text-gray-800">{activeTab === "crear" ? "Crear Categoría" : "Editar Categoría"}</h3>
                <button onClick={() => setActiveTab('ver')} className="text-xs text-red-400 hover:text-red-500 font-bold uppercase">Cancelar</button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ICONO CIRCULAR CON BORRADO VISIBLE */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Icono Circular (1:1)</span>
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                        {uploadingFoto ? (
                          <div className="text-[#C5A059] animate-pulse font-bold text-[10px]">PROCESANDO...</div> 
                        ) : formData.foto ? (
                          <div className="relative w-full h-full group">
                            <Image src={formData.foto} alt="Icon" fill className="object-cover" unoptimized /> 
                            <button 
                              type="button" 
                              onClick={() => { deleteImageFromStorage(formData.foto); setFormData({...formData, foto: ""}) }} 
                              className="absolute inset-0 m-auto w-12 h-12 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm active:scale-95 transition-all z-10"
                            >
                              <Trash2 size={24}/>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 p-4 w-full h-full justify-center">
                              <button type="button" onClick={() => iconCamRef.current?.click()} className="w-full bg-[#0A0A0A] text-[#C5A059] py-3 rounded-xl text-[10px] font-bold uppercase shadow-sm flex items-center justify-center gap-2">
                                <Camera size={16} /> Cámara
                              </button>
                              <button type="button" onClick={() => iconFileRef.current?.click()} className="w-full bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[10px] font-bold uppercase shadow-sm flex items-center justify-center gap-2">
                                <ImageIcon size={16} /> Galería
                              </button>
                              <input ref={iconCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                              <input ref={iconFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                          </div>
                        )}
                    </div>
                  </div>

                  {/* PORTADA */}
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Portada Horizontal (16:9)</span>
                    <div className="relative w-full h-32 md:h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group">
                        {uploadingPortada ? (
                          <div className="text-[#C5A059] animate-pulse font-bold text-[10px]">PROCESANDO...</div> 
                        ) : formData.portada ? (
                          <>
                            <Image src={formData.portada} alt="Portada" fill className="object-cover" unoptimized /> 
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.portada); setFormData({...formData, portada: ""}) }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg z-10"><Trash2 size={16}/></button>
                          </>
                        ) : (
                          <div className="flex gap-4 w-full h-full items-center justify-center px-4">
                                <button type="button" onClick={() => coverCamRef.current?.click()} className="flex-1 bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase shadow-md">
                                  <Camera size={20}/> Cámara
                                </button>
                                <button type="button" onClick={() => coverFileRef.current?.click()} className="flex-1 bg-white border border-gray-200 text-gray-400 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-[10px] uppercase shadow-sm">
                                  <ImageIcon size={20}/> Galería
                                </button>
                                <input ref={coverCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                                <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej. Cumpleaños" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Categoría Superior</label>
                    <select value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none text-sm appearance-none">
                        <option value="">-- Es Categoría Principal --</option>
                        {categorias.filter(c => c.id !== formData.id).map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                  </div>
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none min-h-[100px]" placeholder="Breve descripción..." />
                  </div>
                </div>

                <button disabled={loading || uploadingFoto || uploadingPortada} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl">
                  {loading ? "GUARDANDO..." : "CONFIRMAR"}
                </button>
            </form>
        </div>
      )}

      {/* VISTA LISTA CON DESCRIPCIÓN COMPLETA (Arreglada) */}
      {activeTab === "ver" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
                {categorias.map((cat) => (
                    <div key={cat.id} className="grid grid-cols-12 gap-3 items-start p-4 md:px-6 hover:bg-gray-50 transition-colors">
                        <div className="col-span-3 md:col-span-1 pt-1">
                            <div className="relative w-12 h-12 md:w-10 md:h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200 aspect-square">
                                {cat.foto ? <Image src={cat.foto} alt="" fill className="object-cover" unoptimized /> : <Layers className="m-auto text-gray-300 w-5 h-5" />}
                            </div>
                        </div>
                        <div className="col-span-9 md:col-span-9 pr-2">
                            <p className="font-serif font-bold text-gray-800 text-sm md:text-base leading-tight mb-1 uppercase tracking-tight">{cat.nombre}</p>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                    {cat.categoria_padre_id ? (
                                        <span className="text-[8px] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded-full font-bold uppercase shrink-0">Subcategoría</span>
                                    ) : (
                                        <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shrink-0">Principal</span>
                                    )}
                                </div>
                                {/* DESCRIPCIÓN COMPLETA CON AJUSTE DE LÍNEAS */}
                                <p className="text-[11px] text-gray-500 leading-relaxed break-words whitespace-pre-wrap">
                                    {cat.descripcion || "Sin descripción establecida."}
                                </p>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-2 flex justify-end gap-2 mt-4 md:mt-0 border-t md:border-none pt-4 md:pt-2">
                            <button onClick={() => handleEditClick(cat)} className="flex-1 md:flex-none h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-black hover:text-[#C5A059] transition-all">
                                ✏️ <span className="md:hidden ml-2 text-[10px] font-bold uppercase">Editar</span>
                            </button>
                            <button onClick={() => handleDeleteCat(cat.id)} className="flex-1 md:flex-none h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                🗑️ <span className="md:hidden ml-2 text-[10px] font-bold uppercase tracking-tighter">Borrar</span>
                            </button>
                        </div>
                    </div>
                ))}
                {categorias.length === 0 && <div className="p-20 text-center text-gray-400 font-serif italic uppercase text-[10px] tracking-widest">No hay categorías registradas.</div>}
            </div>
        </div>
      )}
    </div>
  );
}