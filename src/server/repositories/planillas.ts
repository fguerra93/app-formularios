import { getDb } from "@/server/db";

export interface RangoPrecio {
  min: number;
  max: number;
  precio_unitario: number;
}

export interface Planilla {
  id: string;
  tipo_producto: string;
  unidad: string;
  rangos: RangoPrecio[];
  precio_diseno: number;
  dias_produccion: number;
}

/** Planillas de precios para cotización automática (`planillas_precios`). */
export const planillasRepo = {
  async listActivas(): Promise<Planilla[]> {
    const { data } = await getDb()
      .from("planillas_precios")
      .select("*")
      .eq("activo", true)
      .order("tipo_producto", { ascending: true });
    return (data || []) as Planilla[];
  },

  /** Planilla por tipo de producto (case-insensitive), o null. */
  async findByTipo(tipo: string): Promise<Planilla | null> {
    const { data } = await getDb()
      .from("planillas_precios")
      .select("*")
      .ilike("tipo_producto", tipo)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();
    return (data as Planilla | null) ?? null;
  },
};
