import { getDb } from "@/server/db";

/**
 * Acceso a la tabla `clientes` (acceso service-role).
 *
 * Nota: el flujo de cuenta del cliente (perfil/pedidos/carrito) usa hoy un
 * cliente Supabase por-request con el token del usuario + RLS; esa parte se
 * migra en la Fase 8 junto con el reemplazo de Supabase Auth por JWT propio.
 */
export const clientesRepo = {
  /** Datos básicos para prellenar formularios (no sensibles), o null. */
  async findBasicById(
    id: string
  ): Promise<{ nombre: string; email: string; telefono: string | null } | null> {
    const { data } = await getDb()
      .from("clientes")
      .select("nombre, email, telefono")
      .eq("id", id)
      .single();
    return (
      (data as { nombre: string; email: string; telefono: string | null } | null) ??
      null
    );
  },

  // --- Bot (identificación por canal y alta vía onboarding) ---
  /** Busca un cliente por su identificador de canal (whatsapp/instagram/facebook). */
  async findByContacto(
    canal: string,
    senderPhone: string,
    senderId: string
  ): Promise<Record<string, unknown> | null> {
    const db = getDb();
    let query;
    if (canal === "whatsapp" && senderPhone) {
      query = db.from("clientes").select("*").eq("whatsapp_phone", senderPhone);
    } else if (canal === "instagram") {
      query = db.from("clientes").select("*").eq("instagram_id", senderId);
    } else if (canal === "facebook") {
      query = db.from("clientes").select("*").eq("facebook_id", senderId);
    } else {
      return null;
    }
    const { data } = await query.limit(1).single();
    return (data as Record<string, unknown> | null) ?? null;
  },

  /** id de un cliente por email, o null. */
  async findIdByEmail(email: string): Promise<{ id: string } | null> {
    const { data } = await getDb()
      .from("clientes")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();
    return (data as { id: string } | null) ?? null;
  },

  async updateById(id: string, values: Record<string, unknown>): Promise<void> {
    await getDb().from("clientes").update(values).eq("id", id);
  },

  /** Inserta un cliente. Devuelve { id } o null si falla. */
  async insertReturningId(
    values: Record<string, unknown>
  ): Promise<{ id: string } | null> {
    const { data, error } = await getDb()
      .from("clientes")
      .insert(values)
      .select("id")
      .single();
    if (error || !data) {
      console.error("Error creating cliente:", error);
      return null;
    }
    return data as { id: string };
  },

  /** Cantidad de clientes con email (para preview de segmentos). */
  async countConEmail(): Promise<number> {
    const { count } = await getDb()
      .from("clientes")
      .select("*", { count: "exact", head: true })
      .not("email", "is", null);
    return count || 0;
  },

  /** Clientes con email y nombre (campañas). `limit` opcional para preview. */
  async listConEmail(
    limit?: number
  ): Promise<{ email: string; nombre: string | null }[]> {
    let query = getDb()
      .from("clientes")
      .select("email, nombre")
      .not("email", "is", null);
    if (limit) {
      query = query.order("created_at", { ascending: false }).limit(limit);
    }
    const { data } = await query;
    return (data || []) as { email: string; nombre: string | null }[];
  },
};
