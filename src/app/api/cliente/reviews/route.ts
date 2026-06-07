import { NextResponse } from "next/server";
import { reviewsRepo } from "@/server/repositories";
import { getClienteSession } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function GET() {
  const sess = await getClienteSession();
  if (!sess) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const data = await reviewsRepo.listByClienteOrEmail(sess.id, sess.email || null);
  return NextResponse.json({ data });
}
