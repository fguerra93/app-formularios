import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/url";
import { z } from "zod";
import { gruposRepo, productosRepo } from "@/server/repositories";

const bodySchema = z.object({
  producto_slug: z.string().min(1),
  nombre: z.string().min(3).max(120),
  organizador_nombre: z.string().min(2).max(120),
  organizador_email: z.string().email(),
  organizador_telefono: z.string().nullable().optional(),
  meta_unidades: z.number().int().min(2).max(500),
  fecha_limite: z.string().nullable().optional(), // YYYY-MM-DD
  notas: z.string().max(500).nullable().optional(),
});

/** Crea un pedido grupal de generación y devuelve el link compartible. */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos incompletos o inválidos" }, { status: 400 });
  }

  const producto = await productosRepo.findActivoBySlug(parsed.data.producto_slug);
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const precioRef =
    producto.precio_oferta && producto.precio_oferta > 0 ? producto.precio_oferta : producto.precio;

  try {
    const grupo = await gruposRepo.crear({
      nombre: parsed.data.nombre,
      producto_id: producto.id,
      organizador_nombre: parsed.data.organizador_nombre,
      organizador_email: parsed.data.organizador_email,
      organizador_telefono: parsed.data.organizador_telefono || null,
      precio_referencia: precioRef,
      meta_unidades: parsed.data.meta_unidades,
      fecha_limite: parsed.data.fecha_limite || null,
      notas: parsed.data.notas || null,
    });
    const origin = publicOrigin(request);
    return NextResponse.json(
      { codigo: grupo.codigo, link: `${origin}/grupal/${grupo.codigo}` },
      { status: 201 },
    );
  } catch (e) {
    console.error("crear grupo:", e);
    return NextResponse.json(
      { error: "No pudimos crear el grupo (¿migración etapa 4 pendiente?)" },
      { status: 500 },
    );
  }
}
