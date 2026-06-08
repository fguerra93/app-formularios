import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { proveedoresRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    return NextResponse.json(await proveedoresRepo.listAll());
  } catch (e) {
    console.error("Error proveedores:", e);
    return NextResponse.json({ error: "Error al obtener proveedores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyAuth())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await request.json();
  if (!body?.nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  try {
    const data = await proveedoresRepo.create({
      nombre: body.nombre,
      rut: body.rut || null,
      contacto: body.contacto || null,
      telefono: body.telefono || null,
      email: body.email || null,
      notas: body.notas || null,
      activo: body.activo !== false,
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creando proveedor:", e);
    return NextResponse.json({ error: "Error al crear proveedor" }, { status: 500 });
  }
}
