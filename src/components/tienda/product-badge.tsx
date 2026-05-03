import type { Producto } from "@/lib/types";

export function ProductBadges({ producto }: { producto: Producto }) {
  const badges: { label: string; className: string }[] = [];

  // Nuevo: created_at is within the last 30 days
  const createdAt = new Date(producto.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt >= thirtyDaysAgo) {
    badges.push({
      label: "Nuevo",
      className: "bg-[#FFD100] text-[#1E293B]",
    });
  }

  // Discount percentage
  if (
    producto.precio_oferta !== null &&
    producto.precio_oferta < producto.precio
  ) {
    const pct = Math.round(
      ((producto.precio - producto.precio_oferta) / producto.precio) * 100
    );
    badges.push({
      label: `-${pct}%`,
      className: "bg-[#E91E8C] text-white",
    });
  }

  // Free shipping
  if (producto.precio >= 50000) {
    badges.push({
      label: "Envio Gratis",
      className: "bg-[#00B4D8] text-white",
    });
  }

  // Low stock
  if (producto.stock > 0 && producto.stock <= 5) {
    badges.push({
      label: `Quedan ${producto.stock}`,
      className: "bg-[#F97316] text-white",
    });
  }

  // Out of stock
  if (producto.stock === 0) {
    badges.push({
      label: "Agotado",
      className: "bg-gray-500 text-white",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase leading-tight w-fit ${badge.className}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
