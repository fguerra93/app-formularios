import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { formulariosRepo } from "@/server/repositories";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await formulariosRepo.findById(id);

  if (!data) {
    return NextResponse.json(
      { error: "Formulario no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { estado } = await request.json();

  const validEstados = ["nuevo", "revisado", "completado"];
  if (!estado || !validEstados.includes(estado)) {
    return NextResponse.json(
      { error: "Estado inválido. Valores permitidos: nuevo, revisado, completado" },
      { status: 400 }
    );
  }

  const data = await formulariosRepo.updateEstado(id, estado);

  if (!data) {
    return NextResponse.json(
      { error: "Error al actualizar formulario" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
