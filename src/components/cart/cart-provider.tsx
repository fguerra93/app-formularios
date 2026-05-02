"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { CartContext, loadCart, saveCart, getItemKey } from "@/lib/cart";
import type { ItemCarrito } from "@/lib/types";
import { toast } from "sonner";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCart(items);
  }, [items, loaded]);

  const addItem = useCallback(
    (newItem: Omit<ItemCarrito, "cantidad"> & { cantidad?: number }) => {
      const cantidad = newItem.cantidad ?? 1;
      setItems((prev) => {
        const key = getItemKey({ ...newItem, cantidad } as ItemCarrito);
        const existing = prev.find((i) => getItemKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            getItemKey(i) === key
              ? { ...i, cantidad: i.cantidad + cantidad }
              : i
          );
        }
        return [...prev, { ...newItem, cantidad } as ItemCarrito];
      });
      toast.success(`${newItem.nombre} agregado al carrito`);
    },
    []
  );

  const removeItem = useCallback(
    (productoId: string, variante?: Record<string, string> | null) => {
      setItems((prev) => {
        const key = getItemKey({
          producto_id: productoId,
          variante: variante ?? null,
        } as ItemCarrito);
        return prev.filter((i) => getItemKey(i) !== key);
      });
    },
    []
  );

  const updateQuantity = useCallback(
    (productoId: string, cantidad: number, variante?: Record<string, string> | null) => {
      if (cantidad <= 0) {
        removeItem(productoId, variante);
        return;
      }
      setItems((prev) => {
        const key = getItemKey({
          producto_id: productoId,
          variante: variante ?? null,
        } as ItemCarrito);
        return prev.map((i) =>
          getItemKey(i) === key ? { ...i, cantidad } : i
        );
      });
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce(
      (sum, i) => sum + (i.precio + i.precio_extra) * i.cantidad,
      0
    );
  }, [items]);

  const getTotal = useCallback(() => {
    return getSubtotal();
  }, [getSubtotal]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.cantidad, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getSubtotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
