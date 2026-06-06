import { getDb } from "@/server/db";

/** Acceso a la tabla `preguntas_producto` (preguntas sobre productos). */
export const preguntasRepo = {
  /** Lista admin de preguntas, filtrable por estado. */
  async listAdmin(estado?: string | null): Promise<Record<string, unknown>[]> {
    let query = getDb()
      .from("preguntas_producto")
      .select("*, productos(nombre)")
      .order("created_at", { ascending: false });

    if (estado === "pendiente") {
      query = query.is("respuesta", null);
    } else if (estado === "respondida") {
      query = query.not("respuesta", "is", null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  async update(
    id: string,
    values: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("preguntas_producto")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar pregunta");
    return data as Record<string, unknown>;
  },

  /** id de un producto a partir de su slug (para asociar preguntas públicas). */
  async findProductoIdBySlug(slug: string): Promise<{ id: string } | null> {
    const { data, error } = await getDb()
      .from("productos")
      .select("id")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return data as { id: string };
  },

  /** Preguntas públicas de un producto. */
  async listPublicasByProducto(
    productoId: string
  ): Promise<Record<string, unknown>[]> {
    const { data, error } = await getDb()
      .from("preguntas_producto")
      .select("*")
      .eq("producto_id", productoId)
      .eq("publica", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Record<string, unknown>[];
  },

  /** Crea una pregunta pública (queda no pública hasta moderación). */
  async create(values: {
    producto_id: string;
    autor_nombre: string;
    autor_email: string;
    pregunta: string;
    cliente_id: string | null;
    publica: boolean;
  }): Promise<Record<string, unknown>> {
    const { data, error } = await getDb()
      .from("preguntas_producto")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear pregunta");
    return data as Record<string, unknown>;
  },
};
