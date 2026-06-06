import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { whatsappRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const estado = searchParams.get("estado");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let conversaciones;
  let count;
  try {
    const result = await whatsappRepo.listConversaciones({ estado, offset, limit });
    conversaciones = result.data;
    count = result.count;
  } catch (e) {
    console.error("Error fetching conversaciones:", e);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }

  // Get message counts for each conversation
  const conversacionesConConteo = await Promise.all(
    conversaciones.map(async (conv) => {
      const mensajesCount = await whatsappRepo.countMensajes(conv.id as string);
      const ultimoMensaje = await whatsappRepo.ultimoMensaje(conv.id as string);

      return {
        ...conv,
        mensajes_count: mensajesCount || 0,
        ultimo_mensaje: ultimoMensaje || null,
      };
    })
  );

  return NextResponse.json({
    data: conversacionesConConteo,
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
