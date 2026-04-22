import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "printup-secret-change-in-production"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page and auth API routes
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/upload")
  ) {
    return NextResponse.next();
  }

  // Protect /admin/* pages and /api/* admin routes
  if (pathname.startsWith("/admin") || isProtectedApi(pathname)) {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      await jwtVerify(token, SECRET);
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
  const protectedPaths = ["/api/formularios", "/api/stats", "/api/config"];
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export const config = {
  matcher: ["/admin/:path*", "/api/formularios/:path*", "/api/stats/:path*", "/api/config/:path*"],
};
