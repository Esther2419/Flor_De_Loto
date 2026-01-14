"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface AddToCartProps {
  id: string;
  nombre: string;
  precio: number;
  foto: string | null;
  className?: string;
  onAfterAdd?: () => void;
}

export default function AddToCartButton({ id, nombre, precio, foto, className, onAfterAdd }: AddToCartProps) {
  const { addToCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showCheck, setShowCheck] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Capturar posición del clic para iniciar la animación
    const rect = e.currentTarget.getBoundingClientRect();
    setStartPos({ x: rect.left, y: rect.top });
    setIsAnimating(true);

    addToCart({ id, nombre, precio, foto });
    setShowCheck(true);
    setTimeout(() => {
        setIsAnimating(false);
        setShowCheck(false);
        if (onAfterAdd) onAfterAdd();
    }, 800);
  };

  return (
    <>
        <button
          onClick={handleClick}
          disabled={showCheck}
          className={`relative overflow-hidden bg-[#050505] text-[#D4AF37] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 text-xs font-bold uppercase tracking-wider ${showCheck ? "bg-[#D4AF37] text-[#050505]" : ""} ${className}`}
        >
          {showCheck ? (
             <div className="animate-in zoom-in spin-in duration-300 flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Agregado</span>
             </div>
          ) : (
             <>
               <ShoppingCart className="w-4 h-4" />
               <span>Agregar</span>
             </>
          )}
        </button>

        {isAnimating && foto && (
            <div 
                className="fixed z-[9999] pointer-events-none rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-xl animate-fly-to-cart"
                style={{
                    left: startPos.x,
                    top: startPos.y,
                    width: '60px',
                    height: '60px',
                    // @ts-ignore
                    "--target-x": "90vw",
                    "--target-y": "20px",
                }}
            >
                <Image src={foto} alt="" fill className="object-cover" />
            </div>
        )}
    </>
  );
}