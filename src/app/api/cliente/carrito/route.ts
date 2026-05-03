import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthenticatedClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: carrito, error } = await supabase
      .from("carritos_guardados")
      .select("*")
      .eq("cliente_id", user.id)
      .eq("recuperado", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No cart found is not an error
      if (error.code === "PGRST116") {
        return NextResponse.json({ carrito: null });
      }
      console.error("Error fetching carrito:", error);
      return NextResponse.json(
        { error: "Error al obtener carrito" },
        { status: 500 }
      );
    }

    return NextResponse.json({ carrito });
  } catch (err) {
    console.error("Carrito GET error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthenticatedClient(request);
    if (!supabase) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { items, cupon_codigo } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Se requiere un array de items" },
        { status: 400 }
      );
    }

    // Check if there is an existing non-recovered cart for this user
    const { data: existing } = await supabase
      .from("carritos_guardados")
      .select("id")
      .eq("cliente_id", user.id)
      .eq("recuperado", false)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const carritoData = {
      cliente_id: user.id,
      email: user.email,
      items,
      cupon_codigo: cupon_codigo || null,
      updated_at: new Date().toISOString(),
      email_enviado: false,
      recuperado: false,
    };

    let result;

    if (existing) {
      // Update existing cart
      const { data, error } = await supabase
        .from("carritos_guardados")
        .update(carritoData)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating carrito:", error);
        return NextResponse.json(
          { error: "Error al actualizar carrito" },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new cart
      const { data, error } = await supabase
        .from("carritos_guardados")
        .insert(carritoData)
        .select()
        .single();

      if (error) {
        console.error("Error creating carrito:", error);
        return NextResponse.json(
          { error: "Error al guardar carrito" },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({ success: true, carrito: result });
  } catch (err) {
    console.error("Carrito POST error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
