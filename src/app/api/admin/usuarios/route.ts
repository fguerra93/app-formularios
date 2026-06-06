import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyAuth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { auditRepo, usuariosAdminRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "vendedor", "bodega"];

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const data = await usuariosAdminRepo.listAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching usuarios:", e);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { email, password, nombre, rol } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email y contraseña son requeridos" },
      { status: 400 }
    );
  }
  if (rol && !ROLES.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  try {
    const data = await usuariosAdminRepo.create({
      email,
      password_hash: hashPassword(password),
      nombre: nombre || null,
      rol: rol || "vendedor",
    });
    await auditRepo.log({
      usuario: session.sub,
      accion: "usuario.crear",
      entidad: "usuario",
      entidad_id: String(data.id),
      datos: { email, rol: rol || "vendedor" },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating usuario:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al crear usuario" },
      { status: 500 }
    );
  }
}
