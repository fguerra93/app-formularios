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
    <div className="flex items-center gap-2">
      <span className={`font-bold text-[#1B2A6B] ${sizeClasses[size]}`}>
        {formatCLP(displayPrice)}
      </span>
      {hasOffer && (
        <span className={`text-[#64748B] line-through ${size === "lg" ? "text-base" : "text-sm"}`}>
          {formatCLP(precio)}
        </span>
      )}
    </div>
  );
}
