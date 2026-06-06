import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { campanasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Get campaign stats
  const campana = await campanasRepo.findCampanaStats(id);

  if (!campana) {
    return NextResponse.json(
      { error: "Campana no encontrada" },
      { status: 404 }
    );
  }

  // Get envios list
  let envios;
  try {
    envios = await campanasRepo.listEnvios(id);
  } catch (e) {
    console.error("Error fetching envios:", e);
    return NextResponse.json(
      { error: "Error al obtener estadisticas" },
      { status: 500 }
    );
  }

  // Calculate rates
  const totalEnviados = (campana.total_enviados as number) || 0;
  const totalDestinatarios = (campana.total_destinatarios as number) || 0;
  const tasaApertura =
    totalEnviados > 0
      ? (((campana.total_abiertos as number) || 0) / totalEnviados) * 100
      : 0;
  const tasaClick =
    totalEnviados > 0
      ? (((campana.total_clicks as number) || 0) / totalEnviados) * 100
      : 0;
  const tasaError =
    totalDestinatarios > 0
      ? (((campana.total_errores as number) || 0) / totalDestinatarios) * 100
      : 0;

  return NextResponse.json({
    campana,
    stats: {
      tasa_apertura: Math.round(tasaApertura * 100) / 100,
      tasa_click: Math.round(tasaClick * 100) / 100,
      tasa_error: Math.round(tasaError * 100) / 100,
    },
    envios,
  });
}
