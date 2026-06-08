import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import {
  productosRepo,
  bomRepo,
  insumosRepo,
  preciosProveedorRepo,
} from "@/server/repositories";
import {
  calcularRentabilidad,
  detectarAlertasInsumos,
  type BomRow,
  type InsumoMin,
} from "@/server/services/costos";

export const dynamic = "force-dynamic";

/** Tablero de rentabilidad por producto + alertas de sobreprecio de insumos. */
export async function GET(request: NextRequest) {
  if (!(await verifyAuth())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const umbral = Number(request.nextUrl.searchParams.get("umbral")) || 15;

  try {
    const [productos, bom, insumos, precios] = await Promise.all([
      productosRepo.listBasico(),
      bomRepo.listAll(),
      insumosRepo.listAll(),
      preciosProveedorRepo.listAll(),
    ]);

    const insumosMin: InsumoMin[] = insumos.map((i) => ({
      id: String(i.id),
      nombre: String(i.nombre),
      costo_actual: Number(i.costo_actual) || 0,
    }));
    const bomRows: BomRow[] = bom.map((b) => ({
      producto_id: String(b.producto_id),
      insumo_id: String(b.insumo_id),
      cantidad: Number(b.cantidad) || 0,
    }));
    const preciosHist = precios.map((p) => ({
      insumo_id: String(p.insumo_id),
      precio: Number(p.precio) || 0,
    }));

    const rentabilidad = calcularRentabilidad(
      productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        precio_oferta: p.precio_oferta,
      })),
      bomRows,
      insumosMin
    );
    const alertas = detectarAlertasInsumos(insumosMin, preciosHist, umbral);

    return NextResponse.json({ rentabilidad, alertas, umbral });
  } catch (e) {
    console.error("Error costos:", e);
    return NextResponse.json({ error: "Error al calcular costos" }, { status: 500 });
  }
}
