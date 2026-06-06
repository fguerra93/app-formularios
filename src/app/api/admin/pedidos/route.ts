import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { pedidosRepo } from "@/server/repositories";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  try {
    const result = await pedidosRepo.listAdmin({
      estado: searchParams.get("estado"),
      search: searchParams.get("search"),
      desde: searchParams.get("desde"),
      hasta: searchParams.get("hasta"),
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("Error fetching pedidos:", e);
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
  }
}
