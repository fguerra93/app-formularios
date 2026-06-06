import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { campanasRepo, templatesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const estado = searchParams.get("estado");

  try {
    const data = await campanasRepo.listCampanas(estado);
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching campanas:", e);
    return NextResponse.json(
      { error: "Error al obtener campanas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { nombre, asunto, template_id, segmento } = body;

  if (!nombre || !asunto) {
    return NextResponse.json(
      { error: "Nombre y asunto son requeridos" },
      { status: 400 }
    );
  }

  // If template_id is provided, fetch the template HTML
  let contenido_html: string | null = null;
  if (template_id) {
    const template = await templatesRepo.findContenidoHtml(template_id);
    if (template) {
      contenido_html = template.contenido_html;
    }
  }

  try {
    const data = await campanasRepo.createCampana({
      nombre,
      asunto,
      template_id: template_id || null,
      contenido_html,
      segmento: segmento || { tipo: "todos" },
      estado: "borrador",
    });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error("Error creating campana:", e);
    return NextResponse.json(
      { error: "Error al crear campana" },
      { status: 500 }
    );
  }
}
