import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  pedidosRepo,
  domainEventsRepo,
  stockRepo,
  aprobacionesRepo,
  carritosRepo,
} from "@/server/repositories";
import type { Pedido } from "@/server/domain";
import { calcularPedido } from "@/lib/checkout";
import { emailPedidoCreado } from "@/server/services/emails";

const itemSchema = z.object({
  producto_id: z.string().min(1),
  nombre: z.string().optional(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().nonnegative().optional(),
  variante: z.record(z.string(), z.string()).nullable().optional(),
});

const bodySchema = z.object({
  cliente_nombre: z.string().min(1),
  cliente_email: z.string().email(),
  cliente_telefono: z.string().nullable().optional(),
  cliente_rut: z.string().nullable().optional(),
  direccion_envio: z.record(z.string(), z.unknown()).nullable().optional(),
  tipo_entrega: z.enum(["retiro_tienda", "despacho"]).default("retiro_tienda"),
  items: z.array(itemSchema).min(1),
  pago_metodo: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
  cliente_id: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos incompletos o invalidos. Revisa nombre, email e items." },
        { status: 400 }
      );
    }

    const {
      cliente_nombre,
      cliente_email,
      cliente_telefono,
      cliente_rut,
      direccion_envio,
      tipo_entrega,
      items,
      pago_metodo,
      notas,
      cliente_id,
    } = parsed.data;

    // Recalcular precios, stock y envio en el SERVIDOR. Nunca se confia
    // en subtotal/total/precio del navegador.
    const comuna = (direccion_envio as { comuna?: string } | null)?.comuna ?? null;
    const calculo = await calcularPedido({ items, tipo_entrega, comuna, cliente_id });

    if (calculo.faltantes.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos productos no tienen stock suficiente.",
          faltantes: calculo.faltantes,
        },
        { status: 409 }
      );
    }

    if (calculo.errores.length > 0) {
      return NextResponse.json(
        { error: calculo.errores.join(" ") },
        { status: 400 }
      );
    }

    const { items: itemsServidor, subtotal, costo_envio, total } = calculo;

    let pedido: Pedido;
    try {
      pedido = await pedidosRepo.create({
        cliente_nombre,
        cliente_email,
        cliente_telefono: cliente_telefono || null,
        cliente_rut: cliente_rut || null,
        direccion_envio: direccion_envio || null,
        tipo_entrega: tipo_entrega || "retiro_tienda",
        items: itemsServidor,
        subtotal,
        costo_envio,
        total,
        pago_metodo: pago_metodo || "transferencia",
        notas: notas || null,
        cliente_id: cliente_id || null,
      });
    } catch (e) {
      console.error("Error creating pedido:", e);
      return NextResponse.json(
        { error: "Error al crear el pedido" },
        { status: 500 }
      );
    }

    // Reserva de stock (Patrón 9) — best-effort: no rompe si la migración no
    // está aplicada. Solo mueve stock de productos con controla_stock = true.
    try {
      const itemsReserva = itemsServidor.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
      }));
      const reserva = await stockRepo.reservar(itemsReserva, pedido.id);
      if (!reserva.ok) {
        console.warn("Reserva con faltantes para pedido", pedido.id, reserva.faltantes);
      }
    } catch (e) {
      console.error("reservar_stock no disponible (no fatal):", e);
    }

    // Evento de dominio (Patrón 2): pedido creado.
    await domainEventsRepo.emit("pedido.creado", {
      pedido_id: pedido.id,
      numero_pedido: pedido.numero_pedido,
      cliente_nombre,
      total,
    });

    // Cola de aprobación (Patrón 3): los pagos por transferencia los valida el
    // dueño a mano -> se crea una aprobación pendiente (no se cobra solo).
    const metodo = pago_metodo || "transferencia";
    if (metodo !== "mercadopago") {
      await aprobacionesRepo.crear({
        tipo: "validar_pago",
        titulo: `Validar pago pedido #${pedido.numero_pedido}`,
        descripcion: `${cliente_nombre} — $${total.toLocaleString("es-CL")} (${metodo})`,
        payload: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido },
        creada_por: "sistema",
      });
    }

    // El cliente concretó: su carrito capturado deja de ser "abandonado"
    // (evita mandarle un recordatorio de algo que ya compró).
    try {
      await carritosRepo.markRecuperadoPorEmail(cliente_email.toLowerCase().trim());
    } catch {
      /* best-effort: sin migración no hay captura que cerrar */
    }

    // Emails de confirmación (cliente + aviso al taller) — servicio único
    try {
      await emailPedidoCreado(pedido);
    } catch (e) {
      console.error("Error enviando emails de pedido (no fatal):", e);
    }

    return NextResponse.json({ success: true, pedido });
  } catch (err) {
    console.error("Pedido error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
