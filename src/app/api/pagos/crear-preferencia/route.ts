import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { pedido_id } = await request.json();
    if (!pedido_id) {
      return NextResponse.json({ error: "pedido_id requerido" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get MercadoPago credentials from config or env
    let accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    try {
      const { data: config } = await supabase
        .from("configuracion")
        .select("*")
        .eq("clave", "mercadopago_access_token")
        .single();
      if (config?.valor) accessToken = config.valor;
    } catch {}

    if (!accessToken) {
      return NextResponse.json({ error: "MercadoPago no configurado" }, { status: 400 });
    }

    // Fetch order
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Create MercadoPago preference
    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const items = (pedido.items as { nombre: string; cantidad: number; precio_unitario: number; producto_id?: string }[]).map((item, i) => ({
      id: item.producto_id || String(i + 1),
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio_unitario,
      currency_id: "CLP" as const,
    }));

    // Add shipping cost as item if applicable
    if (pedido.costo_envio > 0) {
      items.push({
        id: "envio",
        title: "Costo de envio",
        quantity: 1,
        unit_price: pedido.costo_envio,
        currency_id: "CLP" as const,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const result = await preference.create({
      body: {
        items,
        payer: {
          name: pedido.cliente_nombre,
          email: pedido.cliente_email,
        },
        back_urls: {
          success: `${appUrl}/checkout/confirmacion/${pedido_id}?pago=ok`,
          failure: `${appUrl}/checkout/confirmacion/${pedido_id}?pago=error`,
          pending: `${appUrl}/checkout/confirmacion/${pedido_id}?pago=pendiente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/pagos/webhook`,
        external_reference: pedido_id,
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
      preference_id: result.id,
    });
  } catch (err) {
    console.error("MercadoPago preference error:", err);
    return NextResponse.json({ error: "Error al crear preferencia de pago" }, { status: 500 });
  }
}
