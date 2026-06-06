import { NextRequest, NextResponse } from "next/server";
import { newsletterRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; nombre?: string; fuente?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { email, nombre, fuente } = body;

  if (!email) {
    return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Formato de email invalido" }, { status: 400 });
  }

  // Check if subscriber already exists
  const existing = await newsletterRepo.findByEmail(email.toLowerCase());

  if (existing) {
    if (!existing.activo) {
      // Reactivate inactive subscriber
      try {
        await newsletterRepo.reactivate(
          existing.id as string,
          (nombre || existing.nombre) as string | null
        );
      } catch (e) {
        console.error("Error reactivating suscriptor:", e);
        return NextResponse.json({ error: "Error al reactivar suscripcion" }, { status: 500 });
      }
    }
    return NextResponse.json({ success: true, message: "Suscripcion confirmada" });
  }

  // Create new subscriber
  try {
    await newsletterRepo.create({
      email: email.toLowerCase(),
      nombre: nombre || null,
      fuente: fuente || null,
      activo: true,
    });
  } catch (e) {
    console.error("Error creating suscriptor:", e);
    return NextResponse.json({ error: "Error al suscribirse" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Suscripcion exitosa" }, { status: 201 });
}
