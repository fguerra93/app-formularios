import { NextRequest, NextResponse } from "next/server";
import { clientesRepo } from "@/server/repositories";
import { hashPassword } from "@/lib/password";
import { signClienteToken, CLIENTE_COOKIE } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre, telefono } = await request.json();
    if (!email || !password || !nombre) {
      return NextResponse.json({ error: "Email, contraseña y nombre son requeridos" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
    }
    const e = String(email).trim().toLowerCase();
    if (await clientesRepo.findByEmailFull(e)) {
      return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
    }
    const cliente = await clientesRepo.createConPassword({
      email: e,
      password_hash: hashPassword(String(password)),
      nombre: String(nombre).trim(),
      telefono: telefono ? String(telefono).trim() : null,
    });
    if (!cliente) {
      return NextResponse.json({ error: "No se pudo crear la cuenta" }, { status: 500 });
    }
    const id = String(cliente.id);
    const token = await signClienteToken(id, e);
    const res = NextResponse.json({ user: { id, email: e }, cliente });
    res.cookies.set(CLIENTE_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
