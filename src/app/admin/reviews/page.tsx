"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, Check, X, Trash2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { toast } from "sonner";

interface Review {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  autor_nombre: string;
  autor_email?: string;
  rating: number;
  titulo?: string;
  comentario: string;
  verificada: boolean;
  aprobada: boolean | null;
  fotos?: string[];
  created_at: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-4 ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-gray-300"
          }`}
        />
      ))}
    </span>
  );
}

type FilterTab = "pendientes" | "aprobadas" | "rechazadas" | "todas";

function ReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("pendientes");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "todas") {
        params.set("estado", activeTab);
      }
      const res = await fetch(`/api/admin/reviews?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Error al cargar reviews");
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobada: true }),
      });
      if (res.ok) {
        toast.success("Review aprobada");
        fetchReviews();
      } else {
        toast.error("Error al aprobar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aprobada: false }),
      });
      if (res.ok) {
        toast.success("Review rechazada");
        fetchReviews();
      } else {
        toast.error("Error al rechazar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta review permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Review eliminada");
        fetchReviews();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pendientes", label: "Pendientes" },
    { key: "aprobadas", label: "Aprobadas" },
    { key: "rechazadas", label: "Rechazadas" },
    { key: "todas", label: "Todas" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>
          Reviews
        </h1>
        <p className="text-sm" style={{ color: "#64748B" }}>
          Modera las opiniones de los clientes
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            style={
              activeTab === tab.key
                ? { backgroundColor: "#1B2A6B", color: "#FFFFFF" }
                : undefined
            }
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center gap-2"
            style={{ color: "#1E293B" }}
          >
            <Star className="size-5" />
            Opiniones de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p
              className="py-8 text-center text-sm"
              style={{ color: "#64748B" }}
            >
              No hay reviews {activeTab !== "todas" ? activeTab : ""} por mostrar.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => {
                const isExpanded = expandedId === review.id;
                const comentarioCorto =
                  review.comentario.length > 100
                    ? review.comentario.slice(0, 100) + "..."
                    : review.comentario;

                return (
                  <div
                    key={review.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Row */}
                    <div
                      className="flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : review.id)
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className="font-medium text-sm"
                            style={{ color: "#1E293B" }}
                          >
                            {review.producto_nombre || "Producto"}
                          </span>
                          <span className="text-xs" style={{ color: "#64748B" }}>
                            por {review.autor_nombre}
                          </span>
                          {review.verificada && (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-[#00B4D8]/10 text-[#00B4D8]">
                              <ShieldCheck className="size-3" />
                              Compra verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating rating={review.rating} />
                          {review.titulo && (
                            <span
                              className="font-semibold text-sm"
                              style={{ color: "#1E293B" }}
                            >
                              {review.titulo}
                            </span>
                          )}
                        </div>
                        <p
                          className="text-sm"
                          style={{ color: "#64748B" }}
                        >
                          {isExpanded ? review.comentario : comentarioCorto}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "#64748B" }}
                        >
                          {new Date(review.created_at).toLocaleDateString(
                            "es-CL",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="size-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t">
                        {review.fotos && review.fotos.length > 0 && (
                          <div className="flex gap-2 mb-3 flex-wrap">
                            {review.fotos.map((foto, i) => (
                              <img
                                key={i}
                                src={foto}
                                alt={`Foto ${i + 1}`}
                                className="size-20 rounded-lg object-cover border border-gray-200"
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {review.aprobada !== true && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(review.id);
                              }}
                              className="gap-1 bg-green-600 text-white hover:bg-green-700"
                            >
                              <Check className="size-3" />
                              Aprobar
                            </Button>
                          )}
                          {review.aprobada !== false && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(review.id);
                              }}
                              className="gap-1"
                            >
                              <X className="size-3" />
                              Rechazar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(review.id);
                            }}
                            className="gap-1 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="size-3" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <AuthGuard>
      <ReviewsContent />
    </AuthGuard>
  );
}
