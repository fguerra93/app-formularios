"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { DollarSign, ShoppingBag, FileText, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthGuard } from "@/components/admin/auth-guard";
import { formatCLP } from "@/lib/format";
import type { Formulario } from "@/lib/types";

interface PedidoReciente {
  id: string;
  numero_pedido: number;
  cliente_nombre: string;
  total: number;
  estado: string;
  pago_estado: string;
  created_at: string;
}

interface StatsData {
  // Formularios
  hoy: number;
  mes: number;
  total: number;
  emails_restantes_dia: number;
  emails_restantes_mes: number;
  tasa_exito: number;
  diarios: { fecha: string; count: number }[];
  // Ventas
  ventas_hoy: number;
  pedidos_pendientes: number;
  ingresos_mes: number;
  ventas_diarias: { fecha: string; total: number; count: number }[];
  pedidos_recientes: PedidoReciente[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
  }),
};

function MetricCard({
  title, value, subtitle, icon: Icon, color, index,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string; index: number;
}) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants}>
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1 rounded-l-xl" style={{ backgroundColor: color }} />
        <CardHeader className="flex flex-row items-center justify-between pb-1">
          <CardTitle className="text-sm font-medium" style={{ color: "#64748B" }}>{title}</CardTitle>
          <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}15` }}>
            <Icon className="size-4" style={{ color }} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold" style={{ color: "#1E293B" }}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: "#64748B" }}>{subtitle}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const estadoColors: Record<string, string> = {
  pendiente: "#64748B",
  confirmado: "#00B4D8",
  preparando: "#B8860B",
  enviado: "#7C3AED",
  entregado: "#10B981",
  cancelado: "#EF4444",
  nuevo: "#00B4D8",
  revisado: "#FFD100",
  completado: "#10B981",
};

function DashboardContent() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recientes, setRecientes] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, recientesRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/formularios?limit=5&page=1"),
        ]);
        const statsData: StatsData = await statsRes.json();
        const recientesData = await recientesRes.json();
        setStats(statsData);
        setRecientes(recientesData.data || recientesData || []);
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div><Skeleton className="mb-2 h-8 w-40" /><Skeleton className="h-4 w-64" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-xl" /><Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1E293B" }}>Dashboard</h1>
        <p className="text-sm" style={{ color: "#64748B" }}>Resumen de ventas, pedidos y formularios</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Ventas Hoy"
          value={formatCLP(stats?.ventas_hoy ?? 0)}
          icon={DollarSign}
          color="#1B2A6B"
          index={0}
        />
        <MetricCard
          title="Pedidos Pendientes"
          value={stats?.pedidos_pendientes ?? 0}
          icon={ShoppingBag}
          color="#00B4D8"
          index={1}
        />
        <MetricCard
          title="Formularios Hoy"
          value={stats?.hoy ?? 0}
          icon={FileText}
          color="#E91E8C"
          index={2}
        />
        <MetricCard
          title="Ingresos del Mes"
          value={formatCLP(stats?.ingresos_mes ?? 0)}
          subtitle={`${stats?.emails_restantes_dia ?? 0} emails restantes hoy`}
          icon={TrendingUp}
          color="#FFD100"
          index={3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#1E293B" }}>Ventas - Ultimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.ventas_diarias ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748B" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
                      formatter={(value) => [formatCLP(Number(value)), "Total"]}
                      labelFormatter={(v) => {
                        const d = new Date(String(v));
                        return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                      }}
                    />
                    <Bar dataKey="total" fill="#1B2A6B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle style={{ color: "#1E293B" }}>Formularios - Ultimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.diarios ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 12, fill: "#64748B" }}
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748B" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13 }}
                      labelFormatter={(v) => {
                        const d = new Date(String(v));
                        return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                      }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#E91E8C" strokeWidth={2} dot={{ fill: "#E91E8C", r: 4 }} activeDot={{ r: 6, fill: "#00B4D8" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent pedidos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: "#1E293B" }}>Pedidos recientes</CardTitle>
              <Link href="/admin/pedidos" className="text-sm" style={{ color: "#00B4D8" }}>Ver todos</Link>
            </CardHeader>
            <CardContent>
              {(!stats?.pedidos_recientes || stats.pedidos_recientes.length === 0) ? (
                <p className="py-4 text-center text-sm" style={{ color: "#64748B" }}>No hay pedidos aun.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {stats.pedidos_recientes.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/admin/pedidos/${p.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: "#1E293B" }}>
                            #{p.numero_pedido} - {p.cliente_nombre}
                          </p>
                          <p className="text-xs" style={{ color: "#64748B" }}>
                            {formatCLP(p.total)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${estadoColors[p.estado] || "#64748B"}20`,
                              color: estadoColors[p.estado] || "#64748B",
                            }}
                          >
                            {p.estado}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent formularios */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: "#1E293B" }}>Formularios recientes</CardTitle>
              <Link href="/admin/historial" className="text-sm" style={{ color: "#00B4D8" }}>Ver todos</Link>
            </CardHeader>
            <CardContent>
              {recientes.length === 0 ? (
                <p className="py-4 text-center text-sm" style={{ color: "#64748B" }}>No hay formularios aun.</p>
              ) : (
                <ul className="flex flex-col divide-y">
                  {recientes.map((f) => (
                    <li key={f.id}>
                      <Link
                        href={`/admin/formularios/${f.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-gray-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium" style={{ color: "#1E293B" }}>{f.nombre}</p>
                          <p className="truncate text-xs" style={{ color: "#64748B" }}>{f.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${estadoColors[f.estado] || "#64748B"}20`,
                              color: estadoColors[f.estado] || "#64748B",
                            }}
                          >
                            {f.estado}
                          </span>
                          <span className="whitespace-nowrap text-xs" style={{ color: "#64748B" }}>
                            {new Date(f.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
