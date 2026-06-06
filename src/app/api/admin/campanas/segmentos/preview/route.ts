import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { clientesRepo, newsletterRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const tipo = searchParams.get("tipo") || "todos";

  let total = 0;
  let preview: { email: string; nombre: string }[] = [];

  if (tipo === "todos") {
    // Count all active newsletter subscribers
    total = await newsletterRepo.countActivos();

    // Get first 5 for preview
    const data = await newsletterRepo.listActivosEmailNombre(5);

    preview = data.map((s) => ({
      email: s.email,
      nombre: s.nombre || "",
    }));
  } else if (tipo === "clientes") {
    // Count all clientes with email
    total = await clientesRepo.countConEmail();

    // Get first 5 for preview
    const data = await clientesRepo.listConEmail(5);

    preview = data
      .filter((c) => c.email)
      .map((c) => ({
        email: c.email,
        nombre: c.nombre || "",
      }));
  } else if (tipo === "custom") {
    // For custom, just return 0 - the frontend will have the emails list
    total = 0;
    preview = [];
  }

  return NextResponse.json({ total, preview });
}
