import { NextRequest, NextResponse } from "next/server";
import { productosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * Feed RSS 2.0 para Google Merchant Center (aparecer gratis en la pestaña
 * Shopping). Registrar en Merchant Center como "feed programado" apuntando a:
 *   https://printup.cl/api/feed/google-merchant
 */
function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function limpiarHtml(s: unknown): string {
  return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4900);
}

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  let productos: Record<string, unknown>[] = [];
  try {
    productos = await productosRepo.listParaFeed();
  } catch (e) {
    console.error("feed merchant:", e);
  }

  const items = productos
    .map((p) => {
      const categoria = p.categoria as { slug?: string; nombre?: string } | null;
      if (!categoria?.slug || !p.slug) return "";

      const imagenes = Array.isArray(p.imagenes) ? (p.imagenes as { url?: string }[]) : [];
      const imagen = imagenes.find((i) => i.url)?.url;
      if (!imagen) return ""; // Merchant exige imagen

      const esM2 = typeof p.precio_m2 === "number" && (p.precio_m2 as number) > 0;
      const oferta = typeof p.precio_oferta === "number" && (p.precio_oferta as number) > 0;
      const precio = esM2
        ? (p.precio as number) // estructura base del producto m²
        : oferta
          ? (p.precio_oferta as number)
          : (p.precio as number);
      if (!precio || precio <= 0) return "";

      const stock = typeof p.stock === "number" ? (p.stock as number) : 0;
      const descripcion = limpiarHtml(p.descripcion_corta || p.descripcion || p.nombre);

      return `  <item>
    <g:id>${esc(p.sku || p.id)}</g:id>
    <g:title>${esc(p.nombre)}</g:title>
    <g:description>${esc(descripcion)}</g:description>
    <g:link>${esc(`${base}/productos/${categoria.slug}/${p.slug}`)}</g:link>
    <g:image_link>${esc(imagen)}</g:image_link>
    <g:availability>${stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
    <g:price>${precio} CLP</g:price>
    <g:condition>new</g:condition>
    <g:brand>PrintUp</g:brand>
    <g:identifier_exists>false</g:identifier_exists>
    <g:google_product_category>Business &amp; Industrial &gt; Advertising &amp; Marketing</g:google_product_category>
    <g:product_type>${esc(categoria.nombre || "")}</g:product_type>
  </item>`;
    })
    .filter(Boolean)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>PrintUp — Catálogo</title>
  <link>${esc(base)}</link>
  <description>Imprenta en Doñihue: pendones, DTF textil, poleras y artículos publicitarios.</description>
${items}
</channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
}
