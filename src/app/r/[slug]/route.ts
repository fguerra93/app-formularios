import { NextRequest, NextResponse } from "next/server";
import { productosRepo } from "@/server/repositories";

/**
 * Link corto a la ficha de un producto: /r/<slug> → /productos/<categoria>/<slug>.
 * Lo usan los emails (el item del pedido guarda solo el slug).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const origin = request.nextUrl.origin;

  const producto = await productosRepo.findActivoBySlug(slug);
  const categoriaSlug = (producto?.categoria as { slug?: string } | null)?.slug;

  if (!producto || !categoriaSlug) {
    return NextResponse.redirect(`${origin}/productos`, 302);
  }
  const hash = request.nextUrl.hash || "";
  return NextResponse.redirect(`${origin}/productos/${categoriaSlug}/${producto.slug}${hash}`, 302);
}
