"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { getGaleria, createGaleriaItem, deleteGaleriaItem, updateGaleriaItem } from "./actions";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage";
import { Plus, LayoutGrid, Camera, Check, X, ZoomIn, Trash2, Image as ImageIcon, Loader2, Edit3, AlertCircle } from "lucide-react";
import Cropper from 'react-easy-crop';

// --- UTILIDADES DE IMAGEN ---
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<File> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; 
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "trabajo.webp", { type: "image/webp" }));
    }, 'image/webp', 0.8);
  });
};

export default function GaleriaAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear">("ver");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // --- NUEVOS ESTADOS DE INTERFAZ ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{id: string, url: string} | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [formData, setFormData] = useState({ id: "", foto: "", descripcion: "" });
  const [uploading, setUploading] = useState(false);

  const BUCKET_NAME = 'galeria';

  // Función para mostrar notificaciones elegantes
  const showNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { if (activeTab === "ver") loadData(); }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getGaleria();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({ id: "", foto: "", descripcion: "" });
    setIsEditing(false);
    setImageToCrop(null);
  };

  const handleStartEdit = (item: any) => {
    setFormData({ id: item.id, foto: item.url_foto, descripcion: item.descripcion });
    setIsEditing(true);
    setActiveTab("crear");
    setSelectedItem(null);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const url = await uploadToBucket(croppedFile, BUCKET_NAME);
      
      if (url) setFormData(prev => ({ ...prev, foto: url }));
      setImageToCrop(null);
      showNotice("Imagen procesada correctamente");
    } catch (err) { 
      showNotice("No se pudo procesar la imagen.", "error");
    } finally { 
      setUploading(false); 
    }
  };

  // --- MANEJO DE ACCIONES ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.foto) return showNotice("Debes subir una foto", "error");
    setShowConfirmModal(true);
  };

  const handleExecuteSave = async () => {
    setLoading(true);
    const res = isEditing 
        ? await updateGaleriaItem(formData.id, formData.foto, formData.descripcion)
        : await createGaleriaItem(formData.foto, formData.descripcion);
    
    if (res.success) {
      showNotice(isEditing ? "Cambios guardados con éxito" : "¡Nueva foto publicada!");
      resetForm(); 
      setActiveTab("ver"); 
      loadData();
      setShowConfirmModal(false);
    } else {
      showNotice(res.error || "Ocurrió un error inesperado", "error");
    }
    setLoading(false);
  };

  const handleDelete = (id: string, url: string) => {
    setShowDeleteModal({ id, url });
  };

  const handleExecuteDelete = async () => {
    if (!showDeleteModal) return;
    setLoading(true);
    try {
        await deleteFromBucket(showDeleteModal.url, BUCKET_NAME);
        const res = await deleteGaleriaItem(showDeleteModal.id);
        if (res.success) { 
          showNotice("Eliminado de la galería");
          setSelectedItem(null); 
          setShowDeleteModal(null);
          loadData(); 
        }
    } catch {
        showNotice("Error al eliminar el archivo", "error");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2 md:p-0">
      
      {/* 1. NOTIFICACIÓN TOAST */}
      {toast && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl border animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' ? 'bg-zinc-900 border-[#C5A059]/30 text-white' : 'bg-red-600 border-none text-white'
        }`}>
          {toast.type === 'success' ? <Check className="text-[#C5A059]" size={18}/> : <AlertCircle size={18}/>}
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.msg}</p>
        </div>
      )}

      {/* 2. MODAL DE CONFIRMACIÓN DE GUARDADO */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-zinc-900 p-10 text-center">
               <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/20">
                <ImageIcon className="text-[#C5A059]" size={28} />
              </div>
              <h2 className="text-xl font-serif italic text-white">¿Publicar cambios?</h2>
            </div>
            <div className="p-8 flex flex-col gap-3">
                <button onClick={handleExecuteSave} disabled={loading} className="w-full bg-[#C5A059] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18}/> : "SÍ, CONFIRMAR"}
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="w-full py-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">Regresar</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={28} />
              </div>
              <h2 className="text-xl font-serif italic text-zinc-800">¿Eliminar permanentemente?</h2>
              <p className="text-zinc-400 text-xs mt-2">Esta acción no se puede deshacer.</p>
            </div>
            <div className="p-8 pt-0 flex flex-col gap-3">
                <button onClick={handleExecuteDelete} disabled={loading} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18}/> : "ELIMINAR AHORA"}
                </button>
                <button onClick={() => setShowDeleteModal(null)} className="w-full py-2 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* MODAL RECORTE */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2 md:p-4 backdrop-blur-md">
          <div className="relative w-full h-[50vh] md:h-[65vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <ZoomIn size={16} className="text-[#C5A059]" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-white/10">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="animate-spin" size={14}/> : <Check size={14} />} Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-serif italic text-gray-800 tracking-tighter">{isEditing ? "Editar Trabajo" : "Galería de Trabajos"}</h2>
          <p className="text-sm text-gray-500 font-medium">{isEditing ? "Modifica la información seleccionada." : "Publica fotos de tus entregas y eventos reales."}</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
           <button onClick={() => { setActiveTab("ver"); resetForm(); loadData(); }} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}>
             <LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Ver Todo
           </button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}>
             <Plus size={14} className="inline mr-2 -mt-0.5" /> Nueva Foto
           </button>
        </div>
      </div>

      {/* SECCIÓN CREAR / EDITAR */}
      {activeTab === "crear" && (
        <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-full w-44 h-44 mx-auto bg-gray-50 overflow-hidden relative shadow-inner">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-[#C5A059]" size={24} />
                          <span className="text-[#C5A059] font-bold text-[10px] uppercase">Procesando...</span>
                        </div>
                    ) : formData.foto ? (
                        <div className="relative w-full h-full group">
                            <Image src={formData.foto} alt="Preview" fill className="object-cover" unoptimized />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full text-gray-700 shadow-lg hover:scale-110 transition-transform"><Camera size={18}/></button>
                                <button type="button" onClick={() => setFormData({...formData, foto: ""})} className="p-2 bg-red-500 rounded-full text-white shadow-lg hover:scale-110 transition-transform"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full h-full justify-center p-4">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-[#0A0A0A] text-[#C5A059] py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                                <Camera size={16} /> Cámara
                               </button>
                               <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
                                <ImageIcon size={16} /> Archivo
                               </button>
                               <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Descripción del Trabajo</label>
                    <textarea 
                        required 
                        value={formData.descripcion} 
                        onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                        className="w-full bg-gray-50 border-none rounded-2xl p-4 min-h-[120px] outline-none text-sm focus:ring-1 focus:ring-[#C5A059]" 
                        placeholder="Ej: Decoración de boda religiosa en Templo Santa Teresa..." 
                    />
                </div>

                <div className="flex gap-4">
                    {isEditing && (
                        <button type="button" onClick={() => { setActiveTab("ver"); resetForm(); }} className="flex-1 bg-gray-100 text-gray-500 py-5 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                            Cancelar
                        </button>
                    )}
                    <button disabled={loading || uploading} type="submit" className="flex-[2] bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={24} /> : isEditing ? "GUARDAR CAMBIOS" : "PUBLICAR EN GALERÍA"}
                    </button>
                </div>
            </form>
        </div>
      )}

      {/* CUADRÍCULA DE TRABAJOS CON DESCRIPCIÓN OVERLAY */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border border-[#F5EFE6] rounded-[2rem] aspect-square overflow-hidden animate-pulse flex items-center justify-center shadow-sm">
                   <ImageIcon className="text-[#F5EFE6]" size={32} />
                </div>
              ))
            ) : items.length > 0 ? (
              items.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedItem(item)} 
                  className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer relative aspect-square group"
                >
                    <Image src={item.url_foto} alt="Trabajo" fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                    
                    {/* Overlay de descripción */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
                        <p className="text-white text-[11px] md:text-xs font-serif italic leading-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-500 line-clamp-3">
                          {item.descripcion}
                        </p>
                        <div className="w-8 h-[1px] bg-[#C5A059] mt-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-100" />
                    </div>
                </div>
              ))
            ) : (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                    <ImageIcon className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="text-gray-400 font-serif italic text-xl">Tu galería está vacía</p>
                </div>
            )}
        </div>
      )}

      {/* MODAL DE DETALLE */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-2 hover:bg-black/40"><X size={20}/></button>
            <div className="relative h-80 bg-gray-100">
                <Image src={selectedItem.url_foto} alt="Detalle" fill className="object-cover" unoptimized />
            </div>
            <div className="p-8 space-y-4 text-center">
              <h3 className="font-serif italic text-xl text-gray-800 mb-6 leading-tight">"{selectedItem.descripcion}"</h3>
              
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleStartEdit(selectedItem)} className="bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#C5A059] hover:text-white transition-colors">
                    <Edit3 size={16} /> Editar
                  </button>
                  <button onClick={() => handleDelete(selectedItem.id, selectedItem.url_foto)} className="bg-red-50 text-red-500 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors">
                    <Trash2 size={18} /> Eliminar
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}