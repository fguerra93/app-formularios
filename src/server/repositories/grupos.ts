import { getDb } from "@/server/db";

/**
 * Pedidos grupales de generación: el delegado crea el grupo y comparte el
 * link; cada apoderado paga SU parte como pedido individual (pedidos.grupo_id).
 * La producción parte cuando el grupo completa la meta o vence la fecha.
 */

export interface GrupoPedido {
  id: string;
  codigo: string;
  nombre: string;
  producto_id: string;
  organizador_nombre: string;
  organizador_email: string;
  organizador_telefono: string | null;
  precio_referencia: number;
  meta_unidades: number;
  fecha_limite: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
}

export interface ProgresoGrupo {
  pagados: number;
  unidades: number;
  recaudado: number;
  participantes: { nombre: string; talla: string | null; estampado: string | null }[];
}

const SIN_AMBIGUOS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generarCodigoGrupo(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += SIN_AMBIGUOS[Math.floor(Math.random() * SIN_AMBIGUOS.length)];
  }
  return codigo;
}

export const gruposRepo = {
  async crear(input: Omit<GrupoPedido, "id" | "codigo" | "estado" | "created_at">): Promise<GrupoPedido> {
    // Reintenta si el código corto colisiona (improbable: 31^6).
    for (let intento = 0; intento < 3; intento++) {
      const { data, error } = await getDb()
        .from("grupos_pedido")
        .insert({ ...input, codigo: generarCodigoGrupo(), estado: "abierto" })
        .select()
        .single();
      if (!error && data) return data as GrupoPedido;
      if (error && !/codigo|duplicate|unique/i.test(error.message)) {
        throw new Error(error.message);
      }
    }
    throw new Error("No se pudo generar un código de grupo");
  },

  async findByCodigo(codigo: string): Promise<GrupoPedido | null> {
    const { data } = await getDb()
      .from("grupos_pedido")
      .select("*")
      .eq("codigo", codigo.toUpperCase())
      .maybeSingle();
    return (data as GrupoPedido | null) ?? null;
  },

  /** Progreso real del grupo: pedidos PAGADOS vinculados. */
  async progreso(grupoId: string): Promise<ProgresoGrupo> {
    const { data } = await getDb()
      .from("pedidos")
      .select("cliente_nombre, items, total, pago_estado")
      .eq("grupo_id", grupoId)
      .eq("pago_estado", "pagado");
    const filas = (data || []) as { cliente_nombre: string; items: unknown; total: number }[];

    let unidades = 0;
    let recaudado = 0;
    const participantes: ProgresoGrupo["participantes"] = [];
    for (const fila of filas) {
      recaudado += Number(fila.total) || 0;
      const items = Array.isArray(fila.items)
        ? (fila.items as { cantidad?: number; variante?: Record<string, string> | null }[])
        : [];
      for (const it of items) {
        unidades += Number(it.cantidad) || 0;
        participantes.push({
          nombre: fila.cliente_nombre,
          talla: it.variante?.["Talla"] ?? null,
          estampado: it.variante?.["Nombre estampado"] ?? null,
        });
      }
    }
    return { pagados: filas.length, unidades, recaudado, participantes };
  },

  async listAdmin(): Promise<GrupoPedido[]> {
    const { data } = await getDb()
      .from("grupos_pedido")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data || []) as GrupoPedido[];
  },
};
