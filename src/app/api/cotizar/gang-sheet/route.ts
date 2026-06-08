import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
  items: z.array(itemSchema).max(200).default([]),
  material: z.string().min(1),
  ancho_pliego_cm: z.number().positive().optional(),
});

/**
 * Precio EN VIVO del pliego (sin guardar). Mismo motor que usa el bot, así la
 * web y WhatsApp devuelven el mismo número para el mismo input.
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
      { error: "Datos invalidos: revisa material y medidas (w_cm, h_cm > 0)." },
      { status: 400 }
    );
  }

  try {
    const result = await calcularGangSheet(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Error cotizando gang sheet:", e);
    return NextResponse.json({ error: "Error al cotizar" }, { status: 500 });
  }
}
