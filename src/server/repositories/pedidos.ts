import { getDb } from "@/server/db";
import type { Pedido, ItemPedido, DireccionEnvio } from "@/server/domain";

export interface CrearPedidoInput {
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string | null;
  cliente_rut?: string | null;
  direccion_envio?: DireccionEnvio | Record<string, unknown> | null;
  tipo_entrega: "retiro_tienda" | "despacho";
  items: ItemPedido[];
  subtotal: number;
  costo_envio: number;
  total: number;
  pago_metodo?: string | null;
  notas?: string | null;
  cliente_id?: string | null;
}

export interface PedidoReciente {
  cliente_nombre: string | null;
  items: unknown;
  created_at: string;
}

/** Acceso a la tabla `pedidos`. */
export const pedidosRepo = {
  /**
   * Crea un pedido. Los montos llegan YA recalculados en el servidor
   * (ver `calcularPedido` en src/lib/checkout.ts). Devuelve la fila creada
   * (incluye `numero_pedido` generado por la BD).
   */
  async create(input: CrearPedidoInput): Promise<Pedido> {
    const { data, error } = await getDb()
      .from("pedidos")
      .insert({
        cliente_nombre: input.cliente_nombre,
        cliente_email: input.cliente_email,
        cliente_telefono: input.cliente_telefono ?? null,
        cliente_rut: input.cliente_rut ?? null,
        direccion_envio: input.direccion_envio ?? null,
        tipo_entrega: input.tipo_entrega,
        items: input.items,
        subtotal: input.subtotal,
        costo_envio: input.costo_envio,
        total: input.total,
        estado: "pendiente",
        pago_estado: "pendiente",
        pago_metodo: input.pago_metodo ?? "transferencia",
        notas: input.notas ?? null,
        cliente_id: input.cliente_id ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Error al crear el pedido");
    }
    return data as Pedido;
  },

  /** Un pedido por id, o null. */
  async findById(id: string): Promise<Pedido | null> {
    const { data } = await getDb()
      .from("pedidos")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Pedido | null) ?? null;
  },

  /** Pedidos recientes desde una fecha ISO (para prueba social). */
  async findRecientes(sinceISO: string, limit = 10): Promise<PedidoReciente[]> {
    const { data, error } = await getDb()
      .from("pedidos")
      .select("cliente_nombre, items, created_at")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as PedidoReciente[] | null) ?? [];
  },

  // --- Admin ---
  /** Listado admin con filtros (estado/search/fechas) y paginación. */
  async listAdmin(opts: {
    estado?: string | null;
    search?: string | null;
    desde?: string | null;
    hasta?: string | null;
    page?: number;
    limit?: number;
  }): Promise<{ data: Pedido[]; total: number; page: number; totalPages: number }> {
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 20;
    const offset = (page - 1) * limit;

    let query = getDb()
      .from("pedidos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (opts.estado && opts.estado !== "todos") query = query.eq("estado", opts.estado);
    if (opts.search)
      query = query.or(
        `cliente_nombre.ilike.%${opts.search}%,cliente_email.ilike.%${opts.search}%`
      );
    if (opts.desde) query = query.gte("created_at", opts.desde);
    if (opts.hasta) query = query.lte("created_at", opts.hasta);

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    return {
      data: (data as Pedido[] | null) ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  },

  /** Pedidos para exportación CSV (filtros, sin paginar). */
  async listForExport(opts: {
    estado?: string | null;
    desde?: string | null;
    hasta?: string | null;
  }): Promise<Pedido[]> {
    let query = getDb()
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });
    if (opts.estado && opts.estado !== "todos") query = query.eq("estado", opts.estado);
    if (opts.desde) query = query.gte("created_at", opts.desde);
    if (opts.hasta) query = query.lte("created_at", opts.hasta);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as Pedido[] | null) ?? [];
  },

  /**
   * Estado de un pedido para el bot, por número o email. Devuelve el primer
   * pedido encontrado o null. (Campos: numero_pedido, estado, total, created_at.)
   */
  async findEstadoParaBot(opts: {
    isEmail: boolean;
    text: string;
    numero: number;
  }): Promise<Record<string, unknown> | null> {
    let query = getDb()
      .from("pedidos")
      .select("numero_pedido, estado, total, created_at");
    if (opts.isEmail) {
      query = query.eq("cliente_email", opts.text.trim());
    } else {
      query = query.eq("numero_pedido", opts.numero);
    }
    const { data } = await query.limit(1);
    return (data && data.length > 0 ? data[0] : null) as Record<string, unknown> | null;
  },

  /** Pedidos de un cliente (por cliente_id), recientes primero. */
  async listByClienteId(clienteId: string): Promise<Pedido[]> {
    const { data } = await getDb()
      .from("pedidos")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: false });
    return (data as Pedido[] | null) ?? [];
  },

  /** Todos los pedidos de un email (Cliente 360), recientes primero. */
  async listByEmail(email: string): Promise<Pedido[]> {
    const { data } = await getDb()
      .from("pedidos")
      .select("*")
      .ilike("cliente_email", email)
      .order("created_at", { ascending: false });
    return (data as Pedido[] | null) ?? [];
  },

  /** Pedidos pagados/avanzados de un email, para verificar reseñas (id, items). */
  async listParaVerificarReview(
    email: string
  ): Promise<{ id: string; items: unknown }[]> {
    const { data } = await getDb()
      .from("pedidos")
      .select("id, items")
      .ilike("cliente_email", email)
      .in("estado", ["confirmado", "enviado", "entregado"]);
    return (data || []) as { id: string; items: unknown }[];
  },

  /** Contactos derivados de pedidos (para la vista de contactos). */
  async listContactos(search?: string | null): Promise<
    {
      cliente_nombre: string;
      cliente_email: string;
      cliente_telefono: string | null;
      created_at: string;
    }[]
  > {
    let query = getDb()
      .from("pedidos")
      .select("cliente_nombre, cliente_email, cliente_telefono, created_at");
    if (search)
      query = query.or(
        `cliente_nombre.ilike.%${search}%,cliente_email.ilike.%${search}%`
      );
    const { data } = await query;
    return (data || []) as {
      cliente_nombre: string;
      cliente_email: string;
      cliente_telefono: string | null;
      created_at: string;
    }[];
  },

  /** Actualiza campos de un pedido (estado/pago_estado/notas...). */
  async update(id: string, values: Record<string, unknown>): Promise<Pedido> {
    const { data, error } = await getDb()
      .from("pedidos")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar pedido");
    return data as Pedido;
  },
};
