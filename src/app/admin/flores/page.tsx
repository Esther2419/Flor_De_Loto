"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { getSession } from "next-auth/react";
import { createFlor, getFlores, deleteFlor, updateFlor } from "./actions";
import { Flower2, Plus, LayoutGrid, Camera, Check, X, ZoomIn, Trash2, Image as ImageIcon } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';

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

// 1. Colores primarios (Botones rápidos)
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

// 2. Referencia para detección automática (Traduce códigos a nombres)
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

// --- UTILIDADES DE IMAGEN Y COLOR ---
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
    const dist = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    if (dist < minDistance) { minDistance = dist; nearest = color; }
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [formData, setFormData] = useState({
    id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (activeTab === "ver") loadFlores(); }, [activeTab]);
  useEffect(() => { getSession().then((s) => { if (s?.user?.email) setCurrentUser(s.user.email); }); }, []);

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

  const deleteImageFromStorage = async (url: string) => {
    if (!url) return;
    try {
      const fileName = url.split('/').pop();
      if (fileName) await supabase.storage.from('flores').remove([fileName]);
    } catch (e) { console.error("Error storage:", e); }
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
        const pr = imageData[i], pg = imageData[i + 1], pb = imageData[i + 2];
        const brightness = (pr + pg + pb) / 3;
        if (brightness < 245 && brightness > 15) { r += pr; g += pg; b += pb; count++; }
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

  const onCropComplete = useCallback((_: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setUploading(true);
    setImageToCrop(null);

    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1000, useWebWorker: true, fileType: "image/webp" };
      const compressedFile = await imageCompression(croppedFile, options);

      if (formData.foto) await deleteImageFromStorage(formData.foto);

      const fileName = `flor_${Date.now()}.webp`;
      const { error } = await supabase.storage.from('flores').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('flores').getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, foto: data.publicUrl }));
      analyzeColor(data.publicUrl);
    } catch (err) { alert("Error procesando imagen"); } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = (activeTab === "editar" && formData.id)
      ? await updateFlor(formData.id, formData, currentUser)
      : await createFlor(formData, currentUser);
    if (res.success) {
      alert(activeTab === "editar" ? "¡Inventario actualizado!" : "¡Flor registrada!");
      resetForm(); setActiveTab("ver"); loadFlores();
    } else alert(res.error);
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: "", nombre: "", descripcion: "", color: "", precio: "", cantidad: "", foto: "", disponible: true });

  const handleEditClick = (flor: Flor) => {
    setSelectedFlor(null);
    setFormData({ 
        id: flor.id, nombre: flor.nombre, descripcion: flor.descripcion || "", 
        color: flor.color || "", precio: flor.precio_unitario.toString(), 
        cantidad: flor.cantidad.toString(), foto: flor.foto || "", disponible: flor.disponible 
    });
    setActiveTab("editar");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar permanentemente?")) {
        const florAEliminar = flores.find(f => f.id === id);
        if (florAEliminar?.foto) await deleteImageFromStorage(florAEliminar.foto);
        const res = await deleteFlor(id);
        if (res.success) { setSelectedFlor(null); loadFlores(); } else { alert(res.error); }
    }
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-2 md:p-0">
      
      {/* MODAL CROP RESPONSIVO */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2 md:p-4 backdrop-blur-md">
          <div className="relative w-full h-[50vh] md:h-[65vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} />
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
          <h2 className="text-2xl font-serif italic text-gray-800">Inventario de Flores</h2>
          <p className="text-sm text-gray-500">Gestiona variedades, stock y precios.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
           <button onClick={() => setActiveTab("ver")} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
             <LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Ver Todo
           </button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}>
             <Plus size={14} className="inline mr-2 -mt-0.5" /> Añadir Flor
           </button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif italic text-xl text-gray-800">{activeTab === "crear" ? "Nueva Variedad" : "Editar Variedad"}</h3>
                <button onClick={() => setActiveTab('ver')} className="text-xs text-red-400 hover:text-red-500 font-bold uppercase">Cancelar</button>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                {/* SECCIÓN FOTO DUAL CIRCULAR CON BORRADO VISIBLE */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-full w-40 h-40 md:w-48 md:h-48 mx-auto bg-gray-50 overflow-hidden relative shadow-inner">
                    {uploading ? (
                        <div className="text-[#C5A059] animate-pulse font-bold text-[10px] text-center px-4 uppercase">Analizando...</div>
                    ) : formData.foto ? (
                        <div className="relative w-full h-full group">
                            <Image src={formData.foto} alt="Preview" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.foto); setFormData({...formData, foto: ""})}} className="absolute inset-0 m-auto w-12 h-12 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm z-10 active:scale-90 transition-transform"><Trash2 size={24} /></button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 w-full h-full justify-center p-4">
                             <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-[#0A0A0A] text-[#C5A059] py-2.5 rounded-xl text-[10px] font-bold uppercase shadow-sm flex items-center justify-center gap-1">
                                <Camera size={14} /> Cámara
                              </button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-gray-500 py-2.5 rounded-xl text-[10px] font-bold uppercase shadow-sm flex items-center justify-center gap-1">
                                <ImageIcon size={14} /> Galería
                              </button>
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej: Rosa Roja" />
                  </div>

                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Color</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 justify-center md:justify-start">
                            {PRIMARY_PRESETS.map((c) => (
                                <button key={c.hex} type="button" onClick={() => setFormData({ ...formData, color: c.name })} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c.name ? 'ring-2 ring-black ring-offset-1 scale-110 shadow-md' : 'border-white'}`} style={{ backgroundColor: c.hex }} title={c.name} />
                            ))}
                            <div className="w-px h-8 bg-gray-200 mx-1"></div>
                            <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-[#C5A059] flex items-center justify-center bg-white overflow-hidden">
                                <span className="text-xs">🎨</span>
                                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" onChange={(e) => setFormData({ ...formData, color: getNameFromHex(e.target.value) })} />
                            </div>
                        </div>
                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-sm outline-none" placeholder="Nombre del color" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Precio Unitario (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Stock Actual</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none" />
                  </div>

                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Descripción</label>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none min-h-[100px]" placeholder="Detalles de la flor..." />
                  </div>

                  <div className={`col-span-full p-4 rounded-2xl flex items-center justify-between border ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className="flex flex-col"><span className="text-sm font-bold text-gray-800">Disponibilidad</span><span className="text-[10px] text-gray-400 uppercase">{isStockZero ? "Agotado automáticamente" : "¿Visible para ventas?"}</span></div>
                    <label className={`relative inline-flex items-center ${isStockZero ? 'opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} disabled={isStockZero} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-5 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl">
                  {loading ? "PROCESANDO..." : "CONFIRMAR VARIEDAD"}
                </button>
            </form>
        </div>
      )}

      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in">
            {flores.map((flor) => (
                <div key={flor.id} onClick={() => setSelectedFlor(flor)} className={`bg-white border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all relative cursor-pointer ${!flor.disponible ? 'opacity-70 grayscale' : 'border-gray-100'}`}>
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        {flor.foto ? <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-3xl opacity-20">🌸</div>}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[8px] font-bold uppercase shadow-sm">Stock: {flor.cantidad}</div>
                    </div>
                    <div className="p-4 text-center">
                        <h3 className="font-serif font-bold text-gray-800 text-sm truncate uppercase tracking-tighter leading-tight mb-1">{flor.nombre}</h3>
                        <p className="text-[#C5A059] font-bold text-xs">{flor.precio_unitario} Bs</p>
                        <div className="flex justify-center items-center gap-1.5 mt-2">
                             <div className="w-3 h-3 rounded-full shadow-inner border border-gray-100" style={{ backgroundColor: getColorStyle(flor.color) }}></div>
                             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">{flor.color || 'Sin color'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {selectedFlor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedFlor(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedFlor(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-2"><X size={20}/></button>
            <div className="relative h-64 bg-gray-100">{selectedFlor.foto && <Image src={selectedFlor.foto} alt="P" fill className="object-cover" unoptimized />}</div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4"><h3 className="font-serif text-2xl text-[#0A0A0A] leading-tight">{selectedFlor.nombre}</h3><span className="text-[#C5A059] font-bold text-xl whitespace-nowrap">Bs {selectedFlor.precio_unitario}</span></div>
              <div className="space-y-4 mb-8">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedFlor.descripcion || "Sin descripción adicional."}</p>
                <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">Color: <div className="w-2 h-2 rounded-full" style={{backgroundColor: getColorStyle(selectedFlor.color)}}></div> {selectedFlor.color}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Stock: {selectedFlor.cantidad}</span>
                  <span className={`px-3 py-1 rounded-full ${selectedFlor.disponible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{selectedFlor.disponible ? "Disponible" : "Agotado"}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleEditClick(selectedFlor)} className="bg-[#0A0A0A] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center justify-center gap-2"><span>✏️</span> Editar</button>
                <button onClick={() => handleDelete(selectedFlor.id)} className="bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><span>🗑️</span> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}