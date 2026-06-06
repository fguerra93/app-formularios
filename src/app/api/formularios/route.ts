import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { formulariosRepo } from "@/server/repositories";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const estado = searchParams.get("estado");
  const search = searchParams.get("search");

  try {
    const { data, total } = await formulariosRepo.listAdmin({
      page,
      limit,
      estado,
      search,
    });
    const totalPages = Math.ceil(total / limit);
    return NextResponse.json({ data, total, page, totalPages });
  } catch (e) {
    console.error("Error fetching formularios:", e);
    return NextResponse.json(
      { error: "Error al obtener formularios" },
      { status: 500 }
    );
  }
}
