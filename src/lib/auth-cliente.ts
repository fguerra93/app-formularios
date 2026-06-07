import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Auth de clientes con JWT propio (cookie httpOnly), sobre Cloud SQL — reemplaza
 * Supabase Auth (Variante B, all-GCP). El hash de contraseña usa scrypt
 * (`@/lib/password`). La sesión vive en la cookie `cliente_token`.
 */
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "printup-admin-secret-key-change-in-production"
);
export const CLIENTE_COOKIE = "cliente_token";

export interface ClienteSession {
  id: string;
  email: string;
}

export async function signClienteToken(id: string, email: string): Promise<string> {
  return new SignJWT({ sub: id, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

/** Sesión del cliente desde la cookie, o null. */
export async function getClienteSession(): Promise<ClienteSession | null> {
  try {
    const token = (await cookies()).get(CLIENTE_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const id = String(payload.sub ?? "");
    if (!id) return null;
    return { id, email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}
