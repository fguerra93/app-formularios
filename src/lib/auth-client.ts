"use client";

/**
 * Auth de clientes en el navegador: ahora habla con las rutas propias
 * (`/api/cliente/auth/*`) que usan JWT por cookie sobre Cloud SQL. Reemplaza el
 * SDK de Supabase Auth manteniendo las mismas firmas que consume la UI.
 */

interface UserLite {
  id: string;
  email: string;
}

async function postJson(url: string, body?: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Error de autenticación");
  }
  return data;
}

export async function signUp(
  email: string,
  password: string,
  nombre: string,
  telefono?: string
) {
  return postJson("/api/cliente/auth/register", { email, password, nombre, telefono });
}

export async function signIn(email: string, password: string) {
  return postJson("/api/cliente/auth/login", { email, password });
}

export async function signOut() {
  await postJson("/api/cliente/auth/logout");
}

export async function getSession(): Promise<{ user: UserLite; cliente: unknown } | null> {
  const res = await fetch("/api/cliente/auth/session", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  return (data as { user: UserLite | null }).user
    ? (data as { user: UserLite; cliente: unknown })
    : null;
}

export async function getUser(): Promise<UserLite | null> {
  const s = await getSession();
  return s?.user ?? null;
}

export async function resetPassword(_email: string): Promise<void> {
  throw new Error(
    "La recuperación de contraseña no está disponible en el sandbox. Escríbenos por WhatsApp."
  );
}
