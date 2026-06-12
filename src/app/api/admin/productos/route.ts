import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { productosRepo } from "@/server/repositories";

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const slug = body.slug || body.nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  try {
    const data = await productosRepo.create({
      nombre: body.nombre,
      slug,
      descripcion: body.descripcion || null,
      descripcion_corta: body.descripcion_corta || null,
      precio: body.precio,
      precio_oferta: body.precio_oferta || null,
      categoria_id: body.categoria_id || null,
      imagenes: body.imagenes || [],
      variantes: body.variantes || [],
      stock: body.stock || 0,
      stock_minimo: body.stock_minimo || 0,
      destacado: body.destacado || false,
      activo: body.activo !== undefined ? body.activo : true,
      tags: body.tags || [],
      peso_gramos: body.peso_gramos || null,
      sku: body.sku || null,
      precios_cantidad: body.precios_cantidad || [],
      ficha_tecnica_url: body.ficha_tecnica_url || null,
      precio_m2: body.precio_m2 || null,
      ancho_max_cm: body.ancho_max_cm || null,
      area_min_cm2: body.area_min_cm2 || null,
      materiales_calculadora: body.materiales_calculadora || [],
      acabados_calculadora: body.acabados_calculadora || [],
      incluye: body.incluye || [],
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating producto:", e);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
