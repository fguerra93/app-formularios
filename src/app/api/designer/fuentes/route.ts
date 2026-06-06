import { NextResponse } from "next/server";
import { fuentesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fuentesRepo.listActivas();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching fuentes:", e);
    return NextResponse.json(
      { error: "Error al obtener fuentes" },
      { status: 500 }
    );
  }
}
