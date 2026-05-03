import Link from "next/link";
import { Home, ShoppingBag, MessageCircle, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="text-center max-w-lg">
        {/* 404 gradient text */}
        <h1
          className="text-[8rem] md:text-[10rem] font-extrabold leading-none select-none"
          style={{
            background: "linear-gradient(135deg, #1B2A6B, #00B4D8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </h1>

        <h2
          className="text-2xl md:text-3xl font-extrabold text-[#1E293B] mt-2 mb-3"
          style={{ letterSpacing: "-0.02em" }}
        >
          Pagina no encontrada
        </h2>
        <p className="text-[#64748B] mb-8 max-w-md mx-auto">
          Lo sentimos, la pagina que buscas no existe o fue movida.
        </p>

        {/* Search bar */}
        <form action="/productos" method="get" className="mb-8">
          <div className="flex items-center max-w-sm mx-auto bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm focus-within:border-[#00B4D8] transition-colors">
            <div className="pl-4">
              <Search className="size-4 text-[#64748B]" />
            </div>
            <input
              type="text"
              name="q"
              placeholder="Buscar productos..."
              className="flex-1 px-3 py-3 text-sm outline-none bg-transparent text-[#1E293B] placeholder:text-[#94A3B8]"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-[#1B2A6B] text-white text-sm font-semibold hover:bg-[#152259] transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Navigation links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1B2A6B] to-[#00B4D8] text-white font-bold text-sm hover:opacity-90 transition-opacity w-full sm:w-auto justify-center"
          >
            <Home className="size-4" />
            Inicio
          </Link>
          <Link
            href="/productos"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B] font-bold text-sm hover:border-[#00B4D8] hover:text-[#00B4D8] transition-colors w-full sm:w-auto justify-center"
          >
            <ShoppingBag className="size-4" />
            Productos
          </Link>
          <Link
            href="/contacto"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B] font-bold text-sm hover:border-[#00B4D8] hover:text-[#00B4D8] transition-colors w-full sm:w-auto justify-center"
          >
            <MessageCircle className="size-4" />
            Contacto
          </Link>
        </div>
      </div>
    </div>
  );
}
