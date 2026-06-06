import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { auditRepo, usuariosAdminRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "vendedor", "bodega"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.nombre !== undefined) updateData.nombre = body.nombre;
  if (body.activo !== undefined) updateData.activo = body.activo;
  if (body.rol !== undefined) {
    if (!ROLES.includes(body.rol)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    updateData.rol = body.rol;
  }
  if (body.password) {
    updateData.password_hash = hashPassword(body.password);
  }

  try {
    const data = await usuariosAdminRepo.update(id, updateData);
    await auditRepo.log({
      usuario: session.sub,
      accion: "usuario.editar",
      entidad: "usuario",
      entidad_id: id,
      datos: {
        cambios: Object.keys(updateData).filter((k) => k !== "password_hash"),
        password_cambiado: !!body.password,
      },
    });
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error updating usuario:", e);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await usuariosAdminRepo.remove(id);
    await auditRepo.log({
      usuario: session.sub,
      accion: "usuario.eliminar",
      entidad: "usuario",
      entidad_id: id,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting usuario:", e);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
