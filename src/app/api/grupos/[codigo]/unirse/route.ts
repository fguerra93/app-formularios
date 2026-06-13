import { NextRequest, NextResponse } from "next/server";
import { publicOrigin } from "@/lib/url";
import { z } from "zod";
import { gruposRepo, pedidosRepo, pagosRepo, domainEventsRepo } from "@/server/repositories";
import { calcularPedido } from "@/lib/checkout";
import { getWebpayTransaction } from "@/server/services/webpay";

const bodySchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  telefono: z.string().nullable().optional(),
  talla: z.string().max(20).nullable().optional(),
  nombre_estampado: z.string().max(40).nullable().optional(),
});

/**
 * Un apoderado se une al grupo: se crea SU pedido individual (1 unidad,
 * retiro en tienda, vinculado al grupo) y se inicia el pago Webpay.
 * Devuelve { url, token } para redirigir a Transbank.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> },
) {
  const { codigo } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos incompletos o inválidos" }, { status: 400 });
  }

  const grupo = await gruposRepo.findByCodigo(codigo).catch(() => null);
  if (!grupo) {
    return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 });
  }
  if (grupo.estado !== "abierto") {
    return NextResponse.json({ error: "Este grupo ya está cerrado" }, { status: 409 });
  }
  if (grupo.fecha_limite && new Date(grupo.fecha_limite + "T23:59:59") < new Date()) {
    return NextResponse.json(
      { error: "El plazo de este grupo ya venció. Habla con el organizador." },
      { status: 409 },
    );
  }

  const { nombre, email, telefono, talla, nombre_estampado } = parsed.data;
  const variante: Record<string, string> = {
    ...(talla ? { Talla: talla } : {}),
    ...(nombre_estampado ? { "Nombre estampado": nombre_estampado } : {}),
    Grupo: grupo.nombre,
  };

  // Precio real desde la BD (incluye extra de talla si corresponde).
  const calculo = await calcularPedido({
    items: [{ producto_id: grupo.producto_id, cantidad: 1, variante }],
    tipo_entrega: "retiro_tienda",
    comuna: null,
  });
  if (calculo.errores.length > 0 || calculo.items.length === 0) {
    return NextResponse.json(
      { error: calculo.errores.join(" ") || "Producto no disponible" },
      { status: 400 },
    );
  }

  let pedido;
  try {
    pedido = await pedidosRepo.create({
      cliente_nombre: nombre,
      cliente_email: email,
      cliente_telefono: telefono || null,
      cliente_rut: null,
      direccion_envio: null,
      tipo_entrega: "retiro_tienda",
      items: calculo.items,
      subtotal: calculo.subtotal,
      costo_envio: 0,
      total: calculo.total,
      pago_metodo: "webpay",
      notas: `Pedido grupal ${grupo.codigo} — ${grupo.nombre}`,
      cliente_id: null,
      grupo_id: grupo.id,
    } as Parameters<typeof pedidosRepo.create>[0] & { grupo_id: string });
  } catch (e) {
    console.error("crear pedido grupal:", e);
    return NextResponse.json({ error: "Error al crear tu pedido" }, { status: 500 });
  }

  try {
    await domainEventsRepo.emit("grupo.aporte", {
      grupo_id: grupo.id,
      codigo: grupo.codigo,
      pedido_id: pedido.id,
    });
  } catch { /* best-effort */ }

  // Pago Webpay de SU parte (el retorno estándar confirma el pedido).
  try {
    const origin = publicOrigin(request);
    const tx = await getWebpayTransaction();
    const resp = await tx.create(
      `PU-${pedido.numero_pedido}`,
      String(pedido.id).slice(0, 61),
      pedido.total,
      `${origin}/api/pagos/webpay/retorno?pedido=${encodeURIComponent(pedido.id)}`,
    );
    await pagosRepo.logWebhook({
      tipo: "webpay.create",
      payload: { pedido_id: pedido.id, grupo: grupo.codigo, token: resp.token, monto: pedido.total },
    }).catch(() => {});
    return NextResponse.json({ url: resp.url, token: resp.token, pedido_id: pedido.id });
  } catch (e) {
    console.error("webpay grupal:", e);
    return NextResponse.json(
      { error: "No pudimos iniciar el pago. Intenta de nuevo.", pedido_id: pedido.id },
      { status: 502 },
    );
  }
}
