// Barrel de repositorios. Las rutas y servicios importan desde aquí:
//   import { productosRepo, pedidosRepo } from "@/server/repositories";
export { productosRepo } from "./productos";
export type {
  ListProductosOpts,
  ListProductosResult,
  ProductoBusqueda,
} from "./productos";
export { pedidosRepo } from "./pedidos";
export type { CrearPedidoInput, PedidoReciente } from "./pedidos";
export { zonasRepo } from "./zonas";
export { configuracionRepo } from "./configuracion";
export { categoriasRepo } from "./categorias";
export { cuponesRepo } from "./cupones";
export { notificacionesStockRepo } from "./notificaciones-stock";
export { clientesRepo } from "./clientes";
export { favoritosRepo } from "./favoritos";
export { statsRepo } from "./stats";
export { reviewsRepo } from "./reviews";
export { preguntasRepo } from "./preguntas";
export { portafolioRepo, clientesDestacadosRepo } from "./portafolio";
export { newsletterRepo } from "./newsletter";
export { formulariosRepo } from "./formularios";
export { storageRepo } from "./storage";
export { carritosRepo } from "./carritos";
export { campanasRepo } from "./campanas";
export { templatesRepo } from "./templates";
export {
  webhookEventosRepo,
  usuariosAdminRepo,
  auditRepo,
} from "./seguridad";
export type { UsuarioAdmin } from "./seguridad";
export { domainEventsRepo } from "./eventos";
export { notificacionesRepo } from "./notificaciones";
export { stockRepo } from "./stock";
export { aprobacionesRepo } from "./aprobaciones";
export type { TipoAprobacion } from "./aprobaciones";
export { planillasRepo } from "./planillas";
export type { Planilla, RangoPrecio } from "./planillas";
export { botCacheRepo } from "./bot-cache";
export { ordenesProduccionRepo } from "./ordenes-produccion";
export { areasDisenoRepo, clipartRepo, fuentesRepo, disenosRepo } from "./designer";
export { tarifasGangSheetRepo, gangSheetsRepo } from "./gang-sheets";
export type { TarifaGangSheet, TramoDescuento } from "./gang-sheets";
export {
  insumosRepo,
  proveedoresRepo,
  preciosProveedorRepo,
  bomRepo,
  ordenesCompraRepo,
} from "./costos";
export { pagosRepo } from "./pagos";
export { whatsappRepo } from "./whatsapp";
export {
  mensajeriaRepo,
  mensajesRapidosRepo,
  respuestasAutomaticasRepo,
} from "./mensajeria";
