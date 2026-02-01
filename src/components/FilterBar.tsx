"use client";

import React, { useState } from "react";
import { Filter, X, ChevronDown, Check, Flower2, Palette, LayoutGrid } from "lucide-react";

export interface ActiveFilters {
  flores: string[];
  colores: string[];
  categorias: string[];
  precioMax: number;
}

interface FilterBarProps {
  options: {
    flores: string[];
    colores: string[];
    categorias: { id: string; nombre: string }[];
    precioMaximoData: number;
  };
  onFilterChange: (filters: ActiveFilters) => void;
}

export default function FilterBar({ options, onFilterChange }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<ActiveFilters>({
    flores: [], colores: [], categorias: [], precioMax: options.precioMaximoData
  });
  const [appliedFilters, setAppliedFilters] = useState<ActiveFilters>({
    flores: [], colores: [], categorias: [], precioMax: options.precioMaximoData
  });

  const toggleItem = (type: keyof ActiveFilters, value: string) => {
    setTempFilters(prev => {
      const current = prev[type] as string[];
      return {
        ...prev,
        [type]: current.includes(value) ? current.filter(v => v !== value) : [...current, value]
      };
    });
  };

  const handleApply = () => {
    setAppliedFilters(tempFilters);
    onFilterChange(tempFilters);
    setIsOpen(false);
  };

  const removeApplied = (type: keyof ActiveFilters, value: string) => {
    const updated = {
      ...appliedFilters,
      [type]: (appliedFilters[type] as string[]).filter(v => v !== value)
    };
    setAppliedFilters(updated);
    setTempFilters(updated);
    onFilterChange(updated);
  };

  const resetPrice = () => {
    const updated = { ...appliedFilters, precioMax: options.precioMaximoData };
    setAppliedFilters(updated);
    setTempFilters(updated);
    onFilterChange(updated);
  };

  const clearAll = () => {
    const reset = { flores: [], colores: [], categorias: [], precioMax: options.precioMaximoData };
    setAppliedFilters(reset);
    setTempFilters(reset);
    onFilterChange(reset);
  };

  const hasActiveFilters = appliedFilters.categorias.length > 0 || 
                           appliedFilters.flores.length > 0 || 
                           appliedFilters.colores.length > 0 || 
                           appliedFilters.precioMax < options.precioMaximoData;

  return (
    <div className="relative z-40 mb-8 px-2">
      <div className="flex flex-wrap items-center gap-3">
        {/* BOTÓN DISPARADOR */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all font-bold text-[10px] uppercase tracking-widest ${
            isOpen ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#C5A059]'
          }`}
        >
          <Filter size={14} />
          {isOpen ? 'Cerrar' : 'Filtrar'}
          <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* PILLS DE FILTROS ACTIVOS (Se muestran al lado) */}
        <div className="flex flex-wrap gap-2 items-center">
          {appliedFilters.categorias.map(id => (
            <span key={id} className="flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-[9px] font-bold uppercase border border-rose-200">
              {options.categorias.find(c => c.id === id)?.nombre}
              <X size={10} className="cursor-pointer" onClick={() => removeApplied('categorias', id)} />
            </span>
          ))}
          {appliedFilters.flores.map(f => (
            <span key={f} className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase border border-amber-200">
              {f}
              <X size={10} className="cursor-pointer" onClick={() => removeApplied('flores', f)} />
            </span>
          ))}
          {appliedFilters.colores.map(c => (
            <span key={c} className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-800 rounded-full text-[9px] font-bold uppercase border border-gray-300">
              {c}
              <X size={10} className="cursor-pointer" onClick={() => removeApplied('colores', c)} />
            </span>
          ))}
          {appliedFilters.precioMax < options.precioMaximoData && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-bold uppercase border border-emerald-200">
              Max: Bs {appliedFilters.precioMax}
              <X size={10} className="cursor-pointer" onClick={resetPrice} />
            </span>
          )}
          {hasActiveFilters && (
            <button onClick={clearAll} className="ml-2 text-[9px] font-bold text-gray-400 hover:text-red-500 underline decoration-dotted underline-offset-2 transition-colors">
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* PANEL DESPLEGABLE */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-full md:w-[700px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* CATEGORÍAS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#C5A059] font-bold text-[10px] uppercase tracking-tighter">
                <LayoutGrid size={14} /> TIPO
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {options.categorias.map(cat => (
                  <button key={cat.id} onClick={() => toggleItem('categorias', cat.id)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-all ${tempFilters.categorias.includes(cat.id) ? 'bg-rose-100 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {cat.nombre} {tempFilters.categorias.includes(cat.id) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* FLORES */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#C5A059] font-bold text-[10px] uppercase tracking-tighter">
                <Flower2 size={14} /> FLORES
              </div>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {options.flores.map(flor => (
                  <button key={flor} onClick={() => toggleItem('flores', flor)} className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-all ${tempFilters.flores.includes(flor) ? 'bg-amber-100 text-amber-800 font-bold' : 'text-gray-600 hover:bg-gray-100'}`}>
                    {flor} {tempFilters.flores.includes(flor) && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* COLORES */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#C5A059] font-bold text-[10px] uppercase tracking-tighter">
                <Palette size={14} /> COLOR
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {options.colores.map(color => (
                  <button key={color} onClick={() => toggleItem('colores', color)} className={`px-2 py-1.5 rounded-md text-[10px] font-bold border transition-all ${tempFilters.colores.includes(color) ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PRECIO Y ACEPTAR */}
          <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                  <span>Presupuesto Máximo</span>
                  <span className="text-[#C5A059]">Bs. {tempFilters.precioMax}</span>
                </div>
                <input type="range" min="0" max={options.precioMaximoData} value={tempFilters.precioMax} onChange={(e) => setTempFilters({...tempFilters, precioMax: parseInt(e.target.value)})} className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#C5A059]" />
             </div>
             <button onClick={handleApply} className="w-full md:w-auto px-12 py-3 bg-[#0A0A0A] text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#C5A059] transition-all">
                Aceptar y Filtrar
             </button>
          </div>
        </div>
      )}
    </div>
  );
}