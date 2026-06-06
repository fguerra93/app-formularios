import { NextRequest, NextResponse } from "next/server";
import { clipartRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");

  try {
    const data = await clipartRepo.listActivos(categoria);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching clipart:", e);
    return NextResponse.json(
      { error: "Error al obtener clipart" },
      { status: 500 }
    );
  }
}
