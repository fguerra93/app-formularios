"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
        aria-label="Reducir cantidad"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold border-x border-[#E2E8F0]">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 transition-colors"
        aria-label="Aumentar cantidad"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
