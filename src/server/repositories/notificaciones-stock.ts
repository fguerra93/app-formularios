import { getDb } from "@/server/db";

/** Acceso a la tabla `notificaciones_stock` (avisar "volvió al stock"). */
export const notificacionesStockRepo = {
  /** Suscripción pendiente existente para (producto, email), o null. */
  async findPendiente(
    productoId: string,
    email: string
  ): Promise<{ id: string } | null> {
    const { data } = await getDb()
      .from("notificaciones_stock")
      .select("id")
      .eq("producto_id", productoId)
      .eq("email", email)
      .eq("notificado", false)
      .single();
    return (data as { id: string } | null) ?? null;
  },

  /** Crea una suscripción de aviso de stock. */
  async create(productoId: string, email: string): Promise<void> {
    const { error } = await getDb()
      .from("notificaciones_stock")
      .insert({ producto_id: productoId, email, notificado: false });
    if (error) throw new Error(error.message);
  },
};
