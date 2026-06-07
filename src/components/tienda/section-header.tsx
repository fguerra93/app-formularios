import type { ReactNode } from "react";

/**
 * Encabezado de sección minimal: alineado a la izquierda, eyebrow + título
 * fuerte + bajada opcional, con acción opcional a la derecha. Sin subrayados
 * degradados (el tell de IA que reemplaza).
 */
export function SectionHeader({
  eyebrow,
  title,
  sub,
  action,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
      <div>
        {eyebrow && <span className="mc-eyebrow">{eyebrow}</span>}
        <h2 className="mc-h2 mt-2.5">{title}</h2>
        {sub && <p className="mc-sub mt-2 max-w-xl">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
