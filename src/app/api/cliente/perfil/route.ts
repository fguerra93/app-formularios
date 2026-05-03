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

    const { data: cliente, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      // If client doesn't exist yet, return basic info from auth
      if (error.code === "PGRST116") {
        return NextResponse.json({
          id: user.id,
          email: user.email,
          nombre: user.user_metadata?.nombre || null,
          telefono: null,
          rut: null,
          direccion_default: null,
          preferencias: {},
        });
      }
      console.error("Error fetching cliente:", error);
      return NextResponse.json(
        { error: "Error al obtener perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json(cliente);
  } catch (err) {
    console.error("Perfil GET error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { nombre, telefono, rut, direccion_default, preferencias } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (nombre !== undefined) updateData.nombre = nombre;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (rut !== undefined) updateData.rut = rut;
    if (direccion_default !== undefined)
      updateData.direccion_default = direccion_default;
    if (preferencias !== undefined) updateData.preferencias = preferencias;

    const { data, error } = await supabase
      .from("clientes")
      .upsert(
        {
          id: user.id,
          email: user.email,
          ...updateData,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Error updating cliente:", error);
      return NextResponse.json(
        { error: "Error al actualizar perfil" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Perfil PUT error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
