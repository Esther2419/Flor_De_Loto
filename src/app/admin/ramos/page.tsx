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
      resolve(new File([blob!], "temp.webp", { type: "image/webp" }));
    }, 'image/webp', 0.8);
  });
};

const getColorStyle = (nombreColor: string | null) => {
  if (!nombreColor) return '#ccc';
  if (nombreColor.startsWith('#')) return nombreColor;
  const colores: { [key: string]: string } = {
    'rojo': '#EF4444', 'azul': '#3B82F6', 'verde': '#10B981',
    'amarillo': '#e8cf2bff', 'rosa': '#EC4899', 'blanco': '#FFFFFF',
    'negro': '#000000', 'morado': '#8B5CF6', 'naranja': '#F97316',
    'lila': '#C4B5FD', 'cafe': '#8D6E63', 'crema': '#F9F6EE', 'dorado': '#C5A059'
  };
  const key = nombreColor.toLowerCase().split(' ')[0];
  return colores[key] || '#C5A059';
};

export default function RamosAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [auxData, setAuxData] = useState<AuxData>({ categorias: [], envolturas: [], flores: [] });
  
  // REFERENCIAS PARA INPUTS
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  // ESTADOS DE RECORTE
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
  const [uploadingExtra, setUploadingExtra] = useState(false);

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
    } catch (e) { console.error("Error al borrar storage:", e); }
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
    const setter = isPrincipalCrop ? setUploadingPrincipal : setUploadingExtra;
    setter(true);
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
    } catch (err) { alert("Error procesando imagen"); } finally { setter(false); }
  };

  const removeExtraImage = async (url: string, index: number) => {
    await deleteImageFromStorage(url);
    setImagenesExtra(prev => prev.filter((_, i) => i !== index));
  };

  // --- LÓGICA DE NEGOCIO ---
  const handleAddItem = (type: 'flor' | 'envoltura', id: string) => {
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const existe = list.find(d => d.id === id);
    if (existe) setList(list.map(d => d.id === id ? { ...d, cantidad: d.cantidad + 1 } : d));
    else setList([...list, { id: id, cantidad: 1 }]);
    type === 'flor' ? setShowFlorSelector(false) : setShowEnvolturaSelector(false);
  };

  const removeItem = (type: 'flor' | 'envoltura', index: number) => {
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const newList = [...list];
    newList.splice(index, 1);
    setList(newList);
  };

  const updateQuantity = (type: 'flor' | 'envoltura', index: number, quantity: number) => {
    if (quantity < 1) return;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const newList = [...list];
    newList[index].cantidad = quantity;
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
    const payload = { ...formData, detalles: detallesFlores.map(d => ({ flor_id: d.id, cantidad: d.cantidad })), envolturas: detallesEnvolturas.map(d => ({ envoltura_id: d.id, cantidad: d.cantidad })), imagenes_extra: imagenesExtra };
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
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MODAL DE RECORTE */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full h-[60vh] md:h-[70vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={isPrincipalCrop ? 3/4 : 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
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
          <h2 className="text-2xl font-serif italic text-gray-800">Catálogo de Ramos</h2>
          <p className="text-sm text-gray-500">Cámara, Galería y Recorte Inteligente.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => { setActiveTab("ver"); loadData(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}><LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Catálogo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}><Plus size={14} className="inline mr-2 -mt-0.5" /> Nuevo Ramo</button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* SECCIÓN FOTOS CON OPCIONES INDEPENDIENTES */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Foto Principal (3:4)</span>
                    <div className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center">
                        {uploadingPrincipal ? (
                            <div className="text-[#C5A059] animate-pulse font-bold text-[10px] uppercase">PROCESANDO...</div>
                        ) : formData.foto_principal ? (
                            <>
                                <Image src={formData.foto_principal} alt="Main" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => { deleteImageFromStorage(formData.foto_principal); setFormData({...formData, foto_principal: ""})}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full z-30 shadow-lg hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3 p-4 w-full h-full justify-center">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#C5A059] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                                <Camera size={16} /> CÁMARA
                              </button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
                                <ImageIcon size={16} /> GALERÍA
                              </button>
                              {/* INPUTS OCULTOS */}
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, true)} />
                            </div>
                        )}
                    </div>
                  </div>

                  {/* GALERÍA EXTRA */}
                  <div className="md:col-span-8">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2 block tracking-widest text-center md:text-left">Galería Extra ({imagenesExtra.length})</span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {imagenesExtra.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white group">
                             <Image src={img} alt="" fill className="object-cover" unoptimized />
                             <button type="button" onClick={() => removeExtraImage(img, idx)} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                          </div>
                        ))}
                        <div onClick={() => extraFileInputRef.current?.click()} className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-[#C5A059] cursor-pointer transition-colors bg-white group">
                           <input ref={extraFileInputRef} type="file" onChange={(e) => onFileChange(e, false)} className="hidden" accept="image/*" />
                           <Plus size={24} className="text-gray-300 group-hover:text-[#C5A059]" />
                        </div>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN DATOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nombre</label>
                        <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Nombre del Ramo" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Categoría</label>
                            <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm outline-none">
                                <option value="">Evento</option>
                                {auxData.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Armado</label>
                            <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm outline-none">
                                <option value="mano">Ramo de mano</option>
                                <option value="copa">Copa / Florero</option>
                                <option value="caja">Caja</option>
                                <option value="canasta">Canasta</option>
                            </select>
                        </div>
                    </div>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 outline-none min-h-[150px]" placeholder="Escribe una descripción romántica..." />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Precio Venta (Bs)</label>
                        <input required type="number" step="0.5" value={formData.precio_base} onChange={e => setFormData({...formData, precio_base: e.target.value})} className="w-full bg-transparent border-none text-2xl font-bold text-[#C5A059] outline-none" placeholder="0.00" />
                        <div className="mt-4 flex items-center gap-3">
                            <input type="checkbox" id="oferta" checked={formData.es_oferta} onChange={e => setFormData({...formData, es_oferta: e.target.checked})} className="w-4 h-4 accent-[#C5A059]" />
                            <label htmlFor="oferta" className="text-sm font-bold text-gray-700">Oferta Especial</label>
                            {formData.es_oferta && (
                                <input type="number" placeholder="Precio Rebajado" value={formData.precio_oferta} onChange={e => setFormData({...formData, precio_oferta: e.target.value})} className="ml-2 w-24 bg-white border border-red-100 rounded p-1 text-sm text-red-500 font-bold outline-none shadow-sm" />
                            )}
                        </div>
                    </div>

                    {/* COMPOSICIÓN FLORAL */}
                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white shadow-inner">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-[#C5A059]">Lista de Flores</span>
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                            {detallesFlores.map((detalle, index) => {
                              const item = auxData.flores.find(f => f.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="w-8 h-8 rounded-full relative overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                                      {item?.foto ? <Image src={item.foto} alt="" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-xs">🌸</span>}
                                    </div>
                                    <div className="flex-1 text-[10px] font-bold text-gray-700 truncate">{item?.nombre}</div>
                                    <div className="flex items-center bg-white rounded border border-gray-200">
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad - 1)} className="px-2 text-gray-500 hover:bg-gray-100">-</button>
                                        <span className="text-[10px] font-bold px-1 min-w-[20px] text-center">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad + 1)} className="px-2 text-gray-500 hover:bg-gray-100">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('flor', index)} className="text-red-400 px-2 font-bold">×</button>
                                </div>
                              );
                            })}
                        </div>
                        <button type="button" onClick={() => setShowFlorSelector(true)} className="w-full mt-3 py-2 border border-[#C5A059] border-dashed rounded-lg text-[#C5A059] text-[10px] font-bold uppercase">+ AÑADIR FLOR</button>
                    </div>

                    {/* ENVOLTURAS */}
                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white shadow-inner">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-gray-400">Material de Envoltura</span>
                        <div className="space-y-3 max-h-40 overflow-y-auto">
                            {detallesEnvolturas.map((detalle, index) => {
                              const item = auxData.envolturas.find(e => e.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="w-8 h-8 rounded-full relative overflow-hidden border border-gray-200 flex-shrink-0 bg-white">
                                      {item?.foto ? <Image src={item.foto} alt="" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-xs">🎁</span>}
                                    </div>
                                    <div className="flex-1 text-[10px] font-bold text-gray-700 truncate">{item?.nombre}</div>
                                    <div className="flex items-center bg-white rounded border border-gray-200">
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad - 1)} className="px-2 text-gray-500 hover:bg-gray-100">-</button>
                                        <span className="text-[10px] font-bold px-1 min-w-[20px] text-center">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad + 1)} className="px-2 text-gray-500 hover:bg-gray-100">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('envoltura', index)} className="text-red-400 px-2 font-bold">×</button>
                                </div>
                              );
                            })}
                        </div>
                        <button type="button" onClick={() => setShowEnvolturaSelector(true)} className="w-full mt-3 py-2 border border-gray-400 border-dashed rounded-lg text-gray-400 text-[10px] font-bold uppercase">+ AÑADIR ENVOLTURA</button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="w-4 h-4 accent-green-500" />
                            <label htmlFor="activo" className="text-xs text-gray-500 select-none font-bold uppercase">Visible</label>
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold">Costo Materiales: <span className="text-gray-700">{costoEstimado.toFixed(2)} Bs</span></div>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-2xl">
                  {loading ? "CARGANDO..." : (activeTab === "crear" ? "DISEÑAR RAMO" : "GUARDAR CAMBIOS")}
                </button>
            </form>
        </div>
      )}

      {/* VISTA LISTA DE RAMOS */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
            {ramos.map((ramo) => (
                <div key={ramo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all">
                <div className="relative h-72 bg-gray-50 group cursor-pointer" onClick={() => handleEditClick(ramo)}>
                    {ramo.foto_principal ? (
                        <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                    ) : ( <div className="flex items-center justify-center h-full text-4xl opacity-20">💐</div> )}
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                        {ramo.es_oferta && <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse uppercase tracking-widest">Oferta</span>}
                        {!ramo.activo && <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-widest">Oculto</span>}
                    </div>
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white">
                        <h3 className="font-serif text-xl italic leading-tight">{ramo.nombre}</h3>
                        <span className="text-[10px] uppercase tracking-widest opacity-80">{ramo.categorias?.nombre || "General"}</span>
                    </div>
                </div>
                <div className="p-6 flex justify-between items-center bg-white">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className={`font-serif font-bold text-xl ${ramo.es_oferta ? 'text-gray-400 line-through text-xs' : 'text-[#C5A059]'}`}>{ramo.precio_base} Bs</span>
                            {ramo.es_oferta && <span className="font-serif font-bold text-xl text-red-500">{ramo.precio_oferta} Bs</span>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleEditClick(ramo)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-black hover:text-[#C5A059] transition-all">✏️</button>
                        <button onClick={() => { if (confirm("¿Eliminar?")) deleteRamo(ramo.id).then(loadData)}} className="p-3 bg-red-50 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                    </div>
                </div>
                </div>
            ))}
        </div>
      )}

      {/* MODAL SELECTOR FLORES */}
      {showFlorSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0A0A0A] p-6 flex justify-between items-center text-white">
              <h3 className="font-serif text-xl italic text-[#C5A059]">Seleccionar Variedad Floral</h3>
              <button onClick={() => setShowFlorSelector(false)} className="text-white/60 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.flores.map((flor) => (
                <div key={flor.id} onClick={() => handleAddItem('flor', flor.id)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all p-3 text-center group">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                        {flor.foto ? <Image src={flor.foto} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-2xl">🌸</div>}
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: getColorStyle(flor.color) }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 truncate uppercase tracking-widest">{flor.nombre}</p>
                    <p className="text-[10px] text-[#C5A059] font-bold mt-1 uppercase tracking-widest">{flor.precio_unitario} Bs / ud</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR ENVOLTURAS */}
      {showEnvolturaSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#0A0A0A] p-6 flex justify-between items-center text-white">
              <h3 className="font-serif text-xl italic text-[#C5A059]">Seleccionar Envoltura / Material</h3>
              <button onClick={() => setShowEnvolturaSelector(false)} className="text-white/60 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.envolturas.map((env) => (
                <div key={env.id} onClick={() => handleAddItem('envoltura', env.id)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-105 transition-all p-3 text-center group">
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                        {env.foto ? <Image src={env.foto} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-2xl">🎁</div>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 truncate uppercase tracking-widest">{env.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">{env.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}