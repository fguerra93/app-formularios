import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { usuariosAdminRepo } from "@/server/repositories";
import { verifyPassword } from "@/lib/password";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "printup-admin-secret-key-change-in-production"
);

// Bootstrap: credenciales semilla por env. Solo se aceptan mientras NO exista
// ningún usuario activo en `usuarios_admin` (primer arranque). Luego, el login
// se valida siempre contra la tabla.
const BOOTSTRAP_EMAIL = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || "admin").toLowerCase();
const BOOTSTRAP_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export type Rol = "admin" | "vendedor" | "bodega";

export interface Session {
  sub: string;
  rol: Rol;
}

async function signSession(sub: string, rol: Rol): Promise<string> {
  return new SignJWT({ sub, rol })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

/**
 * Valida credenciales y devuelve un JWT (con rol) o null.
 * `identifier` es el email del usuario (o el usuario semilla de bootstrap).
 */
export async function authenticate(
  identifier: string,
  password: string
): Promise<string | null> {
  const email = identifier.trim().toLowerCase();

  // 1. Validar contra la tabla de usuarios.
  const usuario = await usuariosAdminRepo.findByEmail(email);
  if (usuario && usuario.activo && verifyPassword(password, usuario.password_hash)) {
    return signSession(usuario.email, usuario.rol);
  }

  // 2. Bootstrap: solo si todavía no hay usuarios activos en la tabla.
  if (!usuario) {
    const total = await usuariosAdminRepo.countActivos();
    if (
      total === 0 &&
      email === BOOTSTRAP_EMAIL &&
      password === BOOTSTRAP_PASSWORD
    ) {
      return signSession(BOOTSTRAP_EMAIL, "admin");
    }
  }

  return null;
}

/** Sesión actual (sub + rol) desde la cookie, o null. */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: String(payload.sub ?? ""),
      rol: (payload.rol as Rol) || "admin",
    };
  } catch {
    return null;
  }
}

export async function verifyAuth(): Promise<boolean> {
  return (await getSession()) !== null;
}
