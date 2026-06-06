import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { statsRepo } from "@/server/repositories";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const stats = await statsRepo.getDashboard();
  return NextResponse.json(stats);
}
