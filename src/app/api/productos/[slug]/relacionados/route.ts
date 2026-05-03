import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getSupabase();

  // Buscar producto actual por slug
  const { data: producto, error: prodError } = await supabase
    .from("productos")
    .select("id, categoria_id, tags")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (prodError || !producto) {
    return NextResponse.json(
      { error: "Producto no encontrado" },
      { status: 404 }
    );
  }

  const relacionados: Record<string, unknown>[] = [];
  const idsUsados = new Set<string>([producto.id]);

  // Buscar productos de la misma categoria (excluir el actual)
  if (producto.categoria_id) {
    const { data: mismaCategoria } = await supabase
      .from("productos")
      .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
      .eq("activo", true)
      .eq("categoria_id", producto.categoria_id)
      .neq("id", producto.id)
      .order("destacado", { ascending: false })
      .limit(4);

    if (mismaCategoria) {
      for (const p of mismaCategoria) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }
  }

  // Si tiene tags y aun no hay suficientes, buscar por tags en comun
  if (
    relacionados.length < 4 &&
    producto.tags &&
    Array.isArray(producto.tags) &&
    producto.tags.length > 0
  ) {
    const { data: porTags } = await supabase
      .from("productos")
      .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
      .eq("activo", true)
      .neq("id", producto.id)
      .overlaps("tags", producto.tags)
      .order("destacado", { ascending: false })
      .limit(4);

    if (porTags) {
      for (const p of porTags) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }
  }

  // Si aun no hay suficientes, completar con productos destacados
  if (relacionados.length < 4) {
    const faltan = 4 - relacionados.length;
    const idsExcluir = Array.from(idsUsados);

    const { data: destacados } = await supabase
      .from("productos")
      .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
      .eq("activo", true)
      .eq("destacado", true)
      .not("id", "in", `(${idsExcluir.join(",")})`)
      .limit(faltan);

    if (destacados) {
      for (const p of destacados) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }
  }

  // Si TODAVIA faltan, agregar cualquier producto activo
  if (relacionados.length < 4) {
    const faltan = 4 - relacionados.length;
    const idsExcluir = Array.from(idsUsados);

    const { data: otros } = await supabase
      .from("productos")
      .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
      .eq("activo", true)
      .not("id", "in", `(${idsExcluir.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(faltan);

    if (otros) {
      for (const p of otros) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }
  }

  return NextResponse.json(relacionados);
}
