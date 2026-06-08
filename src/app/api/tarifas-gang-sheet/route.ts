import { NextResponse } from "next/server";
import { tarifasGangSheetRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/** Lista pública de tarifas activas (para poblar el selector del constructor). */
export async function GET() {
  try {
    const tarifas = await tarifasGangSheetRepo.listActivas();
    return NextResponse.json(tarifas);
  } catch (e) {
    console.error("Error listando tarifas gang sheet:", e);
    // Degradación elegante: si la tabla no existe aún, no rompe la UI.
    return NextResponse.json([]);
  }
}
