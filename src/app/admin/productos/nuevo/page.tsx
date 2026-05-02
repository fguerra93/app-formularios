"use client";

import { AuthGuard } from "@/components/admin/auth-guard";
import { ProductForm } from "@/components/admin/product-form";

export default function NuevoProductoPage() {
  return (
    <AuthGuard>
      <ProductForm isNew />
    </AuthGuard>
  );
}
