import type { MetadataRoute } from "next";
import { getSupabase } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://printup.cl";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabase();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/productos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/nosotros`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];

  // Categories
  const { data: categorias } = await supabase
    .from("categorias")
    .select("slug, created_at")
    .eq("activa", true);

  const categoryPages: MetadataRoute.Sitemap = (categorias || []).map((cat) => ({
    url: `${BASE_URL}/productos/${cat.slug}`,
    lastModified: new Date(cat.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Products
  const { data: productos } = await supabase
    .from("productos")
    .select("slug, updated_at, categoria:categorias(slug)")
    .eq("activo", true);

  const productPages: MetadataRoute.Sitemap = (productos || []).map((prod) => {
    const cat = prod.categoria as unknown as { slug: string } | null;
    const catSlug = cat?.slug || "sin-categoria";
    return {
      url: `${BASE_URL}/productos/${catSlug}/${prod.slug}`,
      lastModified: new Date(prod.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
  });

  return [...staticPages, ...categoryPages, ...productPages];
}
