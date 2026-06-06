import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { mensajeriaRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const canal = searchParams.get("canal");
  const estado = searchParams.get("estado");
  const etiqueta = searchParams.get("etiqueta");
  const busqueda = searchParams.get("busqueda");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const { data, count } = await mensajeriaRepo.listConversaciones({
      canal,
      estado,
      etiqueta,
      busqueda,
      offset,
      limit,
    });
    return NextResponse.json({
      conversaciones: data,
      total: count,
    });
  } catch (e) {
    console.error("Error fetching conversaciones:", e);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }
}
