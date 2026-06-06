import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { newsletterRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");

  try {
    const data = await newsletterRepo.listAdmin(search);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching suscriptores:", e);
    return NextResponse.json({ error: "Error al obtener suscriptores" }, { status: 500 });
  }
}
