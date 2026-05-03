"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { WishlistContext, loadWishlist, saveWishlist } from "@/lib/wishlist";
import type { WishlistState } from "@/lib/wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(loadWishlist());
  }, []);

  useEffect(() => {
    saveWishlist(items);
  }, [items]);

  const addItem = useCallback((productoId: string) => {
    setItems((prev) => (prev.includes(productoId) ? prev : [...prev, productoId]));
  }, []);

  const removeItem = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((id) => id !== productoId));
  }, []);

  const toggleItem = useCallback((productoId: string) => {
    setItems((prev) =>
      prev.includes(productoId) ? prev.filter((id) => id !== productoId) : [...prev, productoId]
    );
  }, []);

  const isInWishlist = useCallback(
    (productoId: string) => items.includes(productoId),
    [items]
  );

  const getItemCount = useCallback(() => items.length, [items]);

  const clearAll = useCallback(() => setItems([]), []);

  const value: WishlistState = useMemo(
    () => ({ items, addItem, removeItem, toggleItem, isInWishlist, getItemCount, clearAll }),
    [items, addItem, removeItem, toggleItem, isInWishlist, getItemCount, clearAll]
  );

  return <WishlistContext value={value}>{children}</WishlistContext>;
}
