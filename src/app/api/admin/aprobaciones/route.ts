import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { aprobacionesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const estado = request.nextUrl.searchParams.get("estado");
  try {
    const [aprobaciones, pendientes] = await Promise.all([
      aprobacionesRepo.list(estado),
      aprobacionesRepo.countPendientes(),
    ]);
    return NextResponse.json({ aprobaciones, pendientes });
  } catch (e) {
    console.error("Error fetching aprobaciones:", e);
    return NextResponse.json({ error: "Error al obtener aprobaciones" }, { status: 500 });
  }
}
