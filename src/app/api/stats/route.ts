import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const authenticated = await verifyAuth();
  if (!authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).toISOString();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Count formularios created today
  const { count: hoy } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  // Count formularios created this month
  const { count: mes } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  // Count total formularios
  const { count: total } = await supabase
    .from("formularios")
    .select("*", { count: "exact", head: true });

  // Email success rate
  const { count: emailsTotal } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true });

  const { count: emailsExitosos } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .eq("estado", "enviado");

  const tasa_exito =
    emailsTotal && emailsTotal > 0
      ? Math.round(((emailsExitosos || 0) / emailsTotal) * 100)
      : 100;

  // Emails sent today (for Resend free tier limit)
  const { count: emailsHoy } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart);

  // Emails sent this month
  const { count: emailsMes } = await supabase
    .from("email_log")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  const emails_restantes_dia = 100 - (emailsHoy || 0);
  const emails_restantes_mes = 3000 - (emailsMes || 0);

  // Last 7 days with count per day
  const diarios: { fecha: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i
    );
    const dayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i + 1
    );

    const { count: dayCount } = await supabase
      .from("formularios")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart.toISOString())
      .lt("created_at", dayEnd.toISOString());

    diarios.push({
      fecha: dayStart.toISOString().split("T")[0],
      count: dayCount || 0,
    });
  }

  return NextResponse.json({
    hoy: hoy || 0,
    mes: mes || 0,
    total: total || 0,
    emails_restantes_dia,
    emails_restantes_mes,
    tasa_exito,
    diarios,
  });
}
