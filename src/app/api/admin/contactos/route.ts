import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

interface Contacto {
  nombre: string;
  email: string;
  telefono: string | null;
  pedidos_count: number;
  formularios_count: number;
  ultimo_contacto: string;
}

export async function GET(request: NextRequest) {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");

  // Get clients from pedidos
  let pedidosQuery = supabase
    .from("pedidos")
    .select("cliente_nombre, cliente_email, cliente_telefono, created_at");

  if (search) {
    pedidosQuery = pedidosQuery.or(`cliente_nombre.ilike.%${search}%,cliente_email.ilike.%${search}%`);
  }

  const { data: pedidos } = await pedidosQuery;

  // Get contacts from formularios
  let formQuery = supabase
    .from("formularios")
    .select("nombre, email, telefono, created_at");

  if (search) {
    formQuery = formQuery.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: formularios } = await formQuery;

  // Merge by email
  const contactMap = new Map<string, Contacto>();

  for (const p of pedidos || []) {
    const key = p.cliente_email.toLowerCase();
    const existing = contactMap.get(key);
    if (existing) {
      existing.pedidos_count++;
      if (p.created_at > existing.ultimo_contacto) {
        existing.ultimo_contacto = p.created_at;
      }
      if (!existing.telefono && p.cliente_telefono) {
        existing.telefono = p.cliente_telefono;
      }
    } else {
      contactMap.set(key, {
        nombre: p.cliente_nombre,
        email: p.cliente_email,
        telefono: p.cliente_telefono,
        pedidos_count: 1,
        formularios_count: 0,
        ultimo_contacto: p.created_at,
      });
    }
  }

  for (const f of formularios || []) {
    const key = f.email.toLowerCase();
    const existing = contactMap.get(key);
    if (existing) {
      existing.formularios_count++;
      if (f.created_at > existing.ultimo_contacto) {
        existing.ultimo_contacto = f.created_at;
      }
      if (!existing.telefono && f.telefono) {
        existing.telefono = f.telefono;
      }
    } else {
      contactMap.set(key, {
        nombre: f.nombre,
        email: f.email,
        telefono: f.telefono,
        pedidos_count: 0,
        formularios_count: 1,
        ultimo_contacto: f.created_at,
      });
    }
  }

  const contactos = Array.from(contactMap.values()).sort(
    (a, b) => new Date(b.ultimo_contacto).getTime() - new Date(a.ultimo_contacto).getTime()
  );

  return NextResponse.json(contactos);
}
