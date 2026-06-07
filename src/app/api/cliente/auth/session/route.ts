import { NextResponse } from "next/server";
import { clientesRepo } from "@/server/repositories";
import { getClienteSession } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ user: null, cliente: null });
  const cliente = await clientesRepo.findByIdFull(sess.id);
  if (!cliente) return NextResponse.json({ user: null, cliente: null });
  return NextResponse.json({
    user: { id: sess.id, email: sess.email },
    cliente,
  });
}
