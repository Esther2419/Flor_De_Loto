"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { createRamo, getRamos, updateRamo, deleteRamo, getAuxData } from "./actions";
import { Package, Plus, LayoutGrid, Search, Camera, Check, X, ZoomIn, Trash2, Image as ImageIcon } from "lucide-react";
import imageCompression from 'browser-image-compression';
import Cropper from 'react-easy-crop';

// --- TIPOS ---
type AuxData = {
  categorias: { id: string, nombre: string }[];
  envolturas: { id: string, nombre: string, precio_unitario: number, foto?: string }[];
  flores: { id: string, nombre: string, precio_unitario: number, foto: string, color: string }[];
};

type DetalleItem = { id: string; cantidad: number };

type Ramo = {
  id: string;
  nombre: string;
  descripcion: string;
  precio_base: number;
  foto_principal: string;
  activo: boolean;
  es_oferta: boolean;
  precio_oferta: number | null;
  tipo: string;
  categoria_id: string;
  categorias?: { nombre: string };
  ramo_detalle: { flor_id: string; cantidad_base: number; flores: { nombre: string, foto: string, color: string } }[];
  ramo_envolturas: { envoltura_id: string; cantidad: number; envolturas: { nombre: string, precio_unitario: number } }[];
  ramo_imagenes: { url_foto: string }[];
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
      resolve(new File([blob!], "ramo.webp", { type: "image/webp" }));
    }, 'image/webp', 0.8);
  });
};

const getColorStyle = (nombreColor: string | null) => {
  if (!nombreColor) return '#ccc';
  const colores: { [key: string]: string } = {
    'rojo': '#EF4444', 'azul': '#3B82F6', 'verde': '#10B981', 'amarillo': '#e8cf2bff',
    'rosa': '#EC4899', 'blanco': '#FFFFFF', 'negro': '#000000', 'morado': '#8B5CF6'
  };
  const key = nombreColor.toLowerCase().split(' ')[0];
  return colores[key] || '#C5A059';
};

export default function RamosAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [auxData, setAuxData] = useState<AuxData>({ categorias: [], envolturas: [], flores: [] });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isPrincipalCrop, setIsPrincipalCrop] = useState(true);

  const [formData, setFormData] = useState({
    id: "", nombre: "", descripcion: "", precio_base: "", categoria_id: "", 
    tipo: "mano", es_oferta: false, precio_oferta: "", activo: true, foto_principal: "",
  });

  const [detallesFlores, setDetallesFlores] = useState<DetalleItem[]>([]);
  const [detallesEnvolturas, setDetallesEnvolturas] = useState<DetalleItem[]>([]);
  const [imagenesExtra, setImagenesExtra] = useState<string[]>([]);
  const [showFlorSelector, setShowFlorSelector] = useState(false);
  const [showEnvolturaSelector, setShowEnvolturaSelector] = useState(false);
  const [uploadingPrincipal, setUploadingPrincipal] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [ramosData, aux] = await Promise.all([getRamos(), getAuxData()]);
    setRamos(ramosData);
    setAuxData(aux);
    setLoading(false);
  };

  const deleteImageFromStorage = async (url: string) => {
    if (!url) return;
    try {
      const fileName = url.split('/').pop();
      if (fileName) await supabase.storage.from('ramos').remove([fileName]);
    } catch (e) { console.error(e); }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isPrincipal: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsPrincipalCrop(isPrincipal);
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_: any, pixels: any) => { setCroppedAreaPixels(pixels); }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setUploadingPrincipal(true);
    setImageToCrop(null);

    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const options = { maxSizeMB: 1, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" };
      const compressedFile = await imageCompression(croppedFile, options);

      if (isPrincipalCrop && formData.foto_principal) await deleteImageFromStorage(formData.foto_principal);

      const fileName = `ramo_${Date.now()}.webp`;
      const { error } = await supabase.storage.from('ramos').upload(fileName, compressedFile);
      if (error) throw error;
      const { data } = supabase.storage.from('ramos').getPublicUrl(fileName);

      if (isPrincipalCrop) setFormData(p => ({ ...p, foto_principal: data.publicUrl }));
      else setImagenesExtra(p => [...p, data.publicUrl]);
    } catch (err) { alert("Error al procesar"); } finally { setUploadingPrincipal(false); }
  };

  // --- LÓGICA DE COMPOSICIÓN COMPLETA ---
  const handleAddItem = (type: 'flor' | 'envoltura', id: string) => {
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const existe = list.find(d => d.id === id);
    if (existe) setList(list.map(d => d.id === id ? { ...d, cantidad: d.cantidad + 1 } : d));
    else setList([...list, { id: id, cantidad: 1 }]);
    type === 'flor' ? setShowFlorSelector(false) : setShowEnvolturaSelector(false);
  };

  const updateQuantity = (type: 'flor' | 'envoltura', index: number, quantity: number) => {
    if (quantity < 1) return;
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const newList = [...list];
    newList[index].cantidad = quantity;
    setList(newList);
  };

  const removeItem = (type: 'flor' | 'envoltura', index: number) => {
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const costoEstimado = 
    detallesFlores.reduce((acc, curr) => {
      const item = auxData.flores.find(f => f.id === curr.id);
      return acc + (item ? item.precio_unitario * curr.cantidad : 0);
    }, 0) + 
    detallesEnvolturas.reduce((acc, curr) => {
      const item = auxData.envolturas.find(e => e.id === curr.id);
      return acc + (item ? item.precio_unitario * curr.cantidad : 0);
    }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { 
      ...formData, 
      detalles: detallesFlores.map(d => ({ flor_id: d.id, cantidad: d.cantidad })), 
      envolturas: detallesEnvolturas.map(d => ({ envoltura_id: d.id, cantidad: d.cantidad })), 
      imagenes_extra: imagenesExtra 
    };
    const res = (activeTab === "editar" && formData.id) ? await updateRamo(formData.id, payload) : await createRamo(payload);
    if (res.success) { resetForm(); setActiveTab("ver"); loadData(); } else alert(res.error);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ id: "", nombre: "", descripcion: "", precio_base: "", categoria_id: "", tipo: "mano", es_oferta: false, precio_oferta: "", activo: true, foto_principal: "" });
    setDetallesFlores([]); setDetallesEnvolturas([]); setImagenesExtra([]);
  };

  const handleEditClick = (ramo: Ramo) => {
    setFormData({ id: ramo.id, nombre: ramo.nombre, descripcion: ramo.descripcion || "", precio_base: ramo.precio_base.toString(), categoria_id: ramo.categoria_id?.toString() || "", tipo: ramo.tipo || "mano", es_oferta: ramo.es_oferta || false, precio_oferta: ramo.precio_oferta?.toString() || "", activo: ramo.activo ?? true, foto_principal: ramo.foto_principal || "" });
    setDetallesFlores(ramo.ramo_detalle.map(d => ({ id: d.flor_id.toString(), cantidad: d.cantidad_base })));
    setDetallesEnvolturas(ramo.ramo_envolturas.map(e => ({ id: e.envoltura_id.toString(), cantidad: e.cantidad })));
    setImagenesExtra(ramo.ramo_imagenes.map(img => img.url_foto));
    setActiveTab("editar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-x-hidden p-2 md:p-0">
      
      {/* MODAL CROP RESPONSIVO */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-2 md:p-4 backdrop-blur-md">
          <div className="relative w-full h-[50vh] md:h-[65vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={isPrincipalCrop ? 3/4 : 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
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
          <h2 className="text-2xl font-serif italic text-gray-800 uppercase tracking-tighter">Panel de Ramos</h2>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl w-full md:w-auto">
           <button onClick={() => { setActiveTab("ver"); loadData(); }} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400"}`}>Catálogo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400"}`}>+ Nuevo Ramo</button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* SECCIÓN FOTO */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-3 tracking-widest">Foto Principal (3:4)</span>
                    <div className="relative w-32 h-32 md:w-full md:aspect-[3/4] rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
                        {uploadingPrincipal ? (
                            <div className="text-[#C5A059] animate-pulse font-bold text-[10px]">...</div>
                        ) : formData.foto_principal ? (
                            <div className="relative w-full h-full group">
                                <Image src={formData.foto_principal} alt="Main" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => { deleteImageFromStorage(formData.foto_principal); setFormData({...formData, foto_principal: ""})}} className="absolute inset-0 m-auto w-12 h-12 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm z-10 active:scale-90 transition-transform"><Trash2 size={24} /></button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 p-4 w-full h-full justify-center">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="bg-[#0A0A0A] text-[#C5A059] py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-md hover:bg-black transition-all"><Camera size={16} /> Cámara</button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white border border-gray-200 text-gray-500 py-3 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition-all"><ImageIcon size={16} /> Galería</button>
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, true)} />
                            </div>
                        )}
                    </div>
                  </div>

                  {/* FORMULARIO DATOS */}
                  <div className="md:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 tracking-widest">Nombre</label>
                        <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 focus:ring-1 focus:ring-[#C5A059] outline-none font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 tracking-widest">Categoría</label>
                        <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl p-4 outline-none text-sm appearance-none font-bold">
                            <option value="">Seleccionar...</option>
                            {auxData.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-6 shadow-inner">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 tracking-widest">Precio Base (Bs)</label>
                          <input required type="number" step="0.5" value={formData.precio_base} 
                            onChange={e => setFormData({...formData, precio_base: e.target.value})}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                            className="w-full bg-white border-none rounded-2xl p-4 text-xl font-bold text-[#C5A059] outline-none shadow-sm" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center gap-2">
                           <label className="flex items-center gap-3 cursor-pointer select-none">
                              <input type="checkbox" checked={formData.es_oferta} onChange={e => setFormData({...formData, es_oferta: e.target.checked})} className="w-6 h-6 accent-red-500 rounded-lg" />
                              <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Activar Oferta</span>
                           </label>
                        </div>
                      </div>
                      {formData.es_oferta && (
                        <div className="space-y-1 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-bold uppercase text-red-400 ml-1 tracking-widest">Precio Oferta (Bs)</label>
                          <input required type="number" step="0.5" value={formData.precio_oferta} 
                            onChange={e => setFormData({...formData, precio_oferta: e.target.value})}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()} 
                            className="w-full bg-white border-2 border-red-100 rounded-2xl p-4 text-xl font-bold text-red-500 outline-none shadow-sm" />
                        </div>
                      )}
                    </div>

                    {/* COMPOSICIÓN DINÁMICA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-2xl p-4 bg-white relative">
                            <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-[#C5A059]">Flores</span>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {detallesFlores.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] bg-gray-50 p-2 rounded-xl border border-gray-100">
                                        <span className="font-bold truncate pr-2">{auxData.flores.find(f => f.id === d.id)?.nombre}</span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateQuantity('flor', i, d.cantidad - 1)} className="w-6 h-6 bg-white rounded-lg border text-gray-400 hover:bg-gray-100">-</button>
                                            <span className="w-4 text-center font-bold">{d.cantidad}</span>
                                            <button type="button" onClick={() => updateQuantity('flor', i, d.cantidad + 1)} className="w-6 h-6 bg-white rounded-lg border text-gray-400 hover:bg-gray-100">+</button>
                                            <button type="button" onClick={() => removeItem('flor', i)} className="text-red-400 ml-1 font-bold">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setShowFlorSelector(true)} className="w-full mt-3 py-2 border-dashed border-2 border-gray-200 rounded-xl text-[10px] font-bold text-[#C5A059] uppercase hover:bg-[#C5A059] hover:text-white transition-all">+ Añadir Flor</button>
                        </div>

                        <div className="border border-gray-200 rounded-2xl p-4 bg-white relative">
                            <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-gray-400">Envolturas</span>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {detallesEnvolturas.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between text-[11px] bg-gray-50 p-2 rounded-xl border border-gray-100">
                                        <span className="font-bold truncate pr-2">{auxData.envolturas.find(e => e.id === d.id)?.nombre}</span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" onClick={() => updateQuantity('envoltura', i, d.cantidad - 1)} className="w-6 h-6 bg-white rounded-lg border text-gray-400 hover:bg-gray-100">-</button>
                                            <span className="w-4 text-center font-bold">{d.cantidad}</span>
                                            <button type="button" onClick={() => updateQuantity('envoltura', i, d.cantidad + 1)} className="w-6 h-6 bg-white rounded-lg border text-gray-400 hover:bg-gray-100">+</button>
                                            <button type="button" onClick={() => removeItem('envoltura', i)} className="text-red-400 ml-1 font-bold">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => setShowEnvolturaSelector(true)} className="w-full mt-3 py-2 border-dashed border-2 border-gray-200 rounded-xl text-[10px] font-bold text-gray-400 uppercase hover:bg-gray-800 hover:text-white transition-all">+ Añadir Material</button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="activo_ramo" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="w-5 h-5 accent-green-500" />
                            <label htmlFor="activo_ramo" className="text-xs font-bold text-gray-500 uppercase tracking-widest select-none">Catálogo visible</label>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Costo Materiales: <span className="text-gray-700">{costoEstimado.toFixed(2)} Bs</span></p>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-5 rounded-3xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-2xl active:scale-95">
                  {loading ? "PROCESANDO..." : (activeTab === "crear" ? "CONFIRMAR NUEVO RAMO" : "GUARDAR CAMBIOS")}
                </button>
            </form>
        </div>
      )}

      {/* VISTA LISTA RAMOS */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {ramos.map((ramo) => (
                <div key={ramo.id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all relative flex flex-col h-full">
                    <div className="relative aspect-[3/4] bg-gray-50 cursor-pointer" onClick={() => handleEditClick(ramo)}>
                        <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover" unoptimized />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                            {ramo.es_oferta && <span className="bg-red-500 text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase shadow-md">Oferta</span>}
                            {!ramo.activo && <span className="bg-black text-white text-[8px] font-bold px-2 py-1 rounded-full uppercase shadow-md">Oculto</span>}
                        </div>
                    </div>
                    <div className="p-4 text-center flex-1">
                        <h3 className="font-serif font-bold text-gray-800 text-xs truncate uppercase tracking-tighter mb-1">{ramo.nombre}</h3>
                        <div className="flex justify-center items-baseline gap-2">
                             <span className={`font-bold ${ramo.es_oferta ? 'text-gray-400 line-through text-[10px]' : 'text-[#C5A059] text-xs'}`}>{ramo.precio_base} Bs</span>
                             {ramo.es_oferta && <span className="text-red-500 font-bold text-xs">{ramo.precio_oferta} Bs</span>}
                        </div>
                    </div>
                    <div className="flex border-t border-gray-50">
                        <button onClick={() => handleEditClick(ramo)} className="flex-1 py-3 text-gray-400 hover:bg-gray-100 transition-colors text-sm">✏️</button>
                        <button onClick={() => { if(confirm("¿Eliminar?")) deleteRamo(ramo.id).then(loadData)}} className="flex-1 py-3 text-red-300 hover:bg-red-50 transition-colors text-sm">🗑️</button>
                    </div>
                </div>
            ))}
            {ramos.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 italic">No hay ramos registrados.</div>}
        </div>
      )}

      {/* SELECTOR FLORES (MODAL) */}
      {showFlorSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white">
              <h3 className="font-serif text-lg italic text-[#C5A059]">Seleccionar Flor</h3>
              <button onClick={() => setShowFlorSelector(false)} className="text-white/60 hover:text-white transition-colors"><X size={28}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.flores.map((f) => (
                <div key={f.id} onClick={() => handleAddItem('flor', f.id)} className="bg-white rounded-2xl p-2 text-center border-2 border-transparent hover:border-[#C5A059] transition-all cursor-pointer group">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-100">
                        {f.foto ? <Image src={f.foto} alt="" fill className="object-cover group-hover:scale-110 transition-transform" unoptimized /> : <div className="flex items-center justify-center h-full text-2xl">🌸</div>}
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white shadow-sm" style={{backgroundColor: getColorStyle(f.color)}}></div>
                    </div>
                    <p className="text-[10px] font-bold truncate uppercase tracking-tighter">{f.nombre}</p>
                    <p className="text-[9px] text-[#C5A059] font-bold">{f.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SELECTOR ENVOLTURAS (MODAL) */}
      {showEnvolturaSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white">
              <h3 className="font-serif text-lg italic text-gray-400">Elegir Material</h3>
              <button onClick={() => setShowEnvolturaSelector(false)} className="text-white/60 hover:text-white transition-colors"><X size={28}/></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.envolturas.map((e) => (
                <div key={e.id} onClick={() => handleAddItem('envoltura', e.id)} className="bg-white rounded-2xl p-2 text-center border-2 border-transparent hover:border-gray-800 transition-all cursor-pointer group">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-gray-50">
                        {e.foto ? <Image src={e.foto} alt="" fill className="object-cover group-hover:scale-110 transition-transform" unoptimized /> : <div className="flex items-center justify-center h-full text-2xl">🎁</div>}
                    </div>
                    <p className="text-[10px] font-bold truncate uppercase tracking-tighter">{e.nombre}</p>
                    <p className="text-[9px] text-gray-500 font-bold">{e.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}