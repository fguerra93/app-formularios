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

  try {
    const { data, count } = await whatsappRepo.listCotizaciones({ estado, offset, limit });
    return NextResponse.json({
      data,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    console.error("Error fetching cotizaciones:", e);
    return NextResponse.json(
      { error: "Error al obtener cotizaciones" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, estado, notas } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el id de la cotizacion" },
        { status: 400 }
      );
    }

    if (!estado) {
      return NextResponse.json(
        { error: "Se requiere el estado" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      estado,
      updated_at: new Date().toISOString(),
    };

    if (notas !== undefined) {
      updateData.notas = notas;
    }

    const data = await whatsappRepo.updateCotizacion(id, updateData);

    if (!data) {
      console.error("Error updating cotizacion");
      return NextResponse.json(
        { error: "Error al actualizar cotizacion" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Cotizaciones PATCH error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
