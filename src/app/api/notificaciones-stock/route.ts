import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { producto_id, email } = body;

    if (!producto_id || !email) {
      return NextResponse.json(
        { error: "Se requiere producto_id y email" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email no valido" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if product exists
    const { data: producto, error: prodError } = await supabase
      .from("productos")
      .select("id, nombre")
      .eq("id", producto_id)
      .single();

    if (prodError || !producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Check for existing subscription
    const { data: existing } = await supabase
      .from("notificaciones_stock")
      .select("id")
      .eq("producto_id", producto_id)
      .eq("email", email)
      .eq("notificado", false)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Ya estas suscrito para recibir notificacion de este producto",
      });
    }

    const { error } = await supabase.from("notificaciones_stock").insert({
      producto_id,
      email,
      notificado: false,
    });

    if (error) {
      console.error("Error creating stock notification:", error);
      return NextResponse.json(
        { error: "Error al suscribirse a la notificacion" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Te notificaremos cuando el producto este disponible",
    });
  } catch (err) {
    console.error("Notificacion stock error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
