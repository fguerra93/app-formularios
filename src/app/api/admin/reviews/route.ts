import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { reviewsRepo } from "@/server/repositories";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const estado = searchParams.get("estado");

  try {
    const data = await reviewsRepo.listAdmin(estado);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching reviews:", e);
    return NextResponse.json({ error: "Error al obtener reviews" }, { status: 500 });
  }
}
