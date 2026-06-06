import { NextRequest, NextResponse } from "next/server";
import { carritosRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron no configurado" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Find abandoned carts: updated more than 24h ago, not emailed, not recovered
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    let carritos;
    try {
      carritos = await carritosRepo.findAbandonados(twentyFourHoursAgo);
    } catch (e) {
      console.error("Error fetching abandoned carts:", e);
      return NextResponse.json(
        { error: "Error al buscar carritos abandonados" },
        { status: 500 }
      );
    }

    if (!carritos || carritos.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: "No hay carritos abandonados para procesar",
      });
    }

    // Mark each cart as email_enviado = true
    // In production, this is where you would send recovery emails via SES/Resend
    const carritoIds = carritos.map((c) => c.id);

    try {
      await carritosRepo.markEmailEnviado(carritoIds);
    } catch (e) {
      console.error("Error updating abandoned carts:", e);
      return NextResponse.json(
        { error: "Error al actualizar carritos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      processed: carritos.length,
      message: `${carritos.length} carritos abandonados marcados para envio de email`,
    });
  } catch (err) {
    console.error("Cron carritos abandonados error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
