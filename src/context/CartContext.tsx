"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useToast, ToastProvider } from "@/context/ToastContext";
import { supabase } from "@/lib/supabase";
import { 
  getCartAction, 
  syncCartAction, 
  addToCartAction, 
  removeFromCartAction, 
  updateQuantityAction 
} from "@/app/actions/cart";

export interface CartItem {
  id: string;
  productoId: string;
  nombre: string;
  precio: number;
  precioOriginal?: number;
  esOferta?: boolean;
  foto: string | null;
  cantidad: number;
  tipo: 'ramo' | 'flor';
  personalizacion?: any;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, "cantidad">) => Promise<void>;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  metodoEntrega: 'tienda';
  total: number;
  count: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function CartContent({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const metodoEntrega = 'tienda';

  useEffect(() => {
    const loadCart = async () => {
      if (status === "authenticated") {
        try {
          const localCart = JSON.parse(localStorage.getItem("flor-de-loto-cart") || "[]");
          if (localCart.length > 0) {
            const syncedItems = await syncCartAction(localCart);
            if (syncedItems) {
              setItems(syncedItems as unknown as CartItem[]);
              localStorage.removeItem("flor-de-loto-cart"); 
            }
          } else {
            const dbItems = await getCartAction();
            if (dbItems) setItems(dbItems as unknown as CartItem[]);
          }
        } catch (error) {
          console.error("Error cargando carrito:", error);
          toast("Error de conexión al cargar el carrito", "error");
        }
      } else if (status === "unauthenticated") {
        // Limpieza de seguridad: Evitar que queden items de la sesión anterior
        setItems([]); 
        const savedCart = localStorage.getItem("flor-de-loto-cart");
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch (e) {
            localStorage.removeItem("flor-de-loto-cart");
          }
        }
      }
      setIsLoaded(true);
    };
    if (status !== "loading") loadCart();
  }, [status, toast]);

  // Sincronización Realtime (Multi-dispositivo)
  useEffect(() => {
    if (status !== "authenticated") return;
    const channel = supabase.channel('carrito_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carrito_items' }, async () => {
        const dbItems = await getCartAction();
        if (dbItems) setItems(dbItems as unknown as CartItem[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [status]);

  useEffect(() => {
    if (isLoaded && status === "unauthenticated") {
      localStorage.setItem("flor-de-loto-cart", JSON.stringify(items));
    }
  }, [items, isLoaded, status]);

  const addToCart = async (product: Omit<CartItem, "cantidad">) => {
    const prevItems = [...items]; // Snapshot para Rollback

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...currentItems, { ...product, cantidad: 1 }];
    });

    if (status === "authenticated") {
      try {
        await addToCartAction({ ...product, cantidad: 1 });
      } catch (error) {
        setItems(prevItems); // Rollback si falla
        toast("Error al guardar en el servidor", "error");
      }
    }
  };

  const removeFromCart = async (id: string) => {
    const prevItems = [...items]; // Snapshot
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    
    if (status === "authenticated") {
      try {
        await removeFromCartAction(id);
      } catch (error) {
        setItems(prevItems); // Rollback
        toast("Error al eliminar producto", "error");
      }
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const prevItems = [...items]; // Snapshot
    const itemToUpdate = items.find(i => i.id === id);
    
    // Evitar llamadas innecesarias si la cantidad es 1 y se resta
    if (delta < 0 && itemToUpdate && itemToUpdate.cantidad <= 1) return;

    setItems((currentItems) => 
      currentItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.cantidad + delta);
          return { ...item, cantidad: newQuantity };
        }
        return item;
      })
    );

    if (status === "authenticated") {
      try {
        await updateQuantityAction(id, delta);
      } catch (error) {
        setItems(prevItems); // Rollback
        toast("Error al actualizar cantidad", "error");
      }
    }
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  
  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const count = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider value={{ 
      items, addToCart, removeFromCart, updateQuantity, clearCart, 
      metodoEntrega, total, count, isCartOpen, toggleCart 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CartContent>{children}</CartContent>
    </ToastProvider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};