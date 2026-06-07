import { NextResponse } from "next/server";
import { CLIENTE_COOKIE } from "@/lib/auth-cliente";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(CLIENTE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
