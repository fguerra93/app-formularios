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
  precios_cantidad: PrecioCantidad[];
  ficha_tecnica_url: string | null;
  // Price calculator fields (for m² products)
  precio_m2?: number | null;
  ancho_max_cm?: number | null;
  alto_max_cm?: number | null;
  area_min_cm2?: number | null;
  materiales_calculadora?: { nombre: string; multiplicador: number }[];
  acabados_calculadora?: { nombre: string; precioExtra: number }[];
  // What's included (e.g. ["Base aluminio", "Varilla telescopica", "Bolso de transporte"])
  incluye?: string[];
  // Uses & applications (e.g. ["Ferias y eventos", "Stands de venta"])
  usos?: string[];
  // Key characteristics (e.g. ["Impresion en alta resolucion 1440dpi", "Material resistente UV"])
  caracteristicas?: string[];
  // Extended specs
  especificaciones?: { label: string; value: string }[];
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
  /** Archivos de diseño subidos por el cliente (PNG/PDF). Cada lote = 1 línea. */
  archivos?: ArchivoDiseno[];
}

export interface ArchivoDiseno {
  nombre: string;
  tipo: string; // MIME
  preview: string | null; // dataURL miniatura (PNG); null para PDF
  nota?: string; // talla / color / observación por archivo
}

// Fase 4: Cupones
export interface Cupon {
  id: string;
  codigo: string;
  tipo: "porcentaje" | "monto_fijo";
  valor: number;
  minimo_compra: number;
  maximo_descuento: number | null;
  usos_maximos: number | null;
  usos_actuales: number;
  fecha_inicio: string;
  fecha_expiracion: string | null;
  activo: boolean;
  aplica_a: "todo" | "categoria" | "producto";
  aplica_ids: string[];
  created_at: string;
}

// Fase 4: Reviews
export interface Review {
  id: string;
  producto_id: string;
  pedido_id: string | null;
  cliente_id: string | null;
  autor_nombre: string;
  autor_email: string;
  rating: number;
  titulo: string | null;
  comentario: string | null;
  fotos: { url: string; alt: string }[];
  verificada: boolean;
  aprobada: boolean;
  created_at: string;
}

// Fase 5: Clientes
export interface Cliente {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  rut: string | null;
  direccion_default: DireccionEnvio | null;
  preferencias: { newsletter: boolean; notificaciones: boolean };
  created_at: string;
  updated_at: string;
}

// Fase 5: Precios por cantidad
export interface PrecioCantidad {
  cantidad_min: number;
  cantidad_max: number | null;
  precio: number;
}

// Fase 5: Notificaciones de stock
export interface NotificacionStock {
  id: string;
  producto_id: string;
  email: string;
  notificado: boolean;
  created_at: string;
}

// Fase 5: Carrito Guardado
export interface CarritoGuardado {
  id: string;
  cliente_id: string;
  items: ItemCarrito[];
  cupon_codigo: string | null;
  email_enviado: boolean;
  email_enviado_at: string | null;
  recuperado: boolean;
  created_at: string;
  updated_at: string;
}

// Fase 5: WhatsApp Bot
export interface ConversacionWhatsApp {
  id: string;
  whatsapp_phone: string;
  cliente_id: string | null;
  estado: "activa" | "escalada" | "cerrada";
  ultimo_mensaje_at: string;
  contexto: Record<string, unknown>;
  created_at: string;
}

export interface MensajeWhatsApp {
  id: string;
  conversacion_id: string;
  direccion: "entrante" | "saliente";
  tipo: "texto" | "imagen" | "documento" | "audio" | "interactivo" | "template";
  contenido: string;
  metadata: Record<string, unknown>;
  procesado_por: "bot" | "ia" | "humano";
  created_at: string;
}

export interface CotizacionWhatsApp {
  id: string;
  conversacion_id: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  producto_tipo: string | null;
  cantidad: number | null;
  tiene_diseno: boolean | null;
  urgencia: string | null;
  estimado_precio: number | null;
  estado: "pendiente" | "respondida" | "convertida";
  notas: string | null;
  created_at: string;
}

// Fase 6: Portafolio
export interface Trabajo {
  id: string;
  titulo: string;
  descripcion: string | null;
  cliente_nombre: string | null;
  categoria: string | null;
  imagenes: { url: string; alt: string; orden: number }[];
  destacado: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
}

export interface ClienteDestacado {
  id: string;
  nombre: string;
  logo_url: string;
  url_web: string | null;
  orden: number;
  activo: boolean;
}

// Fase 6: Preguntas de producto
export interface PreguntaProducto {
  id: string;
  producto_id: string;
  cliente_id: string | null;
  autor_nombre: string;
  autor_email: string;
  pregunta: string;
  respuesta: string | null;
  respuesta_at: string | null;
  publica: boolean;
  created_at: string;
}

// Fase 6: Newsletter
export interface Suscriptor {
  id: string;
  email: string;
  nombre: string | null;
  activo: boolean;
  fuente: string;
  created_at: string;
}
