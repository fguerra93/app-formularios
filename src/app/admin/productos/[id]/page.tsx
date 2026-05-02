"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { ProductForm } from "@/components/admin/product-form";
import type { Producto } from "@/lib/types";

function EditProductoContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/productos/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { setProducto(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="py-12 text-center">
        <p style={{ color: "#64748B" }}>Producto no encontrado</p>
        <Link href="/admin/productos">
          <Button variant="outline" className="mt-4">Volver a productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/productos" className="flex items-center gap-2 text-sm" style={{ color: "#64748B" }}>
        <ArrowLeft className="size-4" /> Volver a productos
      </Link>
      <ProductForm producto={producto} />
    </div>
  );
}

export default function EditProductoPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <EditProductoContent params={params} />
    </AuthGuard>
  );
}
