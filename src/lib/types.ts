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
