export interface Formulario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  material: string | null;
  mensaje: string | null;
  archivos: ArchivoInfo[];
  estado: "nuevo" | "revisado" | "completado";
  nextcloud_path: string | null;
  nextcloud_synced: boolean;
  email_enviado: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArchivoInfo {
  nombre: string;
  tamaño: number;
  tipo: string;
  url: string;
}

export interface EmailLog {
  id: string;
  formulario_id: string;
  destinatario: string;
  asunto: string;
  estado: string;
  error: string | null;
  proveedor: string;
  created_at: string;
}

export interface ConfigSistema {
  id: string;
  clave: string;
  valor: string;
  updated_at: string;
}

export interface StatsResponse {
  hoy: number;
  mes: number;
  total: number;
  emails_restantes_dia: number;
  emails_restantes_mes: number;
  tasa_exito: number;
  diarios: { fecha: string; count: number }[];
}

// E-Commerce Types

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  imagen_url: string | null;
  orden: number;
  activa: boolean;
  created_at: string;
}

export interface ImagenProducto {
  url: string;
  alt: string;
  orden: number;
}

export interface OpcionVariante {
  valor: string;
  precio_extra: number;
}

export interface Variante {
  nombre: string;
  opciones: OpcionVariante[];
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  descripcion_corta: string | null;
  precio: number;
  precio_oferta: number | null;
  categoria_id: string | null;
  categoria?: Categoria;
  imagenes: ImagenProducto[];
  variantes: Variante[];
  stock: number;
  stock_minimo: number;
  destacado: boolean;
  activo: boolean;
  tags: string[];
  peso_gramos: number | null;
  sku: string | null;
  created_at: string;
  updated_at: string;
}

export interface DireccionEnvio {
  calle: string;
  numero: string;
  comuna: string;
  ciudad: string;
  region: string;
  notas: string;
}

export interface ItemPedido {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  variante: Record<string, string> | null;
}

export interface Pedido {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string | null;
  cliente_rut: string | null;
  direccion_envio: DireccionEnvio | null;
  tipo_entrega: "retiro_tienda" | "despacho";
  items: ItemPedido[];
  subtotal: number;
  costo_envio: number;
  total: number;
  estado: "pendiente" | "confirmado" | "preparando" | "enviado" | "entregado" | "cancelado";
  pago_estado: "pendiente" | "pagado" | "fallido" | "reembolsado";
  pago_metodo: string | null;
  pago_referencia: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZonaEnvio {
  id: string;
  nombre: string;
  comunas: string[];
  precio: number;
  envio_gratis_desde: number | null;
  activa: boolean;
  dias_despacho: string[] | null;
  horario: string | null;
}

export interface ItemCarrito {
  producto_id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  imagen: string;
  slug: string;
  categoria_slug: string;
  variante: Record<string, string> | null;
  precio_extra: number;
}
