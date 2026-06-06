import { NextRequest, NextResponse } from "next/server";
import { cuponesRepo } from "@/server/repositories";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { codigo?: string; subtotal?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { valido: false, mensaje: "Body invalido" },
      { status: 400 }
    );
  }

  const { codigo, subtotal } = body;

  if (!codigo || subtotal === undefined || subtotal === null) {
    return NextResponse.json(
      { valido: false, mensaje: "Codigo y subtotal son requeridos" },
      { status: 400 }
    );
  }

  // Buscar cupon por codigo (case-insensitive)
  const cupon = await cuponesRepo.findByCodigo(codigo);

  if (!cupon) {
    return NextResponse.json({
      valido: false,
      descuento: 0,
      mensaje: "Cupon invalido o expirado",
    });
  }

  // Validar que este activo
  if (!cupon.activo) {
    return NextResponse.json({
      valido: false,
      descuento: 0,
      mensaje: "Este cupon ya no esta activo",
    });
  }

  // Validar fecha de inicio
  if (cupon.fecha_inicio) {
    const inicio = new Date(cupon.fecha_inicio);
    if (new Date() < inicio) {
      return NextResponse.json({
        valido: false,
        descuento: 0,
        mensaje: "Este cupon aun no esta vigente",
      });
    }
  }

  // Validar fecha de expiracion
  if (cupon.fecha_expiracion) {
    const expiracion = new Date(cupon.fecha_expiracion);
    if (new Date() > expiracion) {
      return NextResponse.json({
        valido: false,
        descuento: 0,
        mensaje: "Este cupon ha expirado",
      });
    }
  }

  // Validar usos maximos
  if (
    cupon.usos_maximos !== null &&
    cupon.usos_maximos !== undefined &&
    cupon.usos_actuales >= cupon.usos_maximos
  ) {
    return NextResponse.json({
      valido: false,
      descuento: 0,
      mensaje: "Este cupon ha alcanzado su limite de usos",
    });
  }

  // Validar minimo de compra
  if (cupon.minimo_compra && subtotal < cupon.minimo_compra) {
    return NextResponse.json({
      valido: false,
      descuento: 0,
      mensaje: `El minimo de compra para este cupon es $${cupon.minimo_compra.toLocaleString("es-CL")}`,
    });
  }

  // Calcular descuento
  let descuento = 0;
  if (cupon.tipo === "porcentaje") {
    descuento = Math.round(subtotal * cupon.valor / 100);
    // Aplicar tope maximo_descuento si existe
    if (cupon.maximo_descuento && descuento > cupon.maximo_descuento) {
      descuento = cupon.maximo_descuento;
    }
  } else if (cupon.tipo === "monto_fijo") {
    descuento = cupon.valor;
  }

  // El descuento no puede ser mayor que el subtotal
  if (descuento > subtotal) {
    descuento = subtotal;
  }

  return NextResponse.json({
    valido: true,
    descuento,
    mensaje: cupon.tipo === "porcentaje"
      ? `Cupon aplicado: ${cupon.valor}% de descuento`
      : `Cupon aplicado: $${cupon.valor.toLocaleString("es-CL")} de descuento`,
    cupon: {
      id: cupon.id,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
    },
  });
}
