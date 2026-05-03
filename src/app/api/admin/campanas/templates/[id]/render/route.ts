import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { renderTemplateToHtml } from "@/lib/email-template-renderer";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // We accept the template id in the URL for context, but the actual
  // rendering is done from the contenido_json sent in the body, so
  // the caller can preview changes before saving.
  await params; // consume params to avoid Next.js warning

  const body = await request.json();
  const { contenido_json } = body;

  if (!contenido_json || !Array.isArray(contenido_json)) {
    return NextResponse.json(
      { error: "contenido_json debe ser un array de bloques" },
      { status: 400 }
    );
  }

  try {
    const html = renderTemplateToHtml(contenido_json);
    return NextResponse.json({ html });
  } catch (e) {
    console.error("Error rendering template:", e);
    return NextResponse.json(
      { error: "Error al renderizar template" },
      { status: 500 }
    );
  }
}
