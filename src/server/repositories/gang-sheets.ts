import { getDb } from "@/server/db";

export interface TramoDescuento {
  min_cm2: number;
  max_cm2: number;
  descuento_pct: number;
}

export interface TarifaGangSheet {
  id: string;
  material: string;
  ancho_pliego_cm: number;
  tarifa_por_cm2: number;
  merma_pct: number;
  precio_minimo: number;
  tramos: TramoDescuento[];
  dias_produccion: number;
}

/**
 * Normaliza una fila de `tarifas_gang_sheet`. El driver `pg` (Cloud SQL)
 * devuelve `numeric` como string; Supabase los devuelve como number. Se
 * coacciona aquí para que el cálculo sea idéntico en ambos backends.
 */
function mapTarifa(row: Record<string, unknown>): TarifaGangSheet {
  let tramos = row.tramos as unknown;
  if (typeof tramos === "string") {
    try {
      tramos = JSON.parse(tramos);
    } catch {
      tramos = [];
    }
  }
  return {
    id: String(row.id),
    material: String(row.material),
    ancho_pliego_cm: Number(row.ancho_pliego_cm),
    tarifa_por_cm2: Number(row.tarifa_por_cm2),
    merma_pct: Number(row.merma_pct),
    precio_minimo: Number(row.precio_minimo),
    tramos: Array.isArray(tramos) ? (tramos as TramoDescuento[]) : [],
    dias_produccion: Number(row.dias_produccion),
  };
}

/** Tarifas por material para el gang sheet (`tarifas_gang_sheet`). */
export const tarifasGangSheetRepo = {
  async listActivas(): Promise<TarifaGangSheet[]> {
    const { data } = await getDb()
      .from("tarifas_gang_sheet")
      .select("*")
      .eq("activo", true)
      .order("material", { ascending: true });
    return (data || []).map((r) => mapTarifa(r as Record<string, unknown>));
  },

  /** Tarifa por material (case-insensitive), o null. */
  async findByMaterial(material: string): Promise<TarifaGangSheet | null> {
    const { data } = await getDb()
      .from("tarifas_gang_sheet")
      .select("*")
      .ilike("material", material)
      .eq("activo", true)
      .limit(1)
      .maybeSingle();
    return data ? mapTarifa(data as Record<string, unknown>) : null;
  },
};

/** Pliegos guardados por clientes / bot (`gang_sheets`). */
export const gangSheetsRepo = {
  async create(values: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("gang_sheets")
      .insert(values)
      .select()
      .single();
    if (error || !data) {
      console.error("Error creando gang sheet:", error);
      return null;
    }
    return data as Record<string, unknown>;
  },

  async findById(id: string): Promise<Record<string, unknown> | null> {
    const { data } = await getDb()
      .from("gang_sheets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Record<string, unknown> | null) ?? null;
  },

  async update(id: string, values: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const { data, error } = await getDb()
      .from("gang_sheets")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) {
      console.error("Error actualizando gang sheet:", error);
      return null;
    }
    return data as Record<string, unknown>;
  },
};
