import Link from "next/link";
import { getSession } from "@/lib/auth";
import { TallerBoard } from "./taller-board";

export const dynamic = "force-dynamic";

const ROLES_TALLER = ["admin", "bodega"];

export default async function TallerPage() {
  const session = await getSession();
  const autorizado = session && ROLES_TALLER.includes(session.rol);

  if (!autorizado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00b4d8] mb-2">
            PrintUp · Taller
          </p>
          <h1 className="text-xl font-extrabold mb-2">Comanda de taller</h1>
          <p className="text-sm text-white/60 mb-6">
            Inicia sesión con tu cuenta de taller (rol bodega) para ver la cola de
            producción en tiempo real.
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

  return <TallerBoard operador={session!.sub} />;
}
