import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { auditRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const data = await auditRepo.list(200);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching audit log:", e);
    return NextResponse.json({ error: "Error al obtener audit log" }, { status: 500 });
  }
}
