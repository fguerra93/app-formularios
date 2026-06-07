import { NextRequest, NextResponse } from "next/server";
import { clientesRepo } from "@/server/repositories";
import { verifyPassword } from "@/lib/password";
import { signClienteToken, CLIENTE_COOKIE } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }
    const e = String(email).trim().toLowerCase();
    const cliente = await clientesRepo.findByEmailFull(e);
    const hash = cliente?.password_hash as string | undefined;
    if (!cliente || !hash || !verifyPassword(String(password), hash)) {
      return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
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
