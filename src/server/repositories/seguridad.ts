import { getDb } from "@/server/db";

/** Idempotencia de webhooks (`webhook_eventos`) — Patrón 4. */
export const webhookEventosRepo = {
  /** ¿Ya se procesó este evento del proveedor? */
  async yaProcesado(proveedor: string, eventoId: string): Promise<boolean> {
    const { data } = await getDb()
      .from("webhook_eventos")
      .select("id")
      .eq("proveedor", proveedor)
      .eq("evento_id", eventoId)
      .maybeSingle();
    return !!data;
  },

  /**
   * Registra un evento como procesado. Devuelve false si ya existía
   * (violación de UNIQUE), true si quedó registrado por primera vez.
   */
  async registrar(
    proveedor: string,
    eventoId: string,
    payload: unknown
  ): Promise<boolean> {
    const { error } = await getDb()
      .from("webhook_eventos")
      .insert({ proveedor, evento_id: eventoId, payload });
    if (error) {
      // 23505 = unique_violation -> ya estaba registrado (carrera de reintentos)
      if ((error as { code?: string }).code === "23505") return false;
      throw new Error(error.message);
    }
    return true;
  },
};

export interface UsuarioAdmin {
  id: string;
  email: string;
  password_hash: string;
  nombre: string | null;
  rol: "admin" | "vendedor" | "bodega";
  activo: boolean;
}

/** Usuarios del panel admin (`usuarios_admin`) — Patrón 6 (RBAC). */
export const usuariosAdminRepo = {
  async findByEmail(email: string): Promise<UsuarioAdmin | null> {
    const { data } = await getDb()
      .from("usuarios_admin")
      .select("id, email, password_hash, nombre, rol, activo")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    return (data as UsuarioAdmin | null) ?? null;
  },

  /** Cantidad de usuarios activos (para el bootstrap del admin semilla). */
  async countActivos(): Promise<number> {
    const { count } = await getDb()
      .from("usuarios_admin")
      .select("*", { count: "exact", head: true })
      .eq("activo", true);
    return count || 0;
  },

  async listAll(): Promise<Omit<UsuarioAdmin, "password_hash">[]> {
    const { data, error } = await getDb()
      .from("usuarios_admin")
      .select("id, email, nombre, rol, activo, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []) as Omit<UsuarioAdmin, "password_hash">[];
  },

  async create(values: {
    email: string;
    password_hash: string;
    nombre: string | null;
    rol: string;
  }): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("usuarios_admin")
      .insert({ ...values, email: values.email.toLowerCase() })
      .select("id, email, nombre, rol, activo")
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear usuario");
    return data as Record<string, unknown>;
  },

  async update(id: string, values: Record<string, unknown>): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("usuarios_admin")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, email, nombre, rol, activo")
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar usuario");
    return data as Record<string, unknown>;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getDb().from("usuarios_admin").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

/** Audit log (`audit_log`) — Patrón 10. Best-effort: nunca rompe el flujo. */
export const auditRepo = {
  async log(values: {
    usuario?: string | null;
    accion: string;
    entidad?: string | null;
    entidad_id?: string | null;
    datos?: unknown;
  }): Promise<void> {
    try {
      await getDb().from("audit_log").insert({
        usuario: values.usuario ?? null,
        accion: values.accion,
        entidad: values.entidad ?? null,
        entidad_id: values.entidad_id ?? null,
        datos: values.datos ?? null,
      });
    } catch (e) {
      console.error("audit_log error:", e);
    }
  },

  async list(limit = 200): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },
};
