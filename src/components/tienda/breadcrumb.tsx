import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-[#5b6472] mb-6 flex-wrap">
      <Link href="/" className="hover:text-[#0f1115] transition-colors">
        Inicio
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="size-3.5" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[#0f1115] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#0f1115] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
