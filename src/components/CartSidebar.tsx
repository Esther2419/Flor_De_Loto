"use client";

import React from "react";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const { items, isCartOpen, toggleCart, updateQuantity, removeFromCart, total, count } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  if (!isCartOpen) return null;

  const handleConfirmarPedido = () => {
    toggleCart();
    if (!session) {
      router.push("/login?callbackUrl=/reservar");
    } else {
      router.push("/reservar");
    }
  };

  return (
    <>
      {/* Overlay de fondo */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
        onClick={toggleCart}
      />

      {/* Sidebar Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-white sticky top-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#C5A059]/10 p-2 rounded-full">
              <ShoppingBag className="text-[#C5A059]" size={20} />
            </div>
            <div>
              <h2 className="font-serif italic text-xl text-gris">Tu Carrito</h2>
              <p className="text-[10px] uppercase tracking-widest text-gray-400">
                {count} {count === 1 ? 'Producto' : 'Productos'} seleccionado(s)
              </p>
            </div>
          </div>
          <button 
            onClick={toggleCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Lista de Productos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 font-serif italic">Tu carrito está vacío</p>
              <button 
                onClick={toggleCart}
                className="text-[#C5A059] text-xs font-bold uppercase tracking-widest hover:underline"
              >
                Seguir explorando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image 
                    src={item.foto || "/portada.jpg"} 
                    alt={item.nombre}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-gris uppercase tracking-tight">
                        {item.nombre}
                        {item.esOferta && (
                          <span className="ml-2 text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">OFERTA</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-[#C5A059] font-medium">Bs {item.precio}</p>
                        {item.esOferta && item.precioOriginal && (
                          <p className="text-[10px] text-gray-400 line-through italic decoration-red-400/50">Bs {item.precioOriginal}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {!item.personalizacion ? (
                      <div className="flex items-center border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1.5 hover:bg-white text-gray-500 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold">{item.cantidad}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1.5 hover:bg-white text-gray-500 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-gray-400">
                        Cantidad: <span className="font-bold text-gris">{item.cantidad}</span>
                      </div>
                    )}
                    
                    <p className="text-sm font-bold text-gris">
                      Bs {item.precio * item.cantidad}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t bg-white space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-400 text-xs uppercase tracking-widest font-bold">
                <span>Subtotal</span>
                <span>Bs {total}</span>
              </div>
              <div className="flex justify-between text-gris text-xl font-bold border-t pt-2">
                <span className="font-serif italic capitalize">Total Estimado</span>
                <span className="text-[#C5A059]">Bs {total}</span>
              </div>
            </div>

            <button 
              onClick={handleConfirmarPedido}
              className="w-full bg-[#C5A059] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 hover:bg-[#b38f4d] transition-all shadow-lg shadow-[#C5A059]/20 group"
            >
              Confirmar Pedido
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[10px] text-center text-gray-400 italic">
              * El costo de envío se calculará en el siguiente paso.
            </p>
          </div>
        )}
      </div>
    </>
  );
}