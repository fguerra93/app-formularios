"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Star, Loader2, MessageSquare, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReviewWithProduct {
  id: string;
  producto_id: string;
  rating: number;
  titulo: string | null;
  comentario: string | null;
  aprobada: boolean;
  created_at: string;
  productos: {
    nombre: string;
    slug: string;
    imagenes: { url: string; alt: string }[];
  } | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(aprobada: boolean) {
  if (aprobada) {
    return {
      label: "Aprobada",
      color: "text-green-700",
      bg: "bg-green-50 border-green-200",
    };
  }
  return {
    label: "Pendiente",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
  };
}

export default function MisReviewsPage() {
  const { user, cliente } = useAuth();
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/cliente/reviews", { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");
        setReviews((json.data as ReviewWithProduct[]) || []);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user, cliente]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 text-[#0f1115] animate-spin" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#fafafb] flex items-center justify-center">
          <MessageSquare className="size-10 text-[#00B4D8]/40" />
        </div>
        <h2 className="text-xl font-bold text-[#0f1115] mb-2">No tienes reviews aun</h2>
        <p className="text-sm text-[#5b6472] mb-6 max-w-md mx-auto">
          Despues de recibir tus pedidos, podras dejar reviews sobre los productos que compraste.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/productos" />}
          className="bg-[#0f1115] text-white hover:bg-[#000000]"
        >
          Explorar productos
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#0f1115]">
        Mis Reviews
        <span className="text-sm font-normal text-[#5b6472] ml-2">({reviews.length})</span>
      </h2>

      {reviews.map((review) => {
        const status = getStatusBadge(review.aprobada);
        const productImage = review.productos?.imagenes?.[0];

        return (
          <div
            key={review.id}
            className="bg-white rounded-xl border border-[#e8eaee] p-5"
          >
            <div className="flex gap-4">
              {/* Product image */}
              <div className="w-16 h-16 rounded-lg bg-[#fafafb] flex items-center justify-center shrink-0 overflow-hidden">
                {productImage?.url ? (
                  <img
                    src={productImage.url}
                    alt={productImage.alt || review.productos?.nombre || "Producto"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="size-8 text-[#00B4D8]/30" />
                )}
              </div>

              {/* Review content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    {review.productos ? (
                      <Link
                        href={`/productos/${review.productos.slug}`}
                        className="font-semibold text-sm text-[#0f1115] hover:text-[#0f1115] transition-colors"
                      >
                        {review.productos.nombre}
                      </Link>
                    ) : (
                      <span className="font-semibold text-sm text-[#0f1115]">
                        Producto eliminado
                      </span>
                    )}
                    <p className="text-xs text-[#5b6472] mt-0.5">{formatDate(review.created_at)}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < review.rating
                          ? "fill-[#FFD100] text-[#FFD100]"
                          : "fill-none text-[#e8eaee]"
                      }`}
                    />
                  ))}
                </div>

                {/* Title & comment */}
                {review.titulo && (
                  <p className="font-semibold text-sm text-[#0f1115] mt-2">
                    {review.titulo}
                  </p>
                )}
                {review.comentario && (
                  <p className="text-sm text-[#5b6472] mt-1 line-clamp-3">
                    {review.comentario}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
