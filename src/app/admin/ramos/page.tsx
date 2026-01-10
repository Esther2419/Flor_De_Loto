"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createRamo, getRamos, updateRamo, deleteRamo, getAuxData } from "./actions";

// --- TIPOS ---
type AuxData = {
  categorias: { id: string, nombre: string }[];
  envolturas: { id: string, nombre: string, precio_unitario: number }[];
  flores: { id: string, nombre: string, precio_unitario: number, foto: string, color: string }[];
};

type DetalleRamo = { flor_id: string; cantidad: number };

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
  envoltura_default_id: string;
  categorias?: { nombre: string };
  envolturas?: { nombre: string };
  ramo_detalle: { flor_id: string; cantidad_base: number; flores: { nombre: string, foto: string, color: string } }[];
  ramo_imagenes: { url_foto: string }[];
};

// --- FUNCIÓN COLOR ---
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
  
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    descripcion: "",
    precio_base: "",
    categoria_id: "",
    envoltura_default_id: "",
    tipo: "mano",
    es_oferta: false,
    precio_oferta: "",
    activo: true,
    foto_principal: "",
  });

  const [detalles, setDetalles] = useState<DetalleRamo[]>([]);
  const [imagenesExtra, setImagenesExtra] = useState<string[]>([]);
  
  const [showFlorSelector, setShowFlorSelector] = useState(false);

  const [uploadingPrincipal, setUploadingPrincipal] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ramosData, aux] = await Promise.all([getRamos(), getAuxData()]);
    setRamos(ramosData);
    setAuxData(aux);
    setLoading(false);
  };

  // --- SUBIDA IMÁGENES ---
  const handleUpload = async (file: File, isPrincipal: boolean) => {
    const setter = isPrincipal ? setUploadingPrincipal : setUploadingExtra;
    setter(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `ramo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('ramos').upload(fileName, file); 

      if (error) throw error;
      const { data } = supabase.storage.from('ramos').getPublicUrl(fileName);

      if (isPrincipal) {
        setFormData(prev => ({ ...prev, foto_principal: data.publicUrl }));
      } else {
        setImagenesExtra(prev => [...prev, data.publicUrl]);
      }
    } catch (error) {
      alert("Error subiendo imagen.");
      console.error(error);
    } finally {
      setter(false);
    }
  };

  // --- GESTIÓN COMPOSICIÓN ---
  const handleSelectFlor = (florId: string) => {
    const existe = detalles.find(d => d.flor_id === florId);
    if (existe) {
        const newDetalles = detalles.map(d => d.flor_id === florId ? { ...d, cantidad: d.cantidad + 1 } : d);
        setDetalles(newDetalles);
    } else {
        setDetalles([...detalles, { flor_id: florId, cantidad: 1 }]);
    }
    setShowFlorSelector(false); 
  };

  const removeDetalle = (index: number) => {
    const newDetalles = [...detalles];
    newDetalles.splice(index, 1);
    setDetalles(newDetalles);
  };

  const updateDetalleCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    const newDetalles = [...detalles];
    newDetalles[index].cantidad = nuevaCantidad;
    setDetalles(newDetalles);
  };

  const costoEstimado = detalles.reduce((acc, curr) => {
    const flor = auxData.flores.find(f => f.id === curr.flor_id);
    return acc + (flor ? flor.precio_unitario * curr.cantidad : 0);
  }, 0);

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      detalles: detalles.filter(d => d.flor_id),
      imagenes_extra: imagenesExtra
    };

    let res;
    if (activeTab === "editar" && formData.id) {
      res = await updateRamo(formData.id, payload);
    } else {
      res = await createRamo(payload);
    }

    if (res.success) {
      alert(activeTab === "crear" ? "¡Ramo creado!" : "¡Ramo actualizado!");
      resetForm();
      setActiveTab("ver");
      loadData();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      id: "", nombre: "", descripcion: "", precio_base: "", categoria_id: "", 
      envoltura_default_id: "", tipo: "mano", es_oferta: false, precio_oferta: "", 
      activo: true, foto_principal: ""
    });
    setDetalles([]);
    setImagenesExtra([]);
  };

  const handleEditClick = (ramo: Ramo) => {
    setFormData({
      id: ramo.id,
      nombre: ramo.nombre,
      descripcion: ramo.descripcion || "",
      precio_base: ramo.precio_base.toString(),
      categoria_id: ramo.categoria_id?.toString() || "",
      envoltura_default_id: ramo.envoltura_default_id?.toString() || "",
      tipo: ramo.tipo || "mano",
      es_oferta: ramo.es_oferta || false,
      precio_oferta: ramo.precio_oferta?.toString() || "",
      activo: ramo.activo || true,
      foto_principal: ramo.foto_principal || "",
    });
    
    setDetalles(ramo.ramo_detalle.map(d => ({
      flor_id: d.flor_id.toString(),
      cantidad: d.cantidad_base
    })));

    setImagenesExtra(ramo.ramo_imagenes.map(img => img.url_foto));
    setActiveTab("editar");
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este ramo?")) {
      await deleteRamo(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#0A0A0A] pb-20 relative">
      
      {/* NAVBAR */}
      <nav className="bg-[#0A0A0A] text-white p-4 border-b border-[#C5A059] flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-[#C5A059] hover:text-white transition-colors flex items-center text-xs uppercase tracking-widest">
            ← Volver
          </Link>
          <div className="h-4 w-px bg-[#C5A059]/30"></div>
          <h1 className="font-serif text-lg italic text-white">Gestión de Ramos</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-4xl text-[#0A0A0A] mb-2">Catálogo de Ramos</h2>
          <p className="text-gray-500 font-light text-sm">Diseña combinaciones, asigna precios y gestiona la galería.</p>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 gap-4 mb-10 max-w-2xl mx-auto">
          <button onClick={() => { setActiveTab("ver"); loadData(); }} className={`p-4 rounded-xl border transition-all ${activeTab === "ver" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">📋 Ver Catálogo</span>
          </button>
          <button onClick={() => { setActiveTab("crear"); resetForm(); }} className={`p-4 rounded-xl border transition-all ${activeTab === "crear" ? "bg-[#0A0A0A] text-white shadow-lg" : "bg-white hover:border-[#C5A059]"}`}>
            <span className="font-bold text-xs uppercase tracking-wider">💐 Nuevo Ramo</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#C5A059]/10 p-8 min-h-[500px]">
          
          {(activeTab === "crear" || activeTab === "editar") && (
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
               
               <h3 className="font-serif text-2xl text-[#0A0A0A] mb-6 text-center border-b border-[#C5A059]/20 pb-4">
                 {activeTab === "crear" ? "Diseñar Nuevo Ramo" : "Modificar Ramo"}
               </h3>

               {/* SECCIÓN FOTOS */}
               <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  {/* Principal */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2">Foto Principal</span>
                    <div className="relative w-full aspect-[3/4] rounded-xl border-2 border-dashed border-[#C5A059]/30 bg-white overflow-hidden group hover:border-[#C5A059] transition-colors cursor-pointer shadow-sm">
                        <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], true)} className="absolute inset-0 z-20 opacity-0 cursor-pointer" accept="image/*" />
                        {uploadingPrincipal ? (
                           <div className="absolute inset-0 flex items-center justify-center text-[#C5A059] animate-pulse font-bold text-xs">SUBIENDO...</div>
                        ) : formData.foto_principal ? (
                           <Image src={formData.foto_principal} alt="Main" fill className="object-cover" />
                        ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 group-hover:text-[#C5A059]">
                              <span className="text-4xl">📷</span>
                              <span className="text-[10px] mt-2 font-bold uppercase">Subir</span>
                           </div>
                        )}
                    </div>
                  </div>
                  {/* Galería */}
                  <div className="md:col-span-8">
                    <span className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Galería Extra ({imagenesExtra.length})</span>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                       {imagenesExtra.map((img, idx) => (
                         <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group shadow-sm bg-white">
                            <Image src={img} alt="" fill className="object-cover" />
                            <button type="button" onClick={() => setImagenesExtra(imagenesExtra.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                         </div>
                       ))}
                       <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-white hover:border-[#C5A059] cursor-pointer transition-colors bg-white">
                          <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], false)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                          <span className="text-3xl text-gray-300 group-hover:text-[#C5A059]">+</span>
                          {uploadingExtra && <span className="absolute text-[8px] bottom-1 text-[#C5A059] font-bold">...</span>}
                       </div>
                    </div>
                  </div>
               </div>

               {/* SECCIÓN DATOS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-5">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nombre del Ramo</label>
                        <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 mt-1 focus:ring-1 focus:ring-[#C5A059]" placeholder="Ej. Amor Eterno" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categoría</label>
                            <select required value={formData.categoria_id} onChange={e => setFormData({...formData, categoria_id: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 mt-1 text-sm">
                            <option value="">-- Evento --</option>
                            {auxData.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tipo de Armado</label>
                            <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 mt-1 text-sm">
                                <option value="mano">Ramo de mano</option>
                                <option value="copa">Copa / Florero</option>
                                <option value="caja">Caja</option>
                                <option value="canasta">Canasta</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Envoltura / Papel</label>
                        <select value={formData.envoltura_default_id} onChange={e => setFormData({...formData, envoltura_default_id: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 mt-1 text-sm">
                        <option value="">-- Sin papel específico --</option>
                        {auxData.envolturas.map(e => <option key={e.id} value={e.id}>{e.nombre} (Costo: {e.precio_unitario}Bs)</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Descripción</label>
                        <textarea value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full bg-[#F9F6EE] border-none rounded-lg p-3 mt-1" rows={4} placeholder="Descripción romántica..." />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="bg-[#F9F6EE] p-5 rounded-xl border border-[#C5A059]/10">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Precio de Venta (Bs)</label>
                        <input required type="number" step="0.5" value={formData.precio_base} onChange={e => setFormData({...formData, precio_base: e.target.value})} onWheel={(e) => e.currentTarget.blur()} className="w-full bg-white border border-gray-200 rounded-lg p-3 mt-1 font-bold text-xl text-[#C5A059]" placeholder="0.00" />
                        
                        <div className="mt-4 flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="oferta" checked={formData.es_oferta} onChange={e => setFormData({...formData, es_oferta: e.target.checked})} className="w-4 h-4 text-[#C5A059] rounded cursor-pointer" />
                                <label htmlFor="oferta" className="text-sm font-bold text-gray-700 cursor-pointer">Activar Oferta</label>
                            </div>
                            {formData.es_oferta && (
                                <input type="number" placeholder="Precio Rebajado" value={formData.precio_oferta} onChange={e => setFormData({...formData, precio_oferta: e.target.value})} onWheel={(e) => e.currentTarget.blur()} className="w-full bg-white border border-red-200 rounded-lg p-2 text-sm text-red-500 font-bold" />
                            )}
                        </div>
                    </div>

                    {/* COMPOSICIÓN FLORAL MEJORADA (CON +/-) */}
                    <div className="border-2 border-dashed border-[#C5A059]/20 rounded-xl p-5 relative">
                        <span className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-bold uppercase text-[#C5A059]">Composición Floral</span>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {/* Lista de flores agregadas */}
                            {detalles.map((detalle, index) => {
                              const florInfo = auxData.flores.find(f => f.id === detalle.flor_id);
                              return (
                                <div key={index} className="flex gap-3 items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100 animate-in slide-in-from-left-2">
                                    {/* Miniatura Flor */}
                                    <div className="w-10 h-10 rounded-full border border-gray-200 relative overflow-hidden flex-shrink-0">
                                      {florInfo?.foto ? <Image src={florInfo.foto} alt="" fill className="object-cover" /> : <span className="flex items-center justify-center h-full text-xs">🌸</span>}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <p className="text-xs font-bold text-gray-700 line-clamp-1">{florInfo?.nombre || "Flor eliminada"}</p>
                                      <p className="text-[10px] text-gray-400">Bs {florInfo?.precio_unitario} c/u</p>
                                    </div>
                                    
                                    {/* CONTROLADOR DE CANTIDAD CON BOTONES (+ -) */}
                                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                        <button 
                                            type="button" 
                                            onClick={() => updateDetalleCantidad(index, detalle.cantidad - 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#0A0A0A] transition-colors rounded-l-lg"
                                        >
                                            -
                                        </button>
                                        <div className="w-8 text-center text-sm font-bold text-[#0A0A0A]">
                                            {detalle.cantidad}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => updateDetalleCantidad(index, detalle.cantidad + 1)}
                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#0A0A0A] transition-colors rounded-r-lg"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button type="button" onClick={() => removeDetalle(index)} className="text-red-400 hover:text-red-600 p-1 ml-2" title="Quitar flor">×</button>
                                </div>
                              );
                            })}

                            <button type="button" onClick={() => setShowFlorSelector(true)} className="w-full py-2 border border-[#C5A059] border-dashed rounded-lg text-[#C5A059] text-xs font-bold uppercase hover:bg-[#C5A059] hover:text-white transition-colors flex items-center justify-center gap-2">
                              <span>+</span> Añadir Flor
                            </button>
                        </div>
                        
                        <div className="mt-2 text-right text-[10px] text-gray-400">
                            Costo aprox. flores: <span className="font-bold text-gray-600">{costoEstimado.toFixed(2)} Bs</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="activo" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} className="w-4 h-4 text-green-500 rounded cursor-pointer" />
                        <label htmlFor="activo" className="text-sm text-gray-600 cursor-pointer select-none">Ramo visible en catálogo</label>
                    </div>
                 </div>
               </div>

               <button disabled={loading} type="submit" className="w-full bg-[#0A0A0A] text-[#C5A059] py-4 rounded-xl font-bold tracking-[0.2em] uppercase hover:bg-[#C5A059] hover:text-white transition-all shadow-lg disabled:opacity-50">
                 {loading ? "Procesando..." : (activeTab === "crear" ? "Crear Ramo" : "Guardar Cambios")}
               </button>
            </form>
          )}

          {/* --- VISTA LISTA DE RAMOS --- */}
          {activeTab === "ver" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in">
               {ramos.map((ramo) => (
                 <div key={ramo.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border ${!ramo.activo ? 'border-gray-200 opacity-60 grayscale' : 'border-gray-100'}`}>
                    <div className="relative h-72 bg-gray-100 group cursor-pointer" onClick={() => handleEditClick(ramo)}>
                       {ramo.foto_principal ? (
                         <Image src={ramo.foto_principal} alt={ramo.nombre} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                       ) : (
                         <div className="flex items-center justify-center h-full text-4xl opacity-20">💐</div>
                       )}
                       <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                          {ramo.es_oferta && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md animate-pulse">OFERTA</span>}
                          {!ramo.activo && <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">OCULTO</span>}
                       </div>
                       <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16 text-white">
                          <h3 className="font-serif text-2xl italic mb-1">{ramo.nombre}</h3>
                          <span className="text-[10px] uppercase tracking-widest opacity-80 border border-white/30 px-2 py-0.5 rounded-full">{ramo.categorias?.nombre || "General"}</span>
                       </div>
                    </div>
                    <div className="p-5">
                       <div className="flex justify-between items-center mb-4">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio</span>
                             <div className="flex items-baseline gap-2">
                                <span className={`font-serif font-bold text-xl ${ramo.es_oferta ? 'text-gray-400 line-through text-sm' : 'text-[#C5A059]'}`}>{ramo.precio_base} Bs</span>
                                {ramo.es_oferta && <span className="font-serif font-bold text-2xl text-red-500">{ramo.precio_oferta} Bs</span>}
                             </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</span>
                             <span className="text-xs font-bold text-gray-700 capitalize">{ramo.tipo}</span>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                          <button onClick={() => handleEditClick(ramo)} className="bg-[#0A0A0A] text-[#C5A059] py-2.5 rounded-lg text-xs font-bold uppercase hover:bg-[#C5A059] hover:text-white transition-colors">✏️ Editar</button>
                          <button onClick={() => handleDelete(ramo.id)} className="bg-red-50 text-red-400 py-2.5 rounded-lg text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-colors">🗑️ Eliminar</button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* --- MODAL SELECTOR DE FLORES --- */}
        {showFlorSelector && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95">
              
              <div className="bg-[#0A0A0A] p-4 flex justify-between items-center text-white">
                <h3 className="font-serif text-xl italic">Seleccionar Flor</h3>
                <button onClick={() => setShowFlorSelector(false)} className="text-white/60 hover:text-white text-2xl leading-none">&times;</button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 bg-[#F9F6EE] custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {auxData.flores.map((flor) => (
                    <div 
                      key={flor.id} 
                      onClick={() => handleSelectFlor(flor.id)}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#C5A059] hover:scale-105 transition-all group"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        {flor.foto ? (
                          <Image src={flor.foto} alt={flor.nombre} fill className="object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full text-2xl">🌸</div>
                        )}
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: getColorStyle(flor.color) }}></div>
                      </div>
                      <div className="p-3 text-center">
                        <h4 className="font-bold text-sm text-[#0A0A0A] line-clamp-1">{flor.nombre}</h4>
                        <p className="text-xs text-[#C5A059] font-bold mt-1">Bs {flor.precio_unitario}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}