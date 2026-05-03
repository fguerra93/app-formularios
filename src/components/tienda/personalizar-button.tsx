"use client";

import Link from "next/link";
import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersonalizarButtonProps {
  categoriaSlug: string;
  productoSlug: string;
}

export function PersonalizarButton({ categoriaSlug, productoSlug }: PersonalizarButtonProps) {
  return (
    <Button
      variant="outline"
      className="gap-2 border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8]/10"
      nativeButton={false}
      render={<Link href={`/productos/${categoriaSlug}/${productoSlug}/personalizar`} />}
    >
      <Palette className="size-5" />
      Personalizar
    </Button>
  );
}
