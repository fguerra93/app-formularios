import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { carritosRepo } from "@/server/repositories";

const bodySchema = z.object({
  email: z.string().email(),
  telefono: z.string().nullable().optional(),
  items: z.array(z.record(z.string(), z.unknown())).min(1),
  total: z.number().nonnegative(),
  cliente_id: z.string().nullable().optional(),
});

/**
 * Captura temprana del carrito en el checkout (apenas el cliente escribe su
 * email). Es la materia prima del recordatorio de carrito abandonado.
 * Best-effort total: nunca interrumpe el checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const { email, telefono, items, total, cliente_id } = parsed.data;
    await carritosRepo.capturarAbandonado({
      email: email.toLowerCase().trim(),
      telefono: telefono || null,
      items,
      total: Math.round(total),
      cliente_id: cliente_id || null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Sin tabla/columnas (migración pendiente) simplemente no se captura.
    console.error("capturar carrito (no fatal):", e);
    return NextResponse.json({ ok: false });
  }
}
