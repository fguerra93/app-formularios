import { NextRequest, NextResponse } from "next/server";
import { clientesRepo } from "@/server/repositories";
import { getClienteSession } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cliente = await clientesRepo.findByIdFull(sess.id);
  if (!cliente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(request: NextRequest) {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json();
    const values: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const k of ["nombre", "telefono", "rut", "direccion_default", "preferencias"]) {
      if (body[k] !== undefined) values[k] = body[k];
    }
    await clientesRepo.updateById(sess.id, values);
    const cliente = await clientesRepo.findByIdFull(sess.id);
    return NextResponse.json(cliente);
  } catch {
    return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
  }
}
