"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { createRamo, getRamos, updateRamo, deleteRamo, getAuxData } from "./actions";
import { uploadToBucket, deleteFromBucket } from "@/lib/storage";
import { Package, Plus, LayoutGrid, Search, Camera, ImageIcon, X, Check, Trash2, Loader2 } from "lucide-react";
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

// --- HELPER PARA RECORTE ---
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new window.Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No ctx");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.8));
};

export default function RamosAdminPage() {
  const [activeTab, setActiveTab] = useState<"ver" | "crear" | "editar">("ver");
  const [loading, setLoading] = useState(false);
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [auxData, setAuxData] = useState<AuxData>({ categorias: [], envolturas: [], flores: [] });
  
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
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isPrincipalCrop, setIsPrincipalCrop] = useState(true);

  // --- ESTADO PARA ALERTAS ---
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ show: false, message: "", type: 'success' });

  const filePrincipalRef = useRef<HTMLInputElement>(null);
  const cameraPrincipalRef = useRef<HTMLInputElement>(null);
  const fileExtraRef = useRef<HTMLInputElement>(null);
  const cameraExtraRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadData(); }, []);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => { (e.target as HTMLInputElement).blur(); };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ramosData, aux] = await Promise.all([getRamos(), getAuxData()]);
      setRamos(ramosData || []);
      setAuxData(aux);
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, isPrincipal: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setCropImage(reader.result as string);
        setIsPrincipalCrop(isPrincipal);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const isPrincipal = isPrincipalCrop;
    setCropImage(null);
    const setter = isPrincipal ? setUploadingPrincipal : setUploadingExtra;
    setter(true);

    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const file = new File([croppedBlob], "image.jpg", { type: "image/jpeg" });
      
      const url = await uploadToBucket(file, 'ramos');
      
      if (url) {
        if (isPrincipal) {
          setFormData(prev => ({ ...prev, foto_principal: url }));
        } else {
          setImagenesExtra(prev => [...prev, url]);
        }
      }
    } catch (error) {
      setAlertModal({ show: true, message: "Error al procesar la imagen", type: 'error' });
    } finally {
      setter(false);
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAddItem = (type: 'flor' | 'envoltura', id: string) => {
    const list = type === 'flor' ? detallesFlores : detallesEnvolturas;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    const existe = list.find(d => d.id === id);
    if (existe) {
      setList(list.map(d => d.id === id ? { ...d, cantidad: d.cantidad + 1 } : d));
    } else {
      setList([...list, { id, cantidad: 1 }]);
    }
    type === 'flor' ? setShowFlorSelector(false) : setShowEnvolturaSelector(false);
  };

  const removeItem = (type: 'flor' | 'envoltura', index: number) => {
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    setList(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (type: 'flor' | 'envoltura', index: number, quantity: number) => {
    if (quantity < 1) return;
    const setList = type === 'flor' ? setDetallesFlores : setDetallesEnvolturas;
    setList(prev => prev.map((item, i) => i === index ? { ...item, cantidad: quantity } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      ...formData,
      detalles: detallesFlores.map(d => ({ flor_id: d.id, cantidad: d.cantidad })),
      envolturas: detallesEnvolturas.map(d => ({ envoltura_id: d.id, cantidad: d.cantidad })),
      imagenes_extra: imagenesExtra
    };
    let res = (activeTab === "editar" && formData.id) ? await updateRamo(formData.id, payload) : await createRamo(payload);
    if (res.success) { 
      resetForm(); setActiveTab("ver"); loadData(); 
      setAlertModal({ show: true, message: "¡Ramo guardado correctamente!", type: 'success' });
    } else { 
      setAlertModal({ show: true, message: res.error || "Error al guardar", type: 'error' }); 
    }
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

  const handleDelete = async (id: string) => { 
    setAlertModal({
      show: true,
      message: "¿Estás seguro de eliminar este ramo? Esta acción no se puede deshacer.",
      type: 'confirm',
      onConfirm: async () => {
        const ramo = ramos.find(r => r.id === id);
        if (ramo) {
          if (ramo.foto_principal) await deleteFromBucket(ramo.foto_principal, 'ramos');
          if (ramo.ramo_imagenes?.length > 0) {
            for (const img of ramo.ramo_imagenes) await deleteFromBucket(img.url_foto, 'ramos');
          }
        }
        await deleteRamo(id); 
        loadData();
        setAlertModal({ show: true, message: "Ramo eliminado", type: 'success' });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MODAL RECORTE */}
      {cropImage && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="relative w-full flex-1">
            <Cropper image={cropImage} crop={crop} zoom={zoom} aspect={isPrincipalCrop ? 3/4 : 1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div className="bg-black p-4 w-full flex gap-4">
            <button onClick={() => setCropImage(null)} className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold uppercase text-[10px]">Cancelar</button>
            <button onClick={handleCropConfirm} className="flex-1 bg-[#C5A059] text-white py-3 rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2"><Check size={14}/> Confirmar</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div><h2 className="text-2xl font-serif italic text-gray-800">Catálogo de Ramos</h2></div>
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => { setActiveTab("ver"); loadData(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "ver" ? "bg-white text-[#C5A059] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}><LayoutGrid size={14} className="inline mr-2 -mt-0.5" /> Catálogo</button>
           <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === "crear" ? "bg-[#C5A059] text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}><Plus size={14} className="inline mr-2 -mt-0.5" /> Nuevo Ramo</button>
        </div>
      </div>

      {/* FORMULARIO CREAR/EDITAR */}
      {(activeTab === "crear" || activeTab === "editar") && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* --- SECCIÓN DE IMÁGENES ESTILO BOUTIQUE --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* FOTO PRINCIPAL (3/4 Ratio) */}
                  <div className="md:col-span-5 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Portada del Ramo</span>
                      {formData.foto_principal && <span className="text-[9px] bg-green-50 text-green-500 px-2 py-0.5 rounded-full font-bold">LISTO</span>}
                    </div>
                    
                    <div className="relative aspect-[3/4] rounded-[3rem] border-2 border-dashed border-gray-100 bg-[#FDFBF7] overflow-hidden group transition-all hover:border-[#C5A059]/30 shadow-sm">
                      {uploadingPrincipal ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                          <Loader2 className="animate-spin text-[#C5A059] mb-2" size={30} />
                          <span className="text-[10px] font-bold text-[#C5A059] tracking-widest animate-pulse">SUBIENDO...</span>
                        </div>
                      ) : formData.foto_principal ? (
                        <>
                          <Image src={formData.foto_principal} alt="Portada" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button type="button" onClick={() => filePrincipalRef.current?.click()} className="bg-white p-3 rounded-full text-gray-700 hover:scale-110 transition-transform shadow-xl"><Camera size={18}/></button>
                            <button type="button" onClick={() => setFormData({...formData, foto_principal: ""})} className="bg-red-500 p-3 rounded-full text-white hover:scale-110 transition-transform shadow-xl"><Trash2 size={18}/></button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4">
                          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                          </div>
                          <div className="flex flex-col gap-2 w-full max-w-[180px]">
                            <button type="button" onClick={() => cameraPrincipalRef.current?.click()} className="bg-[#0A0A0A] text-white py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-colors">Cámara</button>
                            <button type="button" onClick={() => filePrincipalRef.current?.click()} className="bg-white border border-gray-100 text-gray-500 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-gray-50">Galería</button>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={filePrincipalRef} hidden accept="image/*" onChange={(e) => onFileChange(e, true)} />
                      <input type="file" ref={cameraPrincipalRef} hidden accept="image/*" capture="environment" onChange={(e) => onFileChange(e, true)} />
                    </div>
                  </div>

                  {/* GALERÍA DE DETALLES */}
                  <div className="md:col-span-7 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 ml-1">Álbum de Detalles</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {imagenesExtra.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden border border-gray-50 bg-white group shadow-sm">
                          <Image src={img} alt="" fill className="object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setImagenesExtra(imagenesExtra.filter((_, i) => i !== idx))} 
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-md text-red-500 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-50"
                          >
                            <X size={16}/>
                          </button>
                        </div>
                      ))}
                      
                      {/* Botón de Añadir en Galería */}
                      <div className="relative aspect-square rounded-[2rem] border-2 border-dashed border-gray-100 bg-[#FDFBF7] flex flex-col items-center justify-center p-4 hover:border-[#C5A059]/30 transition-all group">
                        {uploadingExtra ? (
                          <Loader2 className="animate-spin text-[#C5A059]" size={24}/>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <button type="button" onClick={() => cameraExtraRef.current?.click()} className="flex items-center justify-center bg-white w-10 h-10 rounded-full shadow-sm mx-auto text-gray-400 group-hover:text-[#C5A059] transition-colors">
                              <Plus size={20}/>
                            </button>
                            <span className="text-[8px] font-bold text-gray-400 text-center uppercase tracking-widest">Añadir Foto</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button type="button" onClick={() => fileExtraRef.current?.click()} className="flex-1 bg-white text-[7px] font-bold p-1 rounded-md border border-gray-100 uppercase">Files</button>
                               <button type="button" onClick={() => cameraExtraRef.current?.click()} className="flex-1 bg-black text-white text-[7px] font-bold p-1 rounded-md uppercase">Cam</button>
                            </div>
                          </div>
                        )}
                        <input type="file" ref={fileExtraRef} hidden accept="image/*" onChange={(e) => onFileChange(e, false)} />
                        <input type="file" ref={cameraExtraRef} hidden accept="image/*" capture="environment" onChange={(e) => onFileChange(e, false)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* DETALLES Y COSTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre del Ramo</label>
                        <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 mt-1 outline-none focus:ring-1 focus:ring-[#C5A059]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría</label>
                            <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 mt-1 text-sm outline-none">
                            <option value="">-- Evento --</option>
                            {auxData.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Armado</label>
                            <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 mt-1 text-sm outline-none">
                                <option value="mano">Ramo de mano</option>
                                <option value="copa">Copa / Florero</option>
                                <option value="caja">Caja</option>
                                <option value="canasta">Canasta</option>
                                <option value="Ninguna">Ninguna</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                        <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-lg p-3 mt-1 outline-none" rows={4} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio de Venta (Bs)</label>
                        <input required type="number" step="0.5" onWheel={handleWheel} value={formData.precio_base} onChange={e => setFormData({...formData, precio_base: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-3 mt-1 font-bold text-xl text-[#C5A059] outline-none" />
                        <div className="mt-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="oferta" checked={formData.es_oferta} onChange={e => setFormData({...formData, es_oferta: e.target.checked})} className="w-4 h-4 text-[#C5A059] rounded" />
                                <label htmlFor="oferta" className="text-sm font-bold text-gray-700 cursor-pointer">Activar Oferta</label>
                            </div>
                            {formData.es_oferta && <input type="number" step="0.5" onWheel={handleWheel} placeholder="Precio oferta" value={formData.precio_oferta} onChange={e => setFormData({...formData, precio_oferta: e.target.value})} className="w-full bg-white border border-red-200 rounded-lg p-2 text-sm text-red-500 font-bold outline-none" />}
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-[#C5A059]">Flores Seleccionadas</span>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {detallesFlores.map((detalle, index) => {
                              const item = auxData.flores.find(f => f.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                    <div className="w-8 h-8 rounded-full border border-gray-200 relative overflow-hidden bg-white">{item?.foto && <Image src={item.foto} alt="" fill className="object-cover" />}</div>
                                    <div className="flex-1 text-xs font-bold text-gray-700">{item?.nombre}</div>
                                    <div className="flex items-center bg-white rounded border">
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad - 1)} className="px-2 text-gray-400">-</button>
                                        <span className="text-xs font-bold px-1">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('flor', index, detalle.cantidad + 1)} className="px-2 text-gray-400">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('flor', index)} className="text-red-400 pl-2">×</button>
                                </div>
                              );
                            })}
                            <button type="button" onClick={() => setShowFlorSelector(true)} className="w-full py-2 border border-[#C5A059] border-dashed rounded-lg text-[#C5A059] text-xs font-bold uppercase hover:bg-[#C5A059]/5 transition-colors">+ Añadir Flor</button>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5 relative bg-white">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-gray-400">Materiales / Envoltura</span>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {detallesEnvolturas.map((detalle, index) => {
                              const item = auxData.envolturas.find(e => e.id === detalle.id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                                    <div className="w-8 h-8 rounded-full border border-gray-200 relative overflow-hidden bg-white">{item?.foto && <Image src={item.foto} alt="" fill className="object-cover" />}</div>
                                    <div className="flex-1 text-xs font-bold text-gray-700">{item?.nombre}</div>
                                    <div className="flex items-center bg-white rounded border">
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad - 1)} className="px-2 text-gray-400">-</button>
                                        <span className="text-xs font-bold px-1">{detalle.cantidad}</span>
                                        <button type="button" onClick={() => updateQuantity('envoltura', index, detalle.cantidad + 1)} className="px-2 text-gray-400">+</button>
                                    </div>
                                    <button type="button" onClick={() => removeItem('envoltura', index)} className="text-red-400 pl-2">×</button>
                                </div>
                              );
                            })}
                            <button type="button" onClick={() => setShowEnvolturaSelector(true)} className="w-full py-2 border border-gray-300 border-dashed rounded-lg text-gray-400 text-xs font-bold uppercase hover:bg-gray-50 transition-colors">+ Añadir Material</button>
                        </div>
                    </div>
                  </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading && <Loader2 className="animate-spin" size={20}/>}
                  {loading ? "Guardando..." : (activeTab === "crear" ? "Crear Ramo" : "Guardar Cambios")}
                </button>
            </form>
        </div>
      )}

      {/* LISTADO DE RAMOS (CATÁLOGO CON SKELETONS) */}
      {activeTab === "ver" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // --- SKELETON LOADERS (BEIGE/CREMA) ---
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-[400px] border border-[#F5EFE6] overflow-hidden shadow-sm">
                <div className="h-64 bg-[#F9F6EE] animate-pulse flex items-center justify-center">
                  <ImageIcon className="text-[#EADBC8] opacity-50" size={40} />
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-[#F5EFE6] animate-pulse rounded w-3/4"></div>
                    <div className="h-3 bg-[#FAF7F2] animate-pulse rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-[#FDFBF7] animate-pulse rounded w-1/4"></div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#FDFBF7]">
                    <div className="h-9 bg-[#F9F6EE] animate-pulse rounded-lg"></div>
                    <div className="h-9 bg-[#FFF5F5] animate-pulse rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))
          ) : ramos.length > 0 ? (
            ramos.map((ramo) => (
              <div key={ramo.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition-all hover:shadow-md hover:translate-y-[-2px] ${!ramo.activo ? 'opacity-60 grayscale' : 'border-gray-100'}`}>
                <div className="relative h-64 bg-gray-50 group cursor-pointer" onClick={() => handleEditClick(ramo)}>
                  {ramo.foto_principal ? <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-4xl opacity-20">💐</div>}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-black text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">Editar</span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg leading-tight">{ramo.nombre}</h3>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${ramo.activo ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{ramo.activo ? 'Activo' : 'Pausado'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="font-serif font-bold text-lg text-[#C5A059]">{ramo.precio_base} Bs</span>
                    {ramo.es_oferta && <span className="text-[10px] line-through text-gray-400">{ramo.precio_oferta} Bs</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                      <button onClick={() => handleEditClick(ramo)} className="bg-gray-50 text-gray-600 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gray-100 transition-colors">✏️ Editar</button>
                      <button onClick={() => handleDelete(ramo.id)} className="bg-red-50 text-red-400 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-100 transition-colors">🗑️ Eliminar</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="mx-auto text-gray-300 mb-4" size={48}/>
              <p className="text-gray-400 italic font-serif">Aún no hay ramos en tu catálogo de Flor de Loto.</p>
            </div>
          )}
        </div>
      )}

      {/* SELECTOR DE FLORES */}
      {showFlorSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white"><h3 className="font-serif text-xl italic">Seleccionar Flor</h3><button onClick={() => setShowFlorSelector(false)} className="text-2xl hover:text-red-400">&times;</button></div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 bg-[#F9F6EE]">
              {auxData.flores.map((flor) => (
                <div key={flor.id} onClick={() => handleAddItem('flor', flor.id)} className="bg-white rounded-xl p-2 border border-gray-100 cursor-pointer text-center group hover:border-[#C5A059] transition-all">
                  <div className="relative aspect-square mb-2">{flor.foto && <Image src={flor.foto} alt={flor.nombre} fill className="object-cover rounded-lg" />}</div>
                  <h4 className="font-bold text-sm truncate group-hover:text-[#C5A059]">{flor.nombre}</h4>
                  <p className="text-[10px] text-[#C5A059] font-bold">{flor.precio_unitario} Bs / u</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SELECTOR DE ENVOLTURAS */}
      {showEnvolturaSelector && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white"><h3 className="font-serif text-xl italic">Seleccionar Material</h3><button onClick={() => setShowEnvolturaSelector(false)} className="text-2xl hover:text-red-400">&times;</button></div>
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-5 gap-4 bg-[#F9F6EE]">
              {auxData.envolturas.map((env) => (
                <div key={env.id} onClick={() => handleAddItem('envoltura', env.id)} className="bg-white rounded-xl p-2 border border-gray-100 cursor-pointer text-center group hover:border-[#C5A059] transition-all">
                  <div className="relative aspect-square mb-2">{env.foto ? <Image src={env.foto} alt={env.nombre} fill className="object-cover rounded-lg" /> : <div className="h-full flex items-center justify-center text-2xl">🎀</div>}</div>
                  <h4 className="font-bold text-sm truncate group-hover:text-[#C5A059]">{env.nombre}</h4>
                  <p className="text-[10px] text-gray-400 font-bold">{env.precio_unitario} Bs</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE ALERTA PERSONALIZADO --- */}
      {alertModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-250">
            <div className="p-8 text-center">
              {/* ICONO DINÁMICO */}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                alertModal.type === 'success' ? 'bg-green-50 text-green-500' : 
                alertModal.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-[#F9F6EE] text-[#C5A059]'
              }`}>
                {alertModal.type === 'success' && <Check size={32} />}
                {alertModal.type === 'error' && <X size={32} />}
                {alertModal.type === 'confirm' && <Package size={32} />}
              </div>

              <h3 className="font-serif text-xl text-gray-800 mb-2">
                {alertModal.type === 'confirm' ? '¿Confirmar acción?' : 'Notificación'}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">
                {alertModal.message}
              </p>

              {/* BOTONES */}
              <div className="flex gap-3">
                {alertModal.type === 'confirm' ? (
                  <>
                    <button 
                      onClick={() => setAlertModal({ ...alertModal, show: false })}
                      className="flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        alertModal.onConfirm?.();
                        setAlertModal({ ...alertModal, show: false });
                      }}
                      className="flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white bg-red-500 shadow-lg shadow-red-200 hover:bg-red-600 transition-all"
                    >
                      Eliminar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setAlertModal({ ...alertModal, show: false })}
                    className="w-full py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white bg-[#0A0A0A] shadow-lg hover:bg-[#C5A059] transition-all"
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}