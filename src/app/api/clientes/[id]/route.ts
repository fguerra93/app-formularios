import { NextRequest, NextResponse } from "next/server";
import { clientesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

/**
 * GET /api/clientes/[id]
 *
 * Returns basic client info for form prefilling.
 * Only exposes non-sensitive fields (name, email, phone).
 * Used when the bot sends a link like /contacto?ref=clienteId
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 10) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const data = await clientesRepo.findBasicById(id);

  if (!data) {
    return NextResponse.json(
      { error: "Cliente no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
