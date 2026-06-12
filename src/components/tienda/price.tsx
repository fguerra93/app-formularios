import { formatCLP } from "@/lib/format";

interface PriceProps {
  precio: number;
  precioOferta?: number | null;
  size?: "sm" | "md" | "lg";
}

export function Price({ precio, precioOferta, size = "md" }: PriceProps) {
  const hasOffer = precioOferta !== null && precioOferta !== undefined && precioOferta < precio;
  const displayPrice = hasOffer ? precioOferta : precio;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className={`mc-price font-extrabold ${sizeClasses[size]}`} style={{ color: "var(--mc-ink)" }}>
        {formatCLP(displayPrice)}
      </span>
      {hasOffer && (
        <span
          className={`mc-price line-through ${size === "lg" ? "text-base" : "text-sm"}`}
          style={{ color: "var(--mc-ink-3)" }}
        >
          {formatCLP(precio)}
        </span>
      )}
    </div>
  );
}
