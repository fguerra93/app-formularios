"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

interface CartIconProps {
  onClick?: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const { getItemCount } = useCart();
  const count = getItemCount();

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg transition-colors hover:bg-gray-100"
      aria-label={`Carrito (${count} items)`}
    >
      <ShoppingCart className="size-5 text-[#1E293B]" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-[#E91E8C] rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}
