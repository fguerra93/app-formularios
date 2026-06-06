import { NextRequest, NextResponse } from "next/server";
import { campanasRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

// 1x1 transparent GIF as a Buffer
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ envioId: string }> }
) {
  const { envioId } = await params;

  // Update tracking in the background - don't block the response
  try {
    // Only update if not already tracked as opened
    const envio = await campanasRepo.getEnvio(envioId);

    if (envio && envio.estado !== "abierto" && envio.estado !== "click") {
      await campanasRepo.updateEnvio(envioId, {
        estado: "abierto",
        abierto_at: new Date().toISOString(),
      });

      // Increment the campaign's total_abiertos counter
      const campana = await campanasRepo.getContadores(envio.campana_id);

      if (campana) {
        await campanasRepo.updateCampana(envio.campana_id, {
          total_abiertos: (campana.total_abiertos || 0) + 1,
        });
      }
    }
  } catch (e) {
    console.error("Error tracking open:", e);
  }

  // Always return the tracking pixel
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
