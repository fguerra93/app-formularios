"use client";

import { createContext, useContext } from "react";

export interface WishlistState {
  items: string[];
  addItem: (productoId: string) => void;
  removeItem: (productoId: string) => void;
  toggleItem: (productoId: string) => void;
  isInWishlist: (productoId: string) => boolean;
  getItemCount: () => number;
  clearAll: () => void;
}

export const WishlistContext = createContext<WishlistState | null>(null);

export function useWishlist(): WishlistState {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

export const WISHLIST_STORAGE_KEY = "printup_wishlist";

export function loadWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(items: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}
