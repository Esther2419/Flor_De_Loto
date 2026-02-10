"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { getSession } from "next-auth/react";
import { createFlor, getFlores, deleteFlor, updateFlor } from "./actions";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage";
import { 
  Plus, LayoutGrid, Camera, Check, X, ZoomIn, 
  Trash2, Image as ImageIcon, Loader2, Info, AlertTriangle 
} from "lucide-react";
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

// --- TIPOS ---
type Flor = {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  foto: string | null;
  precio_unitario: number;
  cantidad: number;
  disponible: boolean;
};

// --- CONFIGURACIÓN DE COLORES (Sincronizada con Envolturas) ---
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
  // --- TONOS GRISES (Para que no salte a Negro) ---
  { name: 'Gris Claro', hex: '#D1D5DB' },
  { name: 'Gris Plata', hex: '#9CA3AF' },
  { name: 'Gris Oscuro', hex: '#4B5563' },
  { name: 'Plomo', hex: '#374151' },
  
  // --- TONOS TIERRA Y CAFÉS ---
  { name: 'Café', hex: '#78350F' },
  { name: 'Terracota', hex: '#A16207' },
  { name: 'Canela', hex: '#B45309' },
  { name: 'Arena', hex: '#F3F4F6' },
  { name: 'Ocre', hex: '#B45309' },

  // --- TONOS FLORALES EXTRAS ---
  { name: 'Vino', hex: '#722F37' },
  { name: 'Borgonia', hex: '#800020' },
  { name: 'Crema', hex: '#F9F6EE' },
  { name: 'Lila', hex: '#C4B5FD' },
  { name: 'Fucsia', hex: '#FF00FF' },
  { name: 'Coral', hex: '#FB7185' },
  { name: 'Salmón', hex: '#FFA07A' },
  { name: 'Turquesa', hex: '#2DD4BF' },
  { name: 'Champagne', hex: '#FDE68A' },
];

// --- UTILIDADES ---
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

    // Fórmula de distancia entre colores
    const dist = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );

    if (dist < minDistance) {
      minDistance = dist;
      nearest = color;
    }
  });

  // Si el color es muy "raro" y está lejos de todos, devolvemos el HEX, 
  // pero con esta nueva lista, casi siempre encontrará un nombre.
  return minDistance < 80 ? nearest.name : hex.toUpperCase();
};

const getColorStyle = (nombreColor: string | null) => {
  if (!nombreColor) return '#ccc';
  const match = COLOR_DETECTION_REF.find(c => c.name.toLowerCase() === nombreColor.toLowerCase());
  return match ? match.hex : (nombreColor.startsWith('#') ? nombreColor : '#C5A059');
};

export default function FloresAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(true);
  const [flores, setFlores] = useState<Flor[]>([]);
  const [selectedFlor, setSelectedFlor] = useState<Flor | null>(null);
  const [currentUser, setCurrentUser] = useState("");

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const [formData, setFormData] = useState({
    id: "", nombre: "", color: "", descripcion: "", precio: "", cantidad: "", foto: "", disponible: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (activeTab === "ver") loadFlores(); }, [activeTab]);
  useEffect(() => { getSession().then((s) => { if (s?.user?.email) setCurrentUser(s.user.email); }); }, []);

  // Lógica automática de disponibilidad basada en stock
  useEffect(() => {
    const qty = parseInt(formData.cantidad) || 0;
    if (qty === 0) setFormData(p => ({ ...p, disponible: false }));
  }, [formData.cantidad]);

  const loadFlores = async () => {
    setLoading(true);
    const data = await getFlores();
    setFlores(data);
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
        const br = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
        if (br < 245 && br > 15) { r += imageData[i]; g += imageData[i + 1]; b += imageData[i + 2]; count++; }
      }
      if (count > 0) {
        const hex = `#${((1 << 24) + (Math.round(r / count) << 16) + (Math.round(g / count) << 8) + Math.round(b / count)).toString(16).slice(1)}`;
        setFormData(prev => ({ ...prev, color: getNameFromHex(hex.toUpperCase()) }));
      }
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
    } catch (err) { 
      setAlertMessage("Error procesando la imagen.");
      setIsAlertOpen(true);
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar" && formData.id)
      ? await updateFlor(formData.id, formData, currentUser)
      : await createFlor(formData, currentUser);
    
    if (res.success) {
      toast(activeTab === "editar" ? "Flor actualizada." : "Nueva flor registrada.", "success");
      resetForm(); setActiveTab("ver"); loadFlores();
    } else {
      setAlertMessage(res.error || "Error al guardar.");
      setIsAlertOpen(true);
    }
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: "", nombre: "", color: "", descripcion: "", precio: "", cantidad: "", foto: "", disponible: true });

  const handleEditClick = (flor: Flor) => {
    setSelectedFlor(null);
    setFormData({ id: flor.id, nombre: flor.nombre, color: flor.color || "", descripcion: flor.descripcion || "", precio: flor.precio_unitario.toString(), cantidad: flor.cantidad.toString(), foto: flor.foto || "", disponible: flor.disponible });
    setActiveTab("editar");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsConfirmOpen(false);
    const florAEliminar = flores.find(f => f.id === itemToDelete);
    if (florAEliminar?.foto) await deleteFromBucket(florAEliminar.foto, 'flores');
    const res = await deleteFlor(itemToDelete);
    if (res.success) {
      toast("Variedad eliminada.", "success");
      setSelectedFlor(null);
      loadFlores();
    } else {
      setAlertMessage(res.error || "Error al eliminar.");
      setIsAlertOpen(true);
    }
    setItemToDelete(null);
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden p-2 md:p-0">
      
      {/* MODALES IGUALES A ENVOLTURAS */}
      <AnimatePresence>
        {isAlertOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAlertOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-gray-100">
                <div className="w-16 h-16 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6"><Info className="text-[#C5A059]" size={32} /></div>
                <h3 className="font-serif italic text-2xl text-gray-800 mb-4">Aviso</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{alertMessage}</p>
                <button onClick={() => setIsAlertOpen(false)} className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-[#C5A059] hover:text-white transition-all">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsConfirmOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-400" size={32} /></div>
                <h3 className="font-serif italic text-2xl text-gray-800 mb-2">¿Estás seguro?</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-8 uppercase tracking-widest font-bold">Deseas eliminar esta flor permanentemente</p>
                <div className="space-y-3">
                    <button onClick={() => setIsConfirmOpen(false)} className="w-full bg-[#0A0A0A] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em]">No, mantenerla</button>
                    <button onClick={confirmDelete} className="w-full text-red-400 py-2 font-bold text-[10px] uppercase tracking-[0.2em] hover:underline">Sí, eliminar variedad</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CROPPER OVERLAY */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2 backdrop-blur-md">
          <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <ZoomIn size={16} className="text-[#C5A059]" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Check size={14} /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Inventario de Flores</h2>
          <p className="text-sm text-gray-500">Gestión de variedades y catálogo.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => setActiveTab("ver")} className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}><LayoutGrid size={14} className="inline mr-2" /> Catálogo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}><Plus size={14} className="inline mr-2" /> Añadir</button>
        </div>
      </div>

      {/* FORMULARIO (ESTRUCTURA GEMELA A ENVOLTURAS) */}
      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-3">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50 overflow-hidden relative min-h-[250px]">
                    {uploading ? (
                        <span className="text-xs font-bold text-[#C5A059] animate-pulse uppercase tracking-widest">Procesando...</span>
                    ) : formData.foto ? (
                        <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-4 border-white shadow-2xl group">
                            <Image src={formData.foto} alt="Preview" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => setFormData({...formData, foto: ""})} className="absolute inset-0 m-auto w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={20} /></button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                             <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest"><Camera size={20} /> Cámara</button>
                             <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest"><ImageIcon size={20} /> Archivo</button>
                             <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nombre de la Flor</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none focus:ring-1 focus:ring-[#C5A059]" />
                  </div>

                  {/* --- SECCIÓN DE COLOR CON TRADUCCIÓN Y PALETA ARTÍSTICA --- */}
                  <div className="col-span-full space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">
                      Color Seleccionado: <span className="text-[#C5A059] font-black">{formData.color || "Personalizado"}</span>
                    </label>
                    
                    <div className="flex flex-wrap gap-4 p-8 bg-white rounded-[3rem] items-center border border-gray-100 shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)]">
                      {/* Botones de Presets (Vibrantes) */}
                      {PRIMARY_PRESETS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.name })}
                          className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${
                            formData.color === c.name 
                              ? 'border-[#0A0A0A] scale-110 shadow-md ring-2 ring-gray-50' 
                              : 'border-white hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}

                      <div className="w-px h-8 bg-gray-100 mx-1" />

                      {/* BOTÓN SELECTOR "PALETA DE PINTOR" */}
                      <div className="relative group">
                        {/* El icono de paleta 🎨 con el input invisible encima */}
                        <div className="w-12 h-12 rounded-full border-4 border-white shadow-md bg-gray-50 flex items-center justify-center overflow-hidden">
                          <span className="text-xl">🎨</span>
                          <input
                            type="color"
                            value={formData.color?.startsWith('#') ? formData.color : '#C5A059'}
                            onChange={(e) => {
                              const hexSelected = e.target.value.toUpperCase();
                              const nombreTraducido = getNameFromHex(hexSelected);
                              setFormData({ ...formData, color: nombreTraducido });
                            }}
                            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                          />
                        </div>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-widest whitespace-nowrap z-30">
                          Color Especial
                        </span>
                      </div>
                    </div>
                    
                    {/* Input de texto que se actualiza automáticamente */}
                    <input 
                      type="text" 
                      placeholder="Nombre o código del color..." 
                      value={formData.color} 
                      onChange={e => setFormData({...formData, color: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 outline-none focus:ring-1 focus:ring-[#C5A059]/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Precio Unitario (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} onWheel={(e) => (e.target as HTMLInputElement).blur()} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Stock Disponible</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} onWheel={(e) => (e.target as HTMLInputElement).blur()} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" rows={3} placeholder="Detalles de la variedad..." />
                  </div>

                  <div className={`col-span-full p-5 rounded-2xl flex items-center justify-between border transition-colors ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col"><span className="text-sm font-bold">Disponibilidad</span><span className="text-[10px] text-gray-400 uppercase">{isStockZero ? "Sin stock" : "¿Activar en catálogo?"}</span></div>
                    <label className={`relative inline-flex items-center ${isStockZero ? 'opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} disabled={isStockZero} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "CONFIRMAR"}
                </button>
            </form>
        </div>
      )}

      {/* GRID DE FLORES */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white border border-gray-100 rounded-3xl h-64 animate-pulse" />)
            ) : (
              flores.map((flor) => (
                <div 
                  key={flor.id} 
                  onClick={() => setSelectedFlor(flor)} 
                  className={`bg-white border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all relative cursor-pointer group ${!flor.disponible ? 'opacity-70 grayscale' : 'border-gray-50 hover:border-[#C5A059]/20'}`}
                >
                  {/* --- CONTENEDOR DE IMAGEN CON BADGES --- */}
                  <div className="relative h-64 bg-gray-50 overflow-hidden">
                    {/* BADGE DE STOCK (Superior Izquierda) */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-white/90 backdrop-blur-md text-black px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm border border-gray-100">
                        Stock: {flor.cantidad}
                      </span>
                    </div>

                    {/* BADGE DE DISPONIBILIDAD (Inferior Derecha) */}
                    {flor.disponible && flor.cantidad > 0 && (
                      <div className="absolute bottom-4 right-4 z-10">
                        <span className="bg-[#25D366] text-white px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-lg animate-in fade-in zoom-in duration-300">
                          Disponible
                        </span>
                      </div>
                    )}

                    {/* IMAGEN PRINCIPAL */}
                    {flor.foto ? (
                      <Image 
                        src={flor.foto} 
                        alt={flor.nombre} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700" 
                        unoptimized 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl bg-gray-100">🌸</div>
                    )}
                  </div>

                  {/* --- INFORMACIÓN INFERIOR (ESTILO PAPEL COREANO) --- */}
                  <div className="p-6 text-center space-y-2">
                    <h3 className="font-serif font-bold text-gray-800 text-lg leading-tight">
                      {flor.nombre}
                    </h3>
                    
                    <p className="text-[#C5A059] font-bold text-md">
                      {flor.precio_unitario} Bs
                    </p>

                    {/* INDICADOR DE COLOR REDONDEADO */}
                    <div className="flex justify-center items-center gap-2 pt-1">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shadow-inner border border-gray-100" 
                        style={{ backgroundColor: getColorStyle(flor.color) }}
                      ></div>
                      <span className="text-[9px] text-gray-400 uppercase font-bold tracking-[0.15em]">
                        {flor.color || 'Sin color'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>
      )}

      {/* MODAL DETALLE */}
      <AnimatePresence>
        {selectedFlor && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFlor(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative">
              <button onClick={() => setSelectedFlor(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-2 hover:bg-black/40"><X size={20}/></button>
              <div className="relative h-64 bg-gray-100">{selectedFlor.foto && <Image src={selectedFlor.foto} alt="P" fill className="object-cover" unoptimized />}</div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4"><h3 className="font-serif text-2xl text-[#0A0A0A]">{selectedFlor.nombre}</h3><span className="text-[#C5A059] font-bold text-xl">Bs {selectedFlor.precio_unitario}</span></div>
                <div className="space-y-4 mb-8">
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">Color: <div className="w-2 h-2 rounded-full border border-gray-300" style={{backgroundColor: getColorStyle(selectedFlor.color)}}></div> {selectedFlor.color}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">Stock: {selectedFlor.cantidad}</span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed italic">{selectedFlor.descripcion || "Sin descripción adicional."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleEditClick(selectedFlor)} className="bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] hover:text-white flex items-center justify-center gap-2">Editar</button>
                  <button onClick={() => { setItemToDelete(selectedFlor.id); setIsConfirmOpen(true); }} className="bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white flex items-center justify-center gap-2">Eliminar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}