"use client";

import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface AddToCartProps {
  id: string;
  nombre: string;
  precio: number;
  foto: string | null;
  type?: string;
  className?: string;
  onAfterAdd?: () => void;
  personalizacion?: any;
}

export default function AddToCartButton({ id, nombre, precio, foto, className, onAfterAdd, personalizacion }: AddToCartProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showCheck, setShowCheck] = useState(false);

  const handleAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Si ya se está procesando, no hacer nada
    if (isPending || showCheck) return;

    try {
      setIsPending(true); // Bloqueamos el botón inmediatamente

      // Captura posición para la animación
      const rect = e.currentTarget.getBoundingClientRect();
      setStartPos({ x: rect.left, y: rect.top });
      
      setIsAnimating(true);

      // Agrega al carrito (la lógica del ID ahora vive en el Contexto)
      await addToCart({ 
        id, 
        nombre: personalizacion ? `${nombre} (Personalizado)` : nombre, 
        precio, 
        foto,
        personalizacion 
      });

      setShowCheck(true);

      // Espera a que termine la animación para limpiar estados y redirigir
      setTimeout(() => {
        setIsAnimating(false);
        setIsPending(false);
        
        toast("¡Ramo agregado! Revise su carrito para finalizar el pedido.", "success");
        
        // Redirige al homepage
        router.push("/");

        if (onAfterAdd) onAfterAdd();
      }, 800);

    } catch (error) {
      console.error(error);
      setIsPending(false);
      setShowCheck(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAction}
        disabled={isPending || showCheck}
        className={`relative z-10 overflow-hidden bg-[#050505] text-[#D4AF37] border border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#050505] py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 text-xs font-bold uppercase tracking-wider disabled:opacity-80 disabled:cursor-not-allowed ${
          showCheck ? "bg-[#D4AF37] text-[#050505]" : ""
        } ${className}`}
      >
        {isPending && !showCheck ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : showCheck ? (
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Agregado</span>
          </div>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar al Carrito</span>
          </>
        )}
      </button>

      {/* Animación de la imagen volando al carrito */}
      {isAnimating && foto && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-xl animate-fly-to-cart"
          style={{
            left: startPos.x,
            top: startPos.y,
            width: "60px",
            height: "60px",
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