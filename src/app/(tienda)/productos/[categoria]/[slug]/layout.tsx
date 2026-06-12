import type { Metadata } from "next";
import { productosRepo } from "@/server/repositories";
import { formatCLP } from "@/lib/format";

/**
 * Metadata de servidor para la ficha de producto (la página es client-side).
 * Open Graph con imagen + PRECIO EN EL TÍTULO: al compartir un producto por
 * WhatsApp se ve foto, nombre y precio — en Chile se vende por WhatsApp.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let producto = null;
  try {
    producto = await productosRepo.findActivoBySlug(slug);
  } catch {
    /* sin BD igual servimos la página */
  }
  if (!producto) {
    return { title: "Producto | PrintUp" };
  }

  const esM2 = !!(producto.precio_m2 && producto.precio_m2 > 0);
  const precioTexto = esM2
    ? `desde ${formatCLP(producto.precio_m2!)}/m²`
    : formatCLP(producto.precio_oferta && producto.precio_oferta > 0 ? producto.precio_oferta : producto.precio);

  const titulo = `${producto.nombre} — ${precioTexto} | PrintUp`;
  const descripcion =
    producto.descripcion_corta ||
    `${producto.nombre} impreso en Doñihue. ${precioTexto}, IVA incluido. Retiro gratis en el taller o despacho.`;
  const imagen = producto.imagenes?.[0]?.url;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      siteName: "PrintUp",
      locale: "es_CL",
      type: "website",
      ...(imagen ? { images: [{ url: imagen, alt: producto.nombre }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      ...(imagen ? { images: [imagen] } : {}),
    },
    other: {
      "product:price:amount": String(esM2 ? producto.precio_m2 : producto.precio),
      "product:price:currency": "CLP",
    },
  };
}

export default function ProductoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
