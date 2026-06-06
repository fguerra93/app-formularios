import { NextRequest, NextResponse } from "next/server";
import { portafolioRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const categoria = searchParams.get("categoria");
  const destacado = searchParams.get("destacado");
  const limit = searchParams.get("limit");

  try {
    const data = await portafolioRepo.listPublic({
      categoria,
      destacado: destacado === "true",
      limit: limit ? parseInt(limit) : null,
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
