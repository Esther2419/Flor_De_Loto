"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { getSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, LayoutGrid, Camera, Check, X, ZoomIn, 
  Trash2, Image as ImageIcon, Loader2, Info, AlertTriangle 
} from "lucide-react";
import Cropper from 'react-easy-crop';

// --- ACCIONES (Asegúrate de que estas rutas sean correctas en tu proyecto) ---
import { createFlor, getFlores, deleteFlor, updateFlor } from "./actions";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage";

// --- TIPOS ---
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

// --- CONSTANTES ---
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
  { name: 'Vino', hex: '#722F37' },
  { name: 'Crema', hex: '#F9F6EE' },
  { name: 'Lila', hex: '#C4B5FD' },
];

// --- COMPONENTES AUXILIARES DE UI (MODALES) ---

const AlertModal = ({ isOpen, message, onClose }: { isOpen: boolean; message: string; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-gray-100">
          <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="text-[#C5A059]" size={32} />
          </div>
          <h3 className="font-serif italic text-2xl text-gray-800 mb-4">Aviso de Flor de Loto</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">{message}</p>
          <button onClick={onClose} className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all">
            Entendido
          </button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ConfirmModal = ({ isOpen, onConfirm, onCancel, itemName }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; itemName: string }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-400" size={32} />
          </div>
          <h3 className="font-serif italic text-2xl text-gray-800 mb-2">¿Eliminar variedad?</h3>
          <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-8">Confirmas eliminar permanentemente "{itemName}"</p>
          <div className="space-y-3">
            <button onClick={onConfirm} className="w-full bg-[#0A0A0A] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 transition-all">Sí, eliminar</button>
            <button onClick={onCancel} className="w-full text-gray-400 py-2 font-bold text-[10px] uppercase tracking-[0.2em] hover:underline">Cancelar</button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

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
      resolve(new File([blob!], "flor.webp", { type: "image/webp" }));
    }, 'image/webp', 0.8);
  });
};

const getNameFromHex = (hex: string) => {
  const r1 = parseInt(hex.slice(1, 3), 16), g1 = parseInt(hex.slice(3, 5), 16), b1 = parseInt(hex.slice(5, 7), 16);
  let nearest = COLOR_DETECTION_REF[0], minDistance = Infinity;
  COLOR_DETECTION_REF.forEach(color => {
    const r2 = parseInt(color.hex.slice(1, 3), 16), g2 = parseInt(color.hex.slice(3, 5), 16), b2 = parseInt(color.hex.slice(5, 7), 16);
    const dist = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    if (dist < minDistance) { minDistance = dist; nearest = color; }
  });
  return nearest.name;
};

// --- COMPONENTE PRINCIPAL ---

export default function FloresAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [selectedFlor, setSelectedFlor] = useState<Flor | null>(null);
  const [currentUser, setCurrentUser] = useState("");

  // ESTADOS PARA MODALES DE MENSAJE
  const [alert, setAlert] = useState({ open: false, msg: "" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: "", name: "" });

  // ESTADOS DE IMAGEN Y CROP
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // ESTADOS DE FORMULARIO
  const [formData, setFormData] = useState({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (activeTab === "ver") loadFlores(); }, [activeTab]);
  useEffect(() => { getSession().then((s) => { if (s?.user?.email) setCurrentUser(s.user.email); }); }, []);

  const showAlert = (msg: string) => setAlert({ open: true, msg });

  const loadFlores = async () => {
    setLoading(true);
    try {
      const data = await getFlores();
      setFlores(data || []);
    } finally { setLoading(false); }
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
        const br = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        if (br < 245 && br > 15) { r += imageData[i]; g += imageData[i + 1]; b += imageData[i + 2]; count++; }
      }
      if (count > 0) {
        const hex = `#${((1 << 24) + (Math.round(r / count) << 16) + (Math.round(g / count) << 8) + Math.round(b / count)).toString(16).slice(1)}`;
        setFormData(prev => ({ ...prev, color: getNameFromHex(hex.toUpperCase()) }));
      }
      img.onload = null;
    };
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setUploading(true);
    setImageToCrop(null);
    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (formData.foto) await deleteFromBucket(formData.foto, 'flores');
      const url = await uploadToBucket(croppedFile, 'flores');
      if (url) {
        setFormData(prev => ({ ...prev, foto: url }));
        analyzeColor(url);
      }
    } catch (err) { showAlert("Error al procesar la imagen."); }
    finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar") 
      ? await updateFlor(formData.id, formData, currentUser) 
      : await createFlor(formData, currentUser);
    
    if (res.success) {
      resetForm(); setActiveTab("ver"); loadFlores();
    } else {
      showAlert(res.error || "No se pudo guardar la información.");
    }
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true });

  const handleConfirmedDelete = async () => {
    const { id } = confirmDelete;
    setConfirmDelete({ ...confirmDelete, open: false });
    const flor = flores.find(f => f.id === id);
    if (flor?.foto) await deleteFromBucket(flor.foto, 'flores');
    const res = await deleteFlor(id);
    if (res.success) { setSelectedFlor(null); loadFlores(); } 
    else { showAlert(res.error || "No se pudo eliminar."); }
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      
      {/* --- MODALES DEL SISTEMA --- */}
      <AlertModal isOpen={alert.open} message={alert.msg} onClose={() => setAlert({ ...alert, open: false })} />
      <ConfirmModal isOpen={confirmDelete.open} itemName={confirmDelete.name} onConfirm={handleConfirmedDelete} onCancel={() => setConfirmDelete({ ...confirmDelete, open: false })} />

      {/* --- MODAL CROP --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full h-[65vh] rounded-[2rem] overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={useCallback((_: any, px: any) => setCroppedAreaPixels(px), [])} onZoomChange={setZoom} />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
              <ZoomIn size={16} className="text-[#C5A059]" />
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-white/10">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"><Check size={14} /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-serif italic text-gray-800">Panel de Inventario</h2>
          <p className="text-sm text-gray-400 font-medium">Gestión de stock para Flor de Loto.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl">
           <button onClick={() => setActiveTab("ver")} className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
             <LayoutGrid size={14} className="inline mr-2" /> Stock
           </button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}>
             <Plus size={14} className="inline mr-2" /> Nueva Flor
           </button>
        </div>
      </div>

      {/* --- FORMULARIO (CREAR/EDITAR) --- */}
      {(activeTab === "crear" || activeTab === "editar") && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-12 rounded-[2.5rem] border border-gray-50 shadow-sm">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-10">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-[3rem] p-12 bg-gray-50/30 relative min-h-[300px]">
                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="animate-spin text-[#C5A059]" size={32} />
                          <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em]">Analizando...</span>
                        </div>
                    ) : formData.foto ? (
                        <div className="relative w-52 h-52 rounded-full overflow-hidden border-8 border-white shadow-2xl group">
                            <Image src={formData.foto} alt="Flor" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => setFormData({...formData, foto: ""})} className="absolute inset-0 m-auto w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20} /></button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                             <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-3 bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                                <Camera size={18} /> Cámara
                              </button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-3 bg-white text-gray-400 border border-gray-100 py-5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] active:scale-95 transition-all">
                                <ImageIcon size={18} /> Galería
                              </button>
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                  <div className="col-span-full space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-lg outline-none focus:ring-2 focus:ring-[#C5A059]/10" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Precio (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Stock</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="col-span-full space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Color Seleccionado: <span className="text-[#C5A059]">{formData.color}</span></label>
                    <div className="flex flex-wrap gap-3 p-5 bg-gray-50/50 rounded-[2rem]">
                        {PRIMARY_PRESETS.map((c) => (
                            <button key={c.hex} type="button" onClick={() => setFormData({ ...formData, color: c.name })} className={`w-10 h-10 rounded-full border-4 transition-all ${formData.color === c.name ? 'border-black scale-110 shadow-lg' : 'border-white opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c.hex }} />
                        ))}
                    </div>
                  </div>

                  <div className="col-span-full space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" rows={4} />
                  </div>
                </div>

                <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-6 rounded-2xl font-bold tracking-[0.3em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={24} /> : "Actualizar Catálogo"}
                </button>
            </form>
        </motion.div>
      )}

      {/* --- GRILLA DE INVENTARIO --- */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-gray-100 rounded-[2.5rem] aspect-[3/4] animate-pulse" />)
            ) : flores.map((flor) => (
                <motion.div layout key={flor.id} onClick={() => setSelectedFlor(flor)} className={`bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-50 group relative ${!flor.disponible ? 'grayscale opacity-70' : ''}`}>
                    <div className="absolute top-5 left-5 z-10">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${flor.cantidad > 0 ? 'bg-white/90 backdrop-blur-md text-black shadow-sm' : 'bg-red-500 text-white'}`}>
                          {flor.cantidad > 0 ? `Quedan: ${flor.cantidad}` : 'Sin Stock'}
                        </span>
                    </div>
                    <div className="relative h-64 overflow-hidden bg-gray-50">
                        {flor.foto ? <Image src={flor.foto} alt={flor.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-1000" unoptimized /> : <div className="flex items-center justify-center h-full text-5xl">🌸</div>}
                    </div>
                    <div className="p-8 text-center">
                        <h3 className="font-serif font-bold text-xl text-gray-800 mb-2 truncate">{flor.nombre}</h3>
                        <p className="text-[#C5A059] font-bold text-sm tracking-[0.1em]">Bs. {flor.precio_unitario}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      )}

      {/* --- MODAL DETALLE FLUIDO --- */}
      <AnimatePresence>
        {selectedFlor && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedFlor(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden relative" onClick={e => e.stopPropagation()}>
              
              <div className="relative h-96">
                {selectedFlor.foto && <Image src={selectedFlor.foto} alt="Flor" fill className="object-cover" unoptimized />}
                <button onClick={() => setSelectedFlor(null)} className="absolute top-6 right-6 bg-black/30 backdrop-blur-md text-white rounded-full p-3 hover:bg-black/50 transition-colors"><X size={24}/></button>
              </div>

              <div className="p-10 md:p-14">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="font-serif text-3xl text-gray-800 mb-3">{selectedFlor.nombre}</h3>
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: PRIMARY_PRESETS.find(p => p.name === selectedFlor.color)?.hex || '#C5A059' }}></div>
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{selectedFlor.color}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#C5A059]">Bs {selectedFlor.precio_unitario}</p>
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-1">Precio Unitario</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed mb-10 line-clamp-4">{selectedFlor.descripcion || "Esta variedad pertenece a la colección exclusiva de Flor de Loto."}</p>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => {
                    setFormData({ id: selectedFlor.id, nombre: selectedFlor.nombre, descripcion: selectedFlor.descripcion || "", color: selectedFlor.color || "", precio: selectedFlor.precio_unitario.toString(), cantidad: selectedFlor.cantidad.toString(), foto: selectedFlor.foto || "", disponible: selectedFlor.disponible });
                    setSelectedFlor(null); setActiveTab("editar");
                  }} className="bg-[#0A0A0A] text-white py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#C5A059] transition-all flex items-center justify-center gap-3 shadow-xl">✏️ Editar Registro</button>
                  
                  <button onClick={() => setConfirmDelete({ open: true, id: selectedFlor.id, name: selectedFlor.nombre })} className="bg-red-50 text-red-500 border border-red-100 py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3">🗑️ Borrar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}