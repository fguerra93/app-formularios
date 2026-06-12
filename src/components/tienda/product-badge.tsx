import type { Producto } from "@/lib/types";

export function ProductBadges({ producto }: { producto: Producto }) {
  const badges: { label: string; variant: string }[] = [];

  // Oferta (lo más vendedor primero): porcentaje de descuento, en tinta sólida
  if (
    producto.precio_oferta !== null &&
    producto.precio_oferta < producto.precio
  ) {
    const pct = Math.round(
      ((producto.precio - producto.precio_oferta) / producto.precio) * 100
    );
    badges.push({ label: `-${pct}%`, variant: "mc-badge-solid" });
  }

  // Nuevo: created_at dentro de los últimos 30 días — outline discreto
  const createdAt = new Date(producto.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt >= thirtyDaysAgo) {
    badges.push({ label: "Nuevo", variant: "mc-badge-outline" });
  }

  // Stock bajo — señal ámbar sobria
  if (producto.stock > 0 && producto.stock <= 5) {
    badges.push({ label: `Quedan ${producto.stock}`, variant: "mc-badge-warn" });
  }

  // Agotado — gris apagado
  if (producto.stock === 0) {
    badges.push({ label: "Agotado", variant: "mc-badge-muted" });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {badges.map((badge) => (
        <span key={badge.label} className={`mc-badge ${badge.variant}`}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}
