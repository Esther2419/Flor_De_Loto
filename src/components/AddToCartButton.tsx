"use client";

import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface AddToCartProps {
  id: string; 
  productoId?: string;
  nombre: string;
  precioBase: number;
  precioOferta?: number;
  esOferta?: boolean;
  foto: string | null;
  type?: string;
  className?: string;
  onAfterAdd?: () => void;
  personalizacion?: any;
}

export default function AddToCartButton({ 
  id, 
  productoId, 
  nombre, 
  precioBase, 
  precioOferta,
  esOferta,
  foto, 
  type, 
  className, 
  onAfterAdd, 
  personalizacion 
}: AddToCartProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isPending, setIsPending] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showCheck, setShowCheck] = useState(false);

  const handleAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    if (isPending || showCheck) return;

    try {
      setIsPending(true); 

      const rect = e.currentTarget.getBoundingClientRect();
      setStartPos({ x: rect.left, y: rect.top });
      setIsAnimating(true);

      const finalProductoId = productoId || id; 
      const precioFinal = esOferta && precioOferta ? precioOferta : precioBase;

      // --- LÓGICA DE LIMPIEZA DE PERSONALIZACIÓN ---
      let realPersonalizacion = null;
      
      if (personalizacion) {
        const tieneFlores = personalizacion.floresExtra && 
                           Object.values(personalizacion.floresExtra).some((cant: any) => cant > 0);
        
        const tieneEnvolturas = personalizacion.envolturas && 
                               Object.keys(personalizacion.envolturas).length > 0;
        
        const tieneDedicatoria = personalizacion.dedicatoria && 
                                personalizacion.dedicatoria.trim() !== "";

        // Solo si tiene algo de lo anterior, guardamos el objeto
        if (tieneFlores || tieneEnvolturas || tieneDedicatoria) {
          realPersonalizacion = {
            floresExtra: tieneFlores ? personalizacion.floresExtra : null,
            envolturas: tieneEnvolturas ? personalizacion.envolturas : null,
            dedicatoria: tieneDedicatoria ? personalizacion.dedicatoria : null
          };
        }
      }

      await addToCart({ 
        id, 
        productoId: finalProductoId,
        // Solo añade "(Personalizado)" al nombre si realPersonalizacion no es null
        nombre: realPersonalizacion ? `${nombre} (Personalizado)` : nombre, 
        precio: precioFinal,
        precioOriginal: precioBase,
        esOferta: !!esOferta,
        foto,
        tipo: (type as 'ramo' | 'flor') || 'ramo', 
        personalizacion: realPersonalizacion 
      });

      setShowCheck(true);

      setTimeout(() => {
        setIsAnimating(false);
        setIsPending(false);
        toast("¡Agregado con éxito!", "success");
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