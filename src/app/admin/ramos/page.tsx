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
    } catch (e) { console.error("Error al borrar:", e); }
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
    } catch (err) { alert("Error al procesar imagen"); } finally { setter(false); }
  };

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
      
      {/* MODAL CROP */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full h-[60vh] rounded-3xl overflow-hidden shadow-2xl">
            <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={isPrincipalCrop ? 3/4 : 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
          </div>
          <div className="mt-8 w-full max-w-xs space-y-4">
            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
              <ZoomIn size={16} className="text-[#C5A059]" />
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#C5A059]" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setImageToCrop(null)} className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] border border-white/10">Cancelar</button>
              <button onClick={handleCropSave} className="flex-1 bg-[#C5A059] text-white py-4 rounded-2xl font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2"><Check size={14} /> Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif italic text-gray-800">Catálogo de Ramos</h2>
          <p className="text-sm text-gray-500">Usa cámara o galería para gestionar tus ramos.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => { setActiveTab("ver"); loadData(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}><LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Catálogo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}><Plus size={14} className="inline mr-2 -mt-0.5" /> Nuevo Ramo</button>
        </div>
      </div>

      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* FOTO PRINCIPAL */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-widest">Foto Principal (3:4)</span>
                    <div className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex flex-col items-center justify-center group">
                        {uploadingPrincipal ? (
                            <div className="text-[#C5A059] animate-pulse font-bold text-[10px] uppercase">Procesando...</div>
                        ) : formData.foto_principal ? (
                            <>
                                <Image src={formData.foto_principal} alt="Main" fill className="object-cover" unoptimized />
                                <button type="button" onClick={() => { deleteImageFromStorage(formData.foto_principal); setFormData({...formData, foto_principal: ""})}} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full z-30 shadow-lg hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3 p-4 w-full h-full justify-center">
                              <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-[#0A0A0A] text-[#C5A059] py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"><Camera size={16} /> Cámara</button>
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"><ImageIcon size={16} /> Galería</button>
                              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFileChange(e, true)} />
                              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFileChange(e, true)} />
                            </div>
                        )}
                    </div>
                  </div>

                  {/* GALERIA EXTRA */}
                  <div className="md:col-span-8">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2 block tracking-widest">Galería Extra</span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                        {imagenesExtra.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm bg-white">
                             <Image src={img} alt="" fill className="object-cover" unoptimized />
                             <button type="button" onClick={() => { deleteImageFromStorage(img); setImagenesExtra(prev => prev.filter((_, i) => i !== idx)) }} className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center z-30 shadow-md">×</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => cameraInputRef.current?.click()} className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-[#C5A059] transition-colors bg-white group">
                           <Plus size={24} className="text-gray-300 group-hover:text-[#C5A059]" />
                        </button>
                    </div>
                  </div>
                </div>

                {/* DATOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 focus:ring-1 focus:ring-[#C5A059] outline-none" placeholder="Nombre del Ramo" />
                    <div className="grid grid-cols-2 gap-4">
                        <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm outline-none">
                            <option value="">Categoría</option>
                            {auxData.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm outline-none">
                            <option value="mano">Ramo de mano</option>
                            <option value="copa">Copa / Florero</option>
                            <option value="caja">Caja</option>
                            <option value="canasta">Canasta</option>
                        </select>
                    </div>
                    <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border-none rounded-xl p-3 outline-none min-h-[120px]" placeholder="Descripción..." />
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Precio Venta (Bs)</span>
                        <input required type="number" step="0.5" value={formData.precio_base} onChange={e => setFormData({...formData, precio_base: e.target.value})} className="w-full bg-transparent border-none text-2xl font-bold text-[#C5A059] outline-none" placeholder="0.00" />
                        <div className="mt-4 flex items-center gap-3">
                            <input type="checkbox" id="oferta" checked={formData.es_oferta} onChange={e => setFormData({...formData, es_oferta: e.target.checked})} className="w-4 h-4 accent-[#C5A059]" />
                            <label htmlFor="oferta" className="text-sm font-bold text-gray-700">En Oferta</label>
                            {formData.es_oferta && (
                                <input type="number" placeholder="Rebajado" value={formData.precio_oferta} onChange={e => setFormData({...formData, precio_oferta: e.target.value})} className="ml-2 w-24 bg-white border border-red-100 rounded p-1 text-sm text-red-500 font-bold outline-none" />
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN COMPOSICIÓN (LISTA DE FLORES) */}
                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-[#C5A059]">Composición Floral</span>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                            {detallesFlores.map((detalle, index) => {
                              const item = auxData.flores.find(f => f.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                    <div className="w-8 h-8 rounded-full relative overflow-hidden border border-gray-200 flex-shrink-0">
                                      {item?.foto ? <Image src={item.foto} alt="" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-xs">🌸</span>}
                                    </div>
                                    <div className="flex-1 text-xs">
                                      <p className="font-bold text-gray-700 truncate">{item?.nombre}</p>
                                    </div>
                                    <div className="flex items-center bg-white rounded border border-gray-200">
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad - 1)} className="px-2 hover:bg-gray-100 text-gray-500">-</button>
                                        <span className="text-[10px] font-bold px-1 min-w-[20px] text-center">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad + 1)} className="px-2 hover:bg-gray-100 text-gray-500">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('flor', index)} className="text-red-400 hover:text-red-600 px-1">×</button>
                                </div>
                              );
                            })}
                        </div>
                        <button type="button" onClick={() => setShowFlorSelector(true)} className="w-full mt-3 py-2 border border-[#C5A059] border-dashed rounded-lg text-[#C5A059] text-[10px] font-bold uppercase hover:bg-[#C5A059] hover:text-white transition-all">+ Añadir Flor</button>
                    </div>

                    {/* SECCIÓN ENVOLTURAS */}
                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-gray-400">Material de Envoltura</span>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                            {detallesEnvolturas.map((detalle, index) => {
                              const item = auxData.envolturas.find(e => e.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                    <div className="w-8 h-8 rounded-full relative overflow-hidden border border-gray-200 flex-shrink-0">
                                      {item?.foto ? <Image src={item.foto} alt="" fill className="object-cover" unoptimized /> : <span className="flex items-center justify-center h-full text-xs">🎁</span>}
                                    </div>
                                    <div className="flex-1 text-xs">
                                      <p className="font-bold text-gray-700 truncate">{item?.nombre}</p>
                                    </div>
                                    <div className="flex items-center bg-white rounded border border-gray-200">
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad - 1)} className="px-2 hover:bg-gray-100 text-gray-500">-</button>
                                        <span className="text-[10px] font-bold px-1 min-w-[20px] text-center">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad + 1)} className="px-2 hover:bg-gray-100 text-gray-500">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('envoltura', index)} className="text-red-400 hover:text-red-600 px-1">×</button>
                                </div>
                              );
                            })}
                        </div>
                        <button type="button" onClick={() => setShowEnvolturaSelector(true)} className="w-full mt-3 py-2 border border-gray-400 border-dashed rounded-lg text-gray-400 text-[10px] font-bold uppercase hover:bg-gray-800 hover:text-white transition-all">+ Añadir Envoltura</button>
                    </div>

                    <div className="text-right text-[10px] text-gray-400">Total Materiales: <span className="font-bold text-gray-600">{costoEstimado.toFixed(2)} Bs</span></div>
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="w-4 h-4 accent-green-500" />
                        <label htmlFor="activo" className="text-xs text-gray-500 select-none">Producto visible</label>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-xl disabled:opacity-50">
                  {loading ? "Cargando..." : (activeTab === "crear" ? "Crear Producto" : "Guardar Cambios")}
                </button>
            </form>
        </div>
      )}

      {/* VISTA LISTA */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ramos.map((ramo) => (
                <div key={ramo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="relative h-64 bg-gray-50 cursor-pointer" onClick={() => handleEditClick(ramo)}>
                        <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                    </div>
                    <div className="p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-serif font-bold text-gray-800">{ramo.nombre}</h3>
                            <p className="text-[#C5A059] font-bold">{ramo.precio_base} Bs</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditClick(ramo)} className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-[#C5A059]">✏️</button>
                            <button onClick={() => { if(confirm("¿Eliminar?")) deleteRamo(ramo.id).then(loadData)}} className="p-2 bg-red-50 rounded-lg text-red-400 hover:bg-red-500 hover:text-white">🗑️</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* MODAL SELECTOR FLORES */}
      {showFlorSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white">
              <h3 className="font-serif text-xl italic">Seleccionar Flor</h3>
              <button onClick={() => setShowFlorSelector(false)} className="text-white/60 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.flores.map((flor) => (
                <div key={flor.id} onClick={() => handleAddItem('flor', flor.id)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-[#C5A059] hover:scale-105 transition-all p-2 text-center">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50">
                        {flor.foto ? <Image src={flor.foto} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full">🌸</div>}
                        <div className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: getColorStyle(flor.color) }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 truncate">{flor.nombre}</p>
                    <p className="text-[10px] text-[#C5A059] font-bold">{flor.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR ENVOLTURAS */}
      {showEnvolturaSelector && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white">
              <h3 className="font-serif text-xl italic">Seleccionar Material</h3>
              <button onClick={() => setShowEnvolturaSelector(false)} className="text-white/60 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 bg-[#F9F6EE] grid grid-cols-2 sm:grid-cols-4 gap-4">
              {auxData.envolturas.map((env) => (
                <div key={env.id} onClick={() => handleAddItem('envoltura', env.id)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:border-gray-500 hover:scale-105 transition-all p-2 text-center">
                    <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-gray-50">
                        {env.foto ? <Image src={env.foto} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full">🎁</div>}
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 truncate">{env.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-bold">{env.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}