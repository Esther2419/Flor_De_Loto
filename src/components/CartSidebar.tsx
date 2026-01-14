"use client";

import { useCart } from "@/context/CartContext";
import { X, Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function CartSidebar() {
  const { isCartOpen, toggleCart, items, removeFromCart, updateQuantity, total } = useCart();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isCartOpen) toggleCart();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCartOpen, toggleCart]);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} 
      />

      <div
        ref={sidebarRef}

        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#C5A059]/30 z-[70] transform transition-transform duration-300 shadow-2xl ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full text-[#5D4E4E]">
          
          <div className="p-6 border-b border-[#C5A059]/20 flex justify-between items-center bg-[#F9F6EE]/50">
            <h2 className="text-xl font-serif text-[#0A0A0A] italic flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C5A059]" /> Tu Carrito
            </h2>
            <button onClick={toggleCart} className="text-gray-400 hover:text-[#C5A059] transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-10 opacity-60">
                <p className="font-serif italic text-gray-400">Tu carrito está vacío</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                    {item.foto ? (
                      <Image src={item.foto} alt={item.nombre} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D4AF37]">❀</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-[#0A0A0A] font-medium text-sm md:text-base leading-tight font-serif">{item.nombre}</h3>
                        <p className="text-[#C5A059] font-bold mt-1 text-sm">Bs. {item.precio * item.cantidad}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-2 bg-white w-fit rounded-lg p-1 border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-gray-400 hover:text-[#C5A059] hover:bg-gray-50 rounded disabled:opacity-30"
                            disabled={item.cantidad <= 1}
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-[#5D4E4E] min-w-[1.5ch] text-center">{item.cantidad}</span>
                        <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 text-gray-400 hover:text-[#C5A059] hover:bg-gray-50 rounded"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-300 hover:text-red-500 self-start p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#C5A059]/20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-serif text-[#5D4E4E]">Total Estimado</span>
                <span className="text-2xl font-bold text-[#C5A059]">Bs. {total}</span>
              </div>
              <button 
                className="w-full bg-[#0A0A0A] hover:bg-[#C5A059] hover:text-white text-[#D4AF37] font-bold py-4 rounded-xl transition-all duration-300 shadow-lg uppercase tracking-widest text-sm"
                onClick={() => alert("Funcionalidad de pago pendiente")}
              >
                Confirmar Pedido
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}