"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase"; 
import { getSession } from "next-auth/react";
import { createEnvoltura, getEnvolturas, deleteEnvoltura, updateEnvoltura } from "./actions";
import { Gift, Plus, LayoutGrid, Camera, Check, X, ZoomIn, Trash2, Image as ImageIcon } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';

// --- TIPOS ---
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

// --- CONFIGURACIÓN DE COLORES ---
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
      resolve(new File([blob!], "material.webp", { type: "image/webp" }));
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

  // REFERENCIAS INPUTS
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // ESTADOS RECORTE
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  const deleteImageFromStorage = async (url: string) => {
    if (!url) return;
    try {
      const fileName = url.split('/').pop();
      if (fileName) await supabase.storage.from('envolturas').remove([fileName]);
    } catch (e) { console.error("Error al borrar storage:", e); }
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

      const fileName = `env_${Date.now()}.webp`;
      const { error } = await supabase.storage.from('envolturas').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('envolturas').getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, foto: data.publicUrl }));
      analyzeColor(data.publicUrl);
    } catch (err) { alert("Error procesando imagen"); } finally { setUploading(false); }
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
    } else alert(res.error);
    setLoading(false);
  };

  const resetForm = () => setFormData({ id: "", nombre: "", color: "", diseno: "", precio: "", cantidad: "", foto: "", disponible: true });

  const handleEditClick = (env: Envoltura) => {
    setSelectedEnvoltura(null);
    setFormData({ id: env.id, nombre: env.nombre, color: env.color || "", diseno: env.diseno || "", precio: env.precio_unitario.toString(), cantidad: env.cantidad.toString(), foto: env.foto || "", disponible: env.disponible });
    setActiveTab("editar");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar permanentemente este material?")) {
      const envAEliminar = envolturas.find(e => e.id === id);
      if (envAEliminar?.foto) await deleteImageFromStorage(envAEliminar.foto);
      const res = await deleteEnvoltura(id);
      if (res.success) { setSelectedEnvoltura(null); loadEnvolturas(); }
    }
  };

  const isStockZero = (parseInt(formData.cantidad) || 0) === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* MODAL CROP */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                <ZoomIn size={16} className="text-[#C5A059]" />
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-white/10">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2"><Check size={14} /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Inventario de Envolturas</h2>
          <p className="text-sm text-gray-500">Papeles, cajas y cintas.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => setActiveTab("ver")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}><LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Ver Todo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}><Plus size={14} className="inline mr-2 -mt-0.5" /> Añadir Material</button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                
                {/* SECCIÓN FOTO DUAL */}
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50 overflow-hidden relative min-h-[250px]">
                    {uploading ? (
                        <span className="text-xs font-bold text-[#C5A059] animate-pulse uppercase tracking-widest">Procesando imagen...</span>
                    ) : formData.foto ? (
                        <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-4 border-white shadow-2xl group">
                            <Image src={formData.foto} alt="Preview" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => { deleteImageFromStorage(formData.foto); setFormData({...formData, foto: ""})}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 w-full max-w-xs">
                             <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                                <Camera size={20} /> CÁMARA
                              </button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                                <ImageIcon size={20} /> GALERÍA
                              </button>
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e)} />
                        </div>
                    )}
                </div>

                {/* FORMULARIO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nombre</label>
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Ej: Papel Kraft Premium" />
                  </div>

                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Color</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            {PRIMARY_PRESETS.map((c) => (
                                <button key={c.hex} type="button" onClick={() => setFormData({ ...formData, color: c.name })} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c.name ? 'ring-2 ring-[#0A0A0A] ring-offset-1 scale-110 shadow-md' : 'border-white hover:scale-105'}`} style={{ backgroundColor: c.hex }} />
                            ))}
                            <div className="w-px h-8 bg-gray-200 mx-1"></div>
                            <div className="relative w-8 h-8 rounded-full border-2 border-dashed border-[#C5A059] flex items-center justify-center bg-white overflow-hidden">
                                <span className="text-xs">🎨</span>
                                <input type="color" className="absolute inset-0 opacity-0 cursor-pointer scale-150" onChange={(e) => setFormData({ ...formData, color: getNameFromHex(e.target.value) })} />
                            </div>
                        </div>
                        <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-[#0A0A0A] font-bold text-sm outline-none" placeholder="Color detectado..." />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Precio (Bs)</label>
                    <input required type="number" step="0.5" value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Stock</label>
                    <input required type="number" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 outline-none" />
                  </div>

                  <div className="col-span-full space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Diseño / Acabado</label>
                    <input type="text" value={formData.diseno} onChange={e => setFormData({...formData, diseno: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 outline-none" placeholder="Ej: Lunares, Metalizado..." />
                  </div>

                  <div className={`col-span-full p-4 rounded-2xl flex items-center justify-between border transition-colors ${isStockZero ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex flex-col"><span className="text-sm font-bold">Disponibilidad</span><span className="text-[10px] text-gray-400 uppercase">{isStockZero ? "Sin stock" : "¿Activar para ventas?"}</span></div>
                    <label className={`relative inline-flex items-center ${isStockZero ? 'opacity-50' : 'cursor-pointer'}`}>
                        <input type="checkbox" checked={formData.disponible} onChange={e => setFormData({...formData, disponible: e.target.checked})} disabled={isStockZero} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#25D366] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <button disabled={loading || uploading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-2xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl">
                  {loading ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                </button>
            </form>
        </div>
      )}

      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in">
            {envolturas.map((env) => (
                <div key={env.id} onClick={() => setSelectedEnvoltura(env)} className={`bg-white border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all relative cursor-pointer ${!env.disponible ? 'opacity-70 grayscale' : 'border-gray-100'}`}>
                    <div className="relative h-48 bg-gray-50">
                        {env.foto ? <Image src={env.foto} alt={env.nombre} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-3xl">🎁</div>}
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[8px] font-bold uppercase">Stock: {env.cantidad}</div>
                    </div>
                    <div className="p-4 text-center">
                        <h3 className="font-serif font-bold text-gray-800 truncate">{env.nombre}</h3>
                        <p className="text-[#C5A059] font-bold text-xs">{env.precio_unitario} Bs</p>
                        <div className="flex justify-center items-center gap-2 mt-2">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorStyle(env.color) }}></div>
                             <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">{env.color || 'Sin color'}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {selectedEnvoltura && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedEnvoltura(null)}>
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEnvoltura(null)} className="absolute top-4 right-4 z-10 bg-black/20 text-white rounded-full p-2"><X size={20}/></button>
            <div className="relative h-64 bg-gray-100">{selectedEnvoltura.foto && <Image src={selectedEnvoltura.foto} alt="P" fill className="object-cover" unoptimized />}</div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4"><h3 className="font-serif text-2xl text-[#0A0A0A] leading-tight">{selectedEnvoltura.nombre}</h3><span className="text-[#C5A059] font-bold text-xl">Bs {selectedEnvoltura.precio_unitario}</span></div>
              <div className="space-y-4 mb-8">
                <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">Color: <div className="w-2 h-2 rounded-full" style={{backgroundColor: getColorStyle(selectedEnvoltura.color)}}></div> {selectedEnvoltura.color}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Diseño: {selectedEnvoltura.diseno || "Liso"}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">Stock: {selectedEnvoltura.cantidad}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleEditClick(selectedEnvoltura)} className="bg-[#0A0A0A] text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#C5A059] transition-all flex items-center justify-center gap-2"><span>✏️</span> Editar</button>
                <button onClick={() => handleDelete(selectedEnvoltura.id)} className="bg-red-50 text-red-500 border border-red-100 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"><span>🗑️</span> Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}