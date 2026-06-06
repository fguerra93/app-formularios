import { NextResponse } from "next/server";
import { categoriasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categorias = await categoriasRepo.listActivasConConteo();
    return NextResponse.json(categorias);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al listar categorias" },
      { status: 500 }
    );
  }
}
