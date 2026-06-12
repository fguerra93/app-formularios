import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { gruposRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Listado admin de pedidos grupales con su progreso real. */
export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const grupos = await gruposRepo.listAdmin();
    const conProgreso = await Promise.all(
      grupos.map(async (g) => ({
        ...g,
        progreso: await gruposRepo
          .progreso(g.id)
          .catch(() => ({ pagados: 0, unidades: 0, recaudado: 0, participantes: [] })),
      })),
    );
    return NextResponse.json(conProgreso);
  } catch (e) {
    console.error("admin grupos:", e);
    return NextResponse.json([]);
  }
}
