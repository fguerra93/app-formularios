/**
 * RBAC — control de acceso por rol (Patrón 6). Módulo puro (edge-safe):
 * lo usa el middleware para gatear rutas según el rol del JWT.
 *
 * Roles:
 *  - admin   : acceso total (incluye gestión de usuarios y configuración).
 *  - vendedor: operación de ventas y atención (pedidos, mensajería, campañas...).
 *  - bodega  : inventario y producción.
 *
 * Estrategia: `admin` puede todo. Para los demás roles se protegen las áreas
 * sensibles (solo-admin); el resto del panel queda disponible para roles
 * operativos. La matriz es extensible si se requiere granularidad fina.
 */
export type Rol = "admin" | "vendedor" | "bodega";

/** Prefijos de ruta reservados EXCLUSIVAMENTE al rol admin. */
const SOLO_ADMIN: string[] = [
  "/admin/usuarios",
  "/api/admin/usuarios",
  "/admin/configuracion",
  "/api/config",
];

/** ¿El rol puede acceder a esta ruta? */
export function puedeAcceder(rol: Rol, pathname: string): boolean {
  if (rol === "admin") return true;
  // vendedor / bodega: todo salvo las áreas solo-admin.
  return !SOLO_ADMIN.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith(p));
}
