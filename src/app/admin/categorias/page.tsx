"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createCategoria, getCategorias, deleteCategoria, updateCategoria } from "./actions";
import { Layers, Plus, FolderTree, Camera, ImageIcon, Check, X, ZoomIn, Trash2, Loader2, Info, AlertTriangle } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';
import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // --- ESTADOS DE MODALES PERSONALIZADOS ---
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const iconFileRef = useRef<HTMLInputElement>(null);
  const iconCamRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);
  const coverCamRef = useRef<HTMLInputElement>(null);

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
    } catch (err) { 
      setAlertMessage("No se pudo procesar la imagen seleccionada.");
      setIsAlertOpen(true);
    } finally { setter(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar" && formData.id) 
        ? await updateCategoria(formData.id, formData)
        : await createCategoria(formData);
    
    if (res.success) {
      toast(activeTab === "editar" ? "Cambios guardados." : "Categoría creada.", "success");
      limpiarForm(); setActiveTab("ver"); loadCategorias();
    } else {
      setAlertMessage(res.error || "No se pudo completar la acción.");
      setIsAlertOpen(true);
    }
    setLoading(false);
  };

  const limpiarForm = () => setFormData({ id: "", nombre: "", descripcion: "", padreId: "", foto: "", portada: "" });

  const handleEditClick = (cat: Categoria) => {
    setFormData({ id: cat.id, nombre: cat.nombre, descripcion: cat.descripcion || "", padreId: cat.categoria_padre_id || "", foto: cat.foto || "", portada: cat.portada || "" });
    setActiveTab("editar");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LÓGICA DE ELIMINACIÓN CON MODAL ---
  const triggerDelete = (id: string) => {
    setCatToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!catToDelete) return;
    setIsConfirmOpen(false);
    
    const res = await deleteCategoria(catToDelete);
    if (res.success) {
        toast("Categoría retirada.", "success");
        loadCategorias(); 
    } else {
        setAlertMessage(res.error || "Error al intentar retirar la categoría.");
        setIsAlertOpen(true);
    }
    setCatToDelete(null);
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden p-2 md:p-0">
      
      {/* 1. VENTANA DE AVISO/ERROR (FLOR DE LOTO) */}
      <AnimatePresence>
        {isAlertOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAlertOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Info className="text-[#C5A059]" size={32} />
                </div>
                <h3 className="font-serif italic text-2xl text-gray-800 mb-4">Aviso</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{alertMessage}</p>
                <button onClick={() => setIsAlertOpen(false)} className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-lg">
                  Entendido
                </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. VENTANA DE CONFIRMACIÓN (FLOR DE LOTO) */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="text-red-400" size={32} />
                </div>
                <h3 className="font-serif italic text-2xl text-gray-800 mb-2">¿Estás seguro?</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-8 uppercase tracking-widest font-bold">Deseas retirar esta categoría permanentemente</p>
                
                <div className="space-y-3">
                    <button onClick={() => setIsConfirmOpen(false)} className="w-full bg-[#0A0A0A] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-gray-800 transition-all">
                      No, mantenerla
                    </button>
                    <button onClick={confirmDelete} className="w-full text-red-400 py-2 font-bold text-[10px] uppercase tracking-[0.2em] hover:underline transition-all">
                      Sí, retirar categoría
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CROPPER */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2">
          <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={cropType === "foto" ? 1 : 16/9} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape={cropType === "foto" ? "round" : "rect"} />
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
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Categorías</h2>
          <p className="text-sm text-gray-500">Gestión del catálogo floral.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => { setActiveTab("ver"); loadCategorias(); }} className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}>
             <FolderTree size={14} className="inline mr-2" /> Estructura
           </button>
           <button onClick={() => { setActiveTab("crear"); limpiarForm(); }} className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}>
             <Plus size={14} className="inline mr-2" /> Nueva
           </button>
        </div>
      </div>

      {/* FORMULARIO */}
      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Icono Circular</span>
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
                        {uploadingFoto ? (
                          <div className="text-[#C5A059] animate-pulse font-bold text-[10px]">SUBIENDO...</div> 
                        ) : formData.foto ? (
                          <div className="relative w-full h-full group">
                            <Image src={formData.foto} alt="Icon" fill className="object-cover" unoptimized /> 
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.foto); setFormData({...formData, foto: ""}) }} className="absolute inset-0 m-auto w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20}/></button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 p-4 w-full">
                              <button type="button" onClick={() => iconCamRef.current?.click()} className="w-full bg-black text-[#C5A059] py-2 rounded-xl text-[9px] font-bold uppercase tracking-tighter flex items-center justify-center gap-1"><Camera size={12}/> Cámara</button>
                              <button type="button" onClick={() => iconFileRef.current?.click()} className="w-full bg-white border border-gray-200 text-gray-400 py-2 rounded-xl text-[9px] font-bold uppercase tracking-tighter flex items-center justify-center gap-1"><ImageIcon size={12}/> Archivo</button>
                              <input ref={iconCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                              <input ref={iconFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "foto")} />
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Portada Horizontal</span>
                    <div className="relative w-full h-32 md:h-40 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
                        {uploadingPortada ? (
                          <div className="text-[#C5A059] animate-pulse font-bold text-[10px]">SUBIENDO...</div> 
                        ) : formData.portada ? (
                          <div className="relative w-full h-full group">
                            <Image src={formData.portada} alt="Portada" fill className="object-cover" unoptimized /> 
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.portada); setFormData({...formData, portada: ""}) }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                          </div>
                        ) : (
                          <div className="flex gap-4 p-4 w-full">
                                <button type="button" onClick={() => coverCamRef.current?.click()} className="flex-1 bg-black text-[#C5A059] py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><Camera size={16}/></button>
                                <button type="button" onClick={() => coverFileRef.current?.click()} className="flex-1 bg-white border border-gray-200 text-gray-400 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"><ImageIcon size={16}/></button>
                                <input ref={coverCamRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                                <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, "portada")} />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-1 focus:ring-[#C5A059] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Categoría Superior</label>
                    <select value={formData.padreId} onChange={e => setFormData({...formData, padreId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none text-sm appearance-none">
                        <option value="">-- Principal --</option>
                        {categorias.filter(c => c.id !== formData.id).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none min-h-[100px]" />
                  </div>
                </div>

                <button disabled={loading || uploadingFoto || uploadingPortada} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "CONFIRMAR"}
                </button>
            </form>
        </div>
      )}

      {/* LISTADO */}
      {activeTab === "ver" && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-6 animate-pulse bg-gray-50/50 mb-1 h-20" />
                  ))
                ) : (
                  categorias.map((cat) => (
                    <div key={cat.id} className="grid grid-cols-12 gap-3 items-start p-4 md:px-6 hover:bg-gray-50 transition-colors group">
                        <div className="col-span-3 md:col-span-1 pt-1">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 aspect-square">
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
                                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                    {cat.descripcion || "Sin descripción establecida."}
                                </p>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-2 flex justify-end gap-2 mt-4 md:mt-0 pt-4 md:pt-2">
                            <button onClick={() => handleEditClick(cat)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-black hover:text-[#C5A059] transition-all">✏️</button>
                            <button onClick={() => triggerDelete(cat.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                        </div>
                    </div>
                  ))
                )}
            </div>
        </div>
      )}
    </div>
  );
}