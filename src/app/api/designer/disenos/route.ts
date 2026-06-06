import { NextRequest, NextResponse } from "next/server";
import { disenosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    producto_id?: string;
    nombre?: string;
    diseno_json?: unknown;
    preview_url?: string;
    variante?: unknown;
    cliente_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { producto_id, nombre, diseno_json, preview_url, variante, cliente_id } = body;

  if (!producto_id || !nombre || !diseno_json) {
    return NextResponse.json(
      { error: "producto_id, nombre y diseno_json son requeridos" },
      { status: 400 }
    );
  }

  try {
    const data = await disenosRepo.create({
      producto_id,
      nombre,
      diseno_json,
      preview_url: preview_url || null,
      variante: variante || null,
      cliente_id: cliente_id || null,
      estado: "borrador",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating diseno:", e);
    return NextResponse.json(
      { error: "Error al guardar diseno" },
      { status: 500 }
    );
  }
}
