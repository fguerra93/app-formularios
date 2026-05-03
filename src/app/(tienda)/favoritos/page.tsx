"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/tienda/product-card";
import { Breadcrumb } from "@/components/tienda/breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Producto } from "@/lib/types";

export default function FavoritosPage() {
  const { items } = useWishlist();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProductos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/productos?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        const all: Producto[] = data.productos || [];
        const filtered = all.filter((p) => items.includes(p.id));
        setProductos(filtered);
      })
      .catch(() => setProductos([]))
      .finally(() => setLoading(false));
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Favoritos" }]} />

      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">
        Mis Favoritos
        {items.length > 0 && (
          <span className="text-base font-normal text-[#64748B] ml-2">
            ({items.length})
          </span>
        )}
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F0F7FF] flex items-center justify-center">
            <Heart className="size-10 text-[#E91E8C]/40" />
          </div>
          <h2 className="text-xl font-bold text-[#1E293B] mb-2">
            No tienes favoritos aun
          </h2>
          <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
            Explora nuestro catalogo y marca con un corazon los productos que mas te gusten para encontrarlos facilmente.
          </p>
          <Button nativeButton={false} render={<Link href="/productos" />} className="bg-[#1B2A6B] text-white hover:bg-[#152259]">
            Explorar productos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((prod) => (
            <ProductCard key={prod.id} producto={prod} />
          ))}
        </div>
      )}
    </div>
  );
}
