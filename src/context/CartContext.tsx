"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { 
  getCartAction, 
  syncCartAction, 
  addToCartAction, 
  removeFromCartAction, 
  updateQuantityAction 
} from "@/app/actions/cart";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  foto: string | null;
  cantidad: number;
  personalizacion?: any; 
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Omit<CartItem, "cantidad">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      if (status === "authenticated") {
        const localCart = JSON.parse(localStorage.getItem("flor-de-loto-cart") || "[]");
        if (localCart.length > 0) {
          const syncedItems = await syncCartAction(localCart);
          if (syncedItems) {
            setItems(syncedItems as CartItem[]);
            localStorage.removeItem("flor-de-loto-cart"); 
          }
        } else {
          const dbItems = await getCartAction();
          if (dbItems) setItems(dbItems as CartItem[]);
        }
      } else if (status === "unauthenticated") {
        const savedCart = localStorage.getItem("flor-de-loto-cart");
        if (savedCart) setItems(JSON.parse(savedCart));
      }
      setIsLoaded(true);
    };

    if (status !== "loading") {
      loadCart();
    }
  }, [status]);

  useEffect(() => {
    if (isLoaded && status === "unauthenticated") {
      localStorage.setItem("flor-de-loto-cart", JSON.stringify(items));
    }
  }, [items, isLoaded, status]);

  const addToCart = async (product: Omit<CartItem, "cantidad">) => {
    const cartItemId = product.personalizacion 
      ? `${product.id}-custom-${Date.now()}` 
      : product.id;

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === cartItemId);
      if (existingItem && !product.personalizacion) {
        return currentItems.map((item) =>
          item.id === cartItemId ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...currentItems, { ...product, id: cartItemId, cantidad: 1 }];
    });

    if (status === "authenticated") {
      await addToCartAction({ ...product, id: cartItemId, cantidad: 1 });
    }
  };

  const removeFromCart = async (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    if (status === "authenticated") {
      await removeFromCartAction(id);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
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
      await updateQuantityAction(id, delta);
    }
  };

  const clearCart = () => setItems([]);
  const toggleCart = () => setIsCartOpen(!isCartOpen);
  
  // Cálculos derivados del estado
  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  const count = items.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, count, isCartOpen, toggleCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de un CartProvider");
  return context;
};