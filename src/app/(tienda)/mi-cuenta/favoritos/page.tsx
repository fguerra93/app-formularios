"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getSupabaseBrowser } from "@/lib/auth-client";
import { useCart } from "@/lib/cart";
import { formatCLP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, ShoppingCart, Trash2, Package } from "lucide-react";
import Link from "next/link";
import type { Producto } from "@/lib/types";

interface FavoritoRow {
  id: string;
  producto_id: string;
  productos: Producto;
}

export default function MisFavoritosPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [favoritos, setFavoritos] = useState<FavoritoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchFavoritos = async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase
          .from("favoritos")
          .select("*, productos(*)")
          .eq("cliente_id", user.id);

        if (error) throw error;
        setFavoritos((data as FavoritoRow[]) || []);
      } catch (err) {
        console.error("Error fetching favoritos:", err);
        setFavoritos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritos();
  }, [user]);

  const handleRemove = async (favoritoId: string) => {
    setRemovingId(favoritoId);
    try {
      const supabase = getSupabaseBrowser();
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("id", favoritoId);

      if (error) throw error;
      setFavoritos((prev) => prev.filter((f) => f.id !== favoritoId));
    } catch (err) {
      console.error("Error removing favorito:", err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (producto: Producto) => {
    const hasOffer = producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
    const displayPrice = hasOffer ? producto.precio_oferta! : producto.precio;
    const mainImage = producto.imagenes?.[0];

    addItem({
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: displayPrice,
      imagen: mainImage?.url || "",
      slug: producto.slug,
      categoria_slug: "",
      variante: null,
      precio_extra: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-[#1B2A6B] animate-spin" />
      </div>
    );
  }

  if (favoritos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#F0F7FF] flex items-center justify-center">
          <Heart className="size-10 text-[#E91E8C]/40" />
        </div>
        <h2 className="text-xl font-bold text-[#1E293B] mb-2">No tienes favoritos guardados</h2>
        <p className="text-sm text-[#64748B] mb-6 max-w-md mx-auto">
          Explora nuestro catalogo y guarda los productos que te interesen para encontrarlos facilmente.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/productos" />}
          className="bg-[#1B2A6B] text-white hover:bg-[#152259]"
        >
          Explorar productos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#1E293B]">
        Mis Favoritos
        <span className="text-sm font-normal text-[#64748B] ml-2">({favoritos.length})</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {favoritos.map((fav) => {
          const producto = fav.productos;
          if (!producto) return null;

          const hasOffer =
            producto.precio_oferta !== null && producto.precio_oferta < producto.precio;
          const displayPrice = hasOffer ? producto.precio_oferta! : producto.precio;
          const mainImage = producto.imagenes?.[0];

          return (
            <div
              key={fav.id}
              className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden group"
            >
              {/* Image */}
              <div className="relative aspect-square bg-[#F0F7FF] overflow-hidden">
                {mainImage?.url ? (
                  <img
                    src={mainImage.url}
                    alt={mainImage.alt || producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="size-16 text-[#00B4D8]/30" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(fav.id)}
                  disabled={removingId === fav.id}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-red-50 transition-colors"
                  aria-label="Quitar de favoritos"
                >
                  {removingId === fav.id ? (
                    <Loader2 className="size-4 text-gray-400 animate-spin" />
                  ) : (
                    <Trash2 className="size-4 text-red-500" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <Link
                  href={`/productos/${producto.slug}`}
                  className="font-semibold text-sm text-[#1E293B] hover:text-[#1B2A6B] transition-colors line-clamp-2"
                >
                  {producto.nombre}
                </Link>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-[#1B2A6B]">
                    {formatCLP(displayPrice)}
                  </span>
                  {hasOffer && (
                    <span className="text-sm text-[#64748B] line-through">
                      {formatCLP(producto.precio)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleAddToCart(producto)}
                  disabled={producto.stock === 0}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 bg-[#1B2A6B] text-white hover:bg-[#152259] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="size-4" />
                  {producto.stock === 0 ? "Agotado" : "Agregar al carrito"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
