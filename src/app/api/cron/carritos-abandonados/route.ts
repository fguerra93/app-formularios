import { NextRequest, NextResponse } from "next/server";
import { carritosRepo } from "@/server/repositories";
import { emailCarritoAbandonado } from "@/server/services/emails";

export const dynamic = "force-dynamic";

/**
 * Cron de carrito abandonado (Cloud Scheduler, p. ej. cada hora):
 *   POST/GET /api/cron/carritos-abandonados
 *   Header: Authorization: Bearer $CRON_SECRET  (o x-cron-secret)
 *
 * Antes este endpoint solo marcaba los carritos; ahora ENVÍA el recordatorio
 * real con link de recuperación (/carrito/recuperar/<token>) a los carritos
 * con email capturado, abandonados hace entre 3 y 72 horas. Un solo
 * recordatorio por carrito (email_enviado).
 */
async function procesar(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const auth = request.headers.get("authorization") || "";
  const alt = request.headers.get("x-cron-secret") || "";

  if (cronSecret) {
    if (auth !== `Bearer ${cronSecret}` && alt !== cronSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron no configurado" }, { status: 503 });
  }

  const ahora = Date.now();
  const antesDe = new Date(ahora - 3 * 60 * 60 * 1000).toISOString(); // > 3 h sin moverse
  const despuesDe = new Date(ahora - 72 * 60 * 60 * 1000).toISOString(); // < 72 h (no revivir fósiles)

  let candidatos: Awaited<ReturnType<typeof carritosRepo.findParaRecordatorio>>;
  try {
    candidatos = await carritosRepo.findParaRecordatorio({
      antesDeISO: antesDe,
      despuesDeISO: despuesDe,
    });
  } catch (e) {
    console.error("cron carritos: tabla/columnas no disponibles:", e);
    return NextResponse.json(
      { ok: false, error: "carritos_guardados sin migración etapa 3" },
      { status: 500 },
    );
  }

  if (candidatos.length === 0) {
    return NextResponse.json({ ok: true, candidatos: 0, enviados: 0 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const enviados: string[] = [];
  let fallidos = 0;

  for (const c of candidatos) {
    if (!c.email || !c.token) continue;
    const items = Array.isArray(c.items)
      ? (c.items as { nombre?: string; cantidad?: number }[])
      : [];
    if (items.length === 0) continue;
    try {
      const ok = await emailCarritoAbandonado({
        email: c.email,
        items,
        total: Number(c.total) || 0,
        linkRecuperacion: `${origin}/carrito/recuperar/${c.token}`,
      });
      if (ok) enviados.push(c.id);
      else fallidos++;
    } catch (e) {
      console.error("cron carritos: email fallido", c.id, e);
      fallidos++;
    }
  }

  if (enviados.length > 0) {
    try {
      await carritosRepo.markEmailEnviado(enviados);
    } catch (e) {
      console.error("cron carritos: markEmailEnviado:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    candidatos: candidatos.length,
    enviados: enviados.length,
    fallidos,
  });
}

export async function POST(request: NextRequest) {
  return procesar(request);
}

export async function GET(request: NextRequest) {
  return procesar(request);
}
