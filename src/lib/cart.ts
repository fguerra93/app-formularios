"use client";

import { createContext, useContext } from "react";
import type { ItemCarrito } from "./types";

export interface CartState {
  items: ItemCarrito[];
  addItem: (item: Omit<ItemCarrito, "cantidad"> & { cantidad?: number }) => void;
  removeItem: (productoId: string, variante?: Record<string, string> | null) => void;
  updateQuantity: (productoId: string, cantidad: number, variante?: Record<string, string> | null) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

function itemKey(productoId: string, variante?: Record<string, string> | null): string {
  if (!variante || Object.keys(variante).length === 0) return productoId;
  const sorted = Object.entries(variante).sort(([a], [b]) => a.localeCompare(b));
  return `${productoId}__${sorted.map(([k, v]) => `${k}:${v}`).join("_")}`;
}

export function getItemKey(item: ItemCarrito): string {
  return itemKey(item.producto_id, item.variante);
}

export const CART_STORAGE_KEY = "printup_cart";

export function loadCart(): ItemCarrito[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: ItemCarrito[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export { itemKey };
