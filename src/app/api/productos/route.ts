import { NextRequest, NextResponse } from "next/server";
import { productosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  try {
    const result = await productosRepo.listPublic({
      categoriaSlug: searchParams.get("categoria"),
      destacado: searchParams.get("destacado") === "true",
      search: searchParams.get("search"),
      sort: searchParams.get("sort") || "created_at:desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al listar productos" },
      { status: 500 }
    );
  }
}
