import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative py-20 md:py-28 px-4 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1B2A6B 0%, #00B4D8 50%, #E91E8C 100%)",
      }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative max-w-4xl mx-auto text-center text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4"
          style={{ letterSpacing: "-0.02em" }}
        >
          Tu impresion,
          <br />
          nuestra huella
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
          Impresion y publicidad de calidad en Donihue. Poleras, pendones, stickers,
          bolsas y mas. Todo personalizado con tu marca.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/productos"
            className="px-8 py-3.5 rounded-lg bg-white text-[#1B2A6B] font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
          >
            Ver Productos
          </Link>
          <a
            href="https://wa.me/56966126645?text=Hola%2C%20quiero%20cotizar%20un%20producto"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 rounded-lg bg-white/15 text-white font-bold text-sm hover:bg-white/25 transition-colors border border-white/30"
          >
            Cotizar por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
