import { NextRequest, NextResponse } from "next/server";
import { favoritosRepo } from "@/server/repositories";
import { getClienteSession } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = await favoritosRepo.listByCliente(sess.id);
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { producto_id } = await request.json();
  if (!producto_id) return NextResponse.json({ error: "producto_id requerido" }, { status: 400 });
  await favoritosRepo.add(sess.id, String(producto_id));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  await favoritosRepo.remove(id, sess.id);
  return NextResponse.json({ success: true });
}
