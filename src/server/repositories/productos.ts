import { getDb } from "@/server/db";
import type { Producto } from "@/server/domain";

export interface ListProductosOpts {
  categoriaSlug?: string | null;
  destacado?: boolean;
  search?: string | null;
  /** Formato "campo:dir", ej. "precio:asc". Campos: precio | nombre | created_at. */
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ListProductosResult {
  productos: Producto[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductoBusqueda {
  id: string;
  nombre: string;
  slug: string;
  precio: number;
  precio_oferta: number | null;
  imagen: unknown;
  categoria_slug: string | null;
}

/** Acceso a la tabla `productos`. */
export const productosRepo = {
  /** Listado público con filtros, búsqueda, orden y paginación. */
  async listPublic(opts: ListProductosOpts = {}): Promise<ListProductosResult> {
    const db = getDb();
    const page = opts.page && opts.page > 0 ? opts.page : 1;
    const limit = opts.limit && opts.limit > 0 ? opts.limit : 12;
    const offset = (page - 1) * limit;

    let query = db
      .from("productos")
      .select("*, categoria:categorias(*)", { count: "exact" })
      .eq("activo", true);

    if (opts.categoriaSlug) {
      const { data: cat } = await db
        .from("categorias")
        .select("id")
        .eq("slug", opts.categoriaSlug)
        .single();
      if (cat) query = query.eq("categoria_id", cat.id);
    }

    if (opts.destacado) query = query.eq("destacado", true);

    if (opts.search) {
      query = query.or(
        `nombre.ilike.%${opts.search}%,descripcion.ilike.%${opts.search}%,descripcion_corta.ilike.%${opts.search}%`
      );
    }

    const [sortField, sortDir] = (opts.sort || "created_at:desc").split(":");
    const ascending = sortDir === "asc";
    if (sortField === "precio") query = query.order("precio", { ascending });
    else if (sortField === "nombre") query = query.order("nombre", { ascending });
    else query = query.order("created_at", { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      productos: (data as Producto[] | null) ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    };
  },

  /** Productos por lista de ids (usado por el cálculo de pedido server-side). */
  async findByIds(ids: string[]): Promise<Producto[]> {
    if (ids.length === 0) return [];
    const { data } = await getDb().from("productos").select("*").in("id", ids);
    return (data as Producto[] | null) ?? [];
  },

  /** Lista mínima (id, nombre, precio, oferta) para costos/rentabilidad (F4). */
  async listBasico(): Promise<
    { id: string; nombre: string; precio: number; precio_oferta: number | null; activo: boolean }[]
  > {
    const { data, error } = await getDb()
      .from("productos")
      .select("id, nombre, precio, precio_oferta, activo")
      .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      return {
        id: String(row.id),
        nombre: String(row.nombre),
        precio: Number(row.precio) || 0,
        precio_oferta: row.precio_oferta == null ? null : Number(row.precio_oferta),
        activo: row.activo !== false,
      };
    });
  },

  /** Un producto por slug (con su categoría), sin filtrar `activo`. */
  async findBySlug(slug: string): Promise<Producto | null> {
    const { data } = await getDb()
      .from("productos")
      .select("*, categoria:categorias(*)")
      .eq("slug", slug)
      .single();
    return (data as Producto | null) ?? null;
  },

  /** Detalle público: un producto ACTIVO por slug (con su categoría), o null. */
  async findActivoBySlug(slug: string): Promise<Producto | null> {
    const { data } = await getDb()
      .from("productos")
      .select("*, categoria:categorias(*)")
      .eq("slug", slug)
      .eq("activo", true)
      .single();
    return (data as Producto | null) ?? null;
  },

  /** Un producto por id, o null. */
  async findById(id: string): Promise<Producto | null> {
    const { data } = await getDb()
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();
    return (data as Producto | null) ?? null;
  },

  /** Búsqueda pública (autocompletar): nombre/descripción/tags. */
  async searchProductos(term: string, limit = 8): Promise<ProductoBusqueda[]> {
    const { data, error } = await getDb()
      .from("productos")
      .select(
        "id, nombre, slug, precio, precio_oferta, imagenes, categoria_id, categorias(slug)"
      )
      .eq("activo", true)
      .or(`nombre.ilike.%${term}%,descripcion.ilike.%${term}%,tags.cs.{${term}}`)
      .order("destacado", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data || []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      precio: p.precio,
      precio_oferta: p.precio_oferta,
      imagen:
        Array.isArray(p.imagenes) && p.imagenes.length > 0 ? p.imagenes[0] : null,
      categoria_slug: p.categorias
        ? (p.categorias as unknown as { slug: string }).slug
        : null,
    }));
  },

  /**
   * Productos relacionados a un slug (misma categoría → tags → destacados →
   * cualquiera), hasta 4. Devuelve null si el producto base no existe.
   */
  async findRelacionados(
    slug: string
  ): Promise<Record<string, unknown>[] | null> {
    const db = getDb();
    const { data: producto } = await db
      .from("productos")
      .select("id, categoria_id, tags")
      .eq("slug", slug)
      .eq("activo", true)
      .single();

    if (!producto) return null;

    const relacionados: Record<string, unknown>[] = [];
    const idsUsados = new Set<string>([producto.id]);

    if (producto.categoria_id) {
      const { data: mismaCategoria } = await db
        .from("productos")
        .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
        .eq("activo", true)
        .eq("categoria_id", producto.categoria_id)
        .neq("id", producto.id)
        .order("destacado", { ascending: false })
        .limit(4);
      for (const p of mismaCategoria || []) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }

    if (
      relacionados.length < 4 &&
      producto.tags &&
      Array.isArray(producto.tags) &&
      producto.tags.length > 0
    ) {
      const { data: porTags } = await db
        .from("productos")
        .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
        .eq("activo", true)
        .neq("id", producto.id)
        .overlaps("tags", producto.tags)
        .order("destacado", { ascending: false })
        .limit(4);
      for (const p of porTags || []) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }

    if (relacionados.length < 4) {
      const faltan = 4 - relacionados.length;
      const idsExcluir = Array.from(idsUsados);
      const { data: destacados } = await db
        .from("productos")
        .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
        .eq("activo", true)
        .eq("destacado", true)
        .not("id", "in", `(${idsExcluir.join(",")})`)
        .limit(faltan);
      for (const p of destacados || []) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }

    if (relacionados.length < 4) {
      const faltan = 4 - relacionados.length;
      const idsExcluir = Array.from(idsUsados);
      const { data: otros } = await db
        .from("productos")
        .select("id, nombre, slug, precio, precio_oferta, imagenes, categoria_id")
        .eq("activo", true)
        .not("id", "in", `(${idsExcluir.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(faltan);
      for (const p of otros || []) {
        if (!idsUsados.has(p.id) && relacionados.length < 4) {
          idsUsados.add(p.id);
          relacionados.push(p);
        }
      }
    }

    return relacionados;
  },

  // --- Admin ---
  /** Producto por id con su categoría (admin), o null. */
  async findByIdWithCategoria(id: string): Promise<Producto | null> {
    const { data } = await getDb()
      .from("productos")
      .select("*, categoria:categorias(*)")
      .eq("id", id)
      .single();
    return (data as Producto | null) ?? null;
  },

  /** Inserta un producto (valores ya preparados por la ruta admin). */
  async create(values: Record<string, unknown>): Promise<Producto> {
    const { data, error } = await getDb()
      .from("productos")
      .insert(values)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al crear producto");
    return data as Producto;
  },

  /** Actualiza un producto por id. */
  async update(id: string, values: Record<string, unknown>): Promise<Producto> {
    const { data, error } = await getDb()
      .from("productos")
      .update(values)
      .eq("id", id)
      .select()
      .single();
    if (error || !data) throw new Error(error?.message || "Error al actualizar producto");
    return data as Producto;
  },

  /** Baja lógica (activo=false). */
  async softDelete(id: string): Promise<void> {
    const { error } = await getDb()
      .from("productos")
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  /** Productos activos para el sitemap (slug, updated_at, slug de categoría). */
  async listActivosParaSitemap(): Promise<
    { slug: string; updated_at: string; categoria: unknown }[]
  > {
    const { data } = await getDb()
      .from("productos")
      .select("slug, updated_at, categoria:categorias(slug)")
      .eq("activo", true);
    return (data || []) as { slug: string; updated_at: string; categoria: unknown }[];
  },

  /** Productos con control de stock por debajo del umbral (alertas dashboard). */
  async listStockBajo(umbral = 5): Promise<Record<string, unknown>[]> {
    const { data } = await getDb()
      .from("productos")
      .select("id, nombre, slug, stock")
      .eq("activo", true)
      .eq("controla_stock", true)
      .lte("stock", umbral)
      .order("stock", { ascending: true });
    return (data || []) as Record<string, unknown>[];
  },

  /** Productos activos resumidos para el contexto del bot (nombre, precio, stock). */
  async listParaBot(
    limit = 15
  ): Promise<{ nombre: string; precio: number | null; stock: number | null }[]> {
    const { data } = await getDb()
      .from("productos")
      .select("nombre, precio, stock")
      .eq("activo", true)
      .limit(limit);
    return (data || []) as { nombre: string; precio: number | null; stock: number | null }[];
  },
};
