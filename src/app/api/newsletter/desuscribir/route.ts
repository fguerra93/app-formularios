import { NextRequest, NextResponse } from "next/server";
import { newsletterRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalido" }, { status: 400 });
  }

  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email es requerido" }, { status: 400 });
  }

  try {
    await newsletterRepo.desuscribir(email.toLowerCase());
  } catch (e) {
    console.error("Error unsubscribing:", e);
    return NextResponse.json({ error: "Error al desuscribirse" }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Desuscripcion exitosa" });
}
