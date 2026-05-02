import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1B2A6B] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1: Brand */}
        <div>
          <span
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #FFFFFF, #00B4D8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            PrintUp
          </span>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            Tu impresion, nuestra huella. Servicios de impresion y publicidad en Donihue, Region de O&apos;Higgins.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://www.facebook.com/printup.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Facebook"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/printup.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Instagram"
            >
              <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Col 2: Links */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Links Rapidos</h3>
          <ul className="space-y-2.5">
            <li>
              <Link href="/productos" className="text-sm text-white/70 hover:text-white transition-colors">
                Productos
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="text-sm text-white/70 hover:text-white transition-colors">
                Contacto
              </Link>
            </li>
            <li>
              <Link href="/contacto" className="text-sm text-white/70 hover:text-white transition-colors">
                Sube tu Archivo
              </Link>
            </li>
            <li>
              <Link href="/carrito" className="text-sm text-white/70 hover:text-white transition-colors">
                Mi Carrito
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Info */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Informacion</h3>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2 text-sm text-white/70">
              <Clock className="size-4 mt-0.5 shrink-0" />
              Lunes a Viernes: 9:00 - 18:00
            </li>
            <li className="flex items-start gap-2 text-sm text-white/70">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              Errazuriz 09 / Francisco Lira 082, Donihue
            </li>
            <li className="text-sm text-white/70">
              Despachos: Miercoles y Viernes
            </li>
            <li className="text-sm text-white/70">
              Envio gratis sobre $50.000
            </li>
          </ul>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Contacto</h3>
          <ul className="space-y-2.5">
            <li>
              <a
                href="mailto:contacto@printup.cl"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Mail className="size-4 shrink-0" />
                contacto@printup.cl
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/56966126645"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                <Phone className="size-4 shrink-0" />
                +56 9 66126645
              </a>
            </li>
            <li className="flex items-start gap-2 text-sm text-white/70">
              <MapPin className="size-4 mt-0.5 shrink-0" />
              Region de O&apos;Higgins, Chile
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-white/50">
          &copy; 2026 PrintUp - Servicios Graficos Spa - RUT 78.114.353-7
        </div>
      </div>
    </footer>
  );
}
