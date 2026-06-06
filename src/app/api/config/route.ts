import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { configuracionRepo } from "@/server/repositories";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const config = await configuracionRepo.getAll();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  // Support both formats: array [{clave, valor}] or object {clave: valor}
  let entries: [string, string][];
  if (Array.isArray(body)) {
    entries = body.map((item: { clave: string; valor: string }) => [item.clave, item.valor]);
  } else {
    entries = Object.entries(body) as [string, string][];
  }

  try {
    await configuracionRepo.upsertMany(entries);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
