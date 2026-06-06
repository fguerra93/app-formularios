import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { rateLimit } from "@/lib/rate-limit";
import { puedeAcceder, type Rol } from "@/lib/rbac";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "printup-admin-secret-key-change-in-production"
);

// --- Rate limiting: endpoints públicos sensibles (Patrón 10) ----------------
interface RateRule {
  key: string;
  limit: number;
  windowMs: number;
}
const WINDOW = 60_000; // 1 min
function matchRateRule(pathname: string): RateRule | null {
  if (pathname.startsWith("/api/auth/login"))
    return { key: "auth", limit: 10, windowMs: WINDOW };
  if (pathname.startsWith("/api/pedidos"))
    return { key: "pedidos", limit: 30, windowMs: WINDOW };
  if (pathname.startsWith("/api/upload") || pathname.startsWith("/api/upload-url"))
    return { key: "upload", limit: 20, windowMs: WINDOW };
  if (pathname.startsWith("/api/pagos/webhook"))
    return { key: "mp-webhook", limit: 60, windowMs: WINDOW };
  if (pathname.startsWith("/api/newsletter"))
    return { key: "newsletter", limit: 10, windowMs: WINDOW };
  return null;
}

function getIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate limiting (aplica a endpoints públicos elegidos, con o sin sesión).
  const rule = matchRateRule(pathname);
  if (rule) {
    const { limited, resetAt } = rateLimit(
      `${rule.key}:${getIp(request)}`,
      rule.limit,
      rule.windowMs
    );
    if (limited) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta más tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  // 2. Rutas públicas / de auth: no requieren sesión.
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/upload") ||
    pathname.startsWith("/api/productos") ||
    pathname.startsWith("/api/categorias") ||
    pathname.startsWith("/api/pedidos") ||
    pathname.startsWith("/api/zonas-envio") ||
    pathname.startsWith("/api/pagos")
  ) {
    return NextResponse.next();
  }

  // 3. Áreas protegidas: /admin/* y APIs admin.
  if (pathname.startsWith("/admin") || isProtectedApi(pathname)) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, SECRET);
      const rol = (payload.rol as Rol) || "admin";

      // RBAC: gatear áreas según rol.
      if (!puedeAcceder(rol, pathname)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }
        // Página fuera de su alcance -> al dashboard.
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

function isProtectedApi(pathname: string): boolean {
  const protectedPaths = ["/api/formularios", "/api/stats", "/api/config", "/api/admin"];
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
