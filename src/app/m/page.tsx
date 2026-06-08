import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DuenoDashboard } from "./dueno-dashboard";

export const dynamic = "force-dynamic";

const ROLES_DUENO = ["admin", "vendedor"];

export default async function MPage() {
  const session = await getSession();
  const autorizado = session && ROLES_DUENO.includes(session.rol);

  if (!autorizado) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#00b4d8]">PrintUp · Dueño</p>
          <h1 className="mb-2 text-xl font-extrabold">Panel del dueño</h1>
          <p className="mb-6 text-sm text-white/60">
            Inicia sesión para ver aprobaciones, ventas del día y el estado del taller.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#00b4d8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#009ec0]"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return <DuenoDashboard usuario={session!.sub} />;
}
