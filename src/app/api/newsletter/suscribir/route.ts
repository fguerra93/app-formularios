import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; nombre?: string; fuente?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { email, nombre, fuente } = body;

  if (!email) {
    return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Formato de email invalido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check if subscriber already exists
  const { data: existing } = await supabase
    .from("suscriptores")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (existing) {
    if (!existing.activo) {
      // Reactivate inactive subscriber
      const { error } = await supabase
        .from("suscriptores")
        .update({ activo: true, nombre: nombre || existing.nombre })
        .eq("id", existing.id);

      if (error) {
        console.error("Error reactivating suscriptor:", error);
        return NextResponse.json({ error: "Error al reactivar suscripcion" }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true, message: "Suscripcion confirmada" });
  }

  // Create new subscriber
  const { error } = await supabase
    .from("suscriptores")
    .insert({
      email: email.toLowerCase(),
      nombre: nombre || null,
      fuente: fuente || null,
      activo: true,
    });

  if (error) {
    console.error("Error creating suscriptor:", error);
    return NextResponse.json({ error: "Error al suscribirse" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Suscripcion exitosa" }, { status: 201 });
}
