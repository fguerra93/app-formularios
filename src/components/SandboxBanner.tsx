import { IS_SANDBOX } from "@/lib/runtime";

// Top strip shown only in sandbox/demo mode so it is always obvious that
// payments are simulated and no real money is charged. Rendered in normal
// flow (not fixed) so it simply pushes the rest of the page down.
export function SandboxBanner() {
  if (!IS_SANDBOX) return null;

  return (
    <div
      role="status"
      className="w-full bg-amber-400 text-amber-950 text-center text-xs sm:text-sm font-semibold px-3 py-2"
    >
      MODO DEMOSTRACIÓN — los pagos son de prueba, no se cobra dinero real.
    </div>
  );
}
