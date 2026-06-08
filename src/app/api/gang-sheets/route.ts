import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gangSheetsRepo } from "@/server/repositories";
import { calcularGangSheet } from "@/server/domain/gang-sheet";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  arte_url: z.string().optional(),
  w_cm: z.number().positive(),
  h_cm: z.number().positive(),
  rot: z.number().optional(),
  cantidad: z.number().int().positive().optional(),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1).max(200),
  material: z.string().min(1),
  ancho_pliego_cm: z.number().positive().optional(),
  nombre: z.string().optional(),
  cliente_id: z.string().nullable().optional(),
});

/**
 * Guarda un pliego. El precio y el acomodo se RECALCULAN en el servidor (nunca
 * se confía en el navegador). Devuelve la fila para enlazarla al carrito.
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos: revisa material y medidas." },
      { status: 400 }
    );
  }

  const { items, material, ancho_pliego_cm, nombre, cliente_id } = parsed.data;

  try {
    const calc = await calcularGangSheet({ items, material, ancho_pliego_cm });

    const row = await gangSheetsRepo.create({
      cliente_id: cliente_id || null,
      nombre: nombre || `Pliego ${material}`,
      material: calc.material,
      ancho_pliego_cm: calc.ancho_pliego_cm,
      alto_pliego_cm: calc.alto_pliego_cm,
      items: calc.items,
      area_usada_cm2: calc.area_usada_cm2,
      area_pliego_cm2: calc.area_pliego_cm2,
      merma_cm2: calc.merma_cm2,
      precio: calc.precio,
      desglose: calc.desglose,
      estado: "borrador",
    });

    if (!row) {
      return NextResponse.json({ error: "Error al guardar el pliego" }, { status: 500 });
    }
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Error creando gang sheet:", e);
    return NextResponse.json({ error: "Error al guardar el pliego" }, { status: 500 });
  }
}
