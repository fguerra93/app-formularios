import { NextResponse } from "next/server";
import { clientesDestacadosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await clientesDestacadosRepo.listActivos();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
