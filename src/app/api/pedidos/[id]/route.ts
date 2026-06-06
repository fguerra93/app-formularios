import { NextRequest, NextResponse } from "next/server";
import { pedidosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await pedidosRepo.findById(id);

  if (!data) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
