/**
 * Logo PrintUp vectorial — réplica fiel del original (salpicaduras CMYK +
 * "Print" extra-bold + "Up" itálica fina + tagline), pero en SVG con las
 * fuentes del sitio: nítido a cualquier tamaño (la versión GIF pixelaba el
 * eslogan). `tinta` permite la variante blanca para fondos oscuros.
 */
export function Logo({
  tinta = "#1B2A6B",
  className,
  conTagline = true,
}: {
  tinta?: string;
  className?: string;
  conTagline?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 620 168"
      className={className}
      role="img"
      aria-label="PrintUp — Tu impresión, nuestra huella"
    >
      {/* Salpicaduras de tinta CMYK */}
      <g>
        {/* Amarillo: swash izquierdo */}
        <path
          d="M38 38 C18 30 6 44 14 58 C20 68 34 66 38 58 C44 70 36 88 22 96 C44 96 60 78 56 56 C53 44 47 40 38 38 Z"
          fill="#FFD100"
        />
        <path
          d="M30 104 C16 112 12 130 24 140 C20 124 30 112 44 108 Z"
          fill="#FFD100"
        />
        {/* Cyan: gotas superiores */}
        <path
          d="M96 14 C90 28 96 38 106 38 C116 38 120 26 112 16 C106 9 100 8 96 14 Z"
          fill="#00B4D8"
        />
        <path
          d="M76 30 C64 40 64 56 74 62 C72 48 80 38 90 34 Z"
          fill="#00B4D8"
        />
        <path d="M120 44 C116 52 122 58 128 55 C133 52 130 44 124 42 Z" fill="#00B4D8" />
        {/* Magenta: salpicadura principal */}
        <path
          d="M118 96 C96 88 88 64 102 50 C116 36 142 40 152 56 C160 68 158 84 148 94 C160 92 170 80 172 68 C184 84 176 108 158 116 C170 120 182 114 188 106 C188 126 170 140 150 138 C156 146 166 148 174 146 C162 158 140 158 128 146 C118 136 116 124 122 114 C110 116 102 110 100 102 C106 104 114 102 118 96 Z"
          fill="#E91E8C"
        />
        <path d="M168 36 C162 44 168 52 176 49 C182 46 180 36 173 34 Z" fill="#E91E8C" />
        {/* Negro: trazo de pincel inferior */}
        <path
          d="M18 150 C40 128 76 122 104 132 C90 124 70 122 54 126 C70 112 96 110 114 120 C100 138 70 152 44 154 C34 155 24 154 18 150 Z"
          fill="#0f1115"
        />
      </g>

      {/* Print (extra-bold) + Up (itálica fina) */}
      <text
        x="208"
        y="103"
        fontFamily="var(--font-sans), Arial, sans-serif"
        fontWeight={800}
        fontSize={96}
        letterSpacing="-3"
        fill={tinta}
      >
        Print
      </text>
      <text
        x="452"
        y="103"
        fontFamily="var(--font-sans), Arial, sans-serif"
        fontWeight={300}
        fontStyle="italic"
        fontSize={98}
        fill={tinta}
      >
        Up
      </text>

      {conTagline && (
        <text
          x="212"
          y="146"
          fontFamily="var(--font-sans), Arial, sans-serif"
          fontWeight={600}
          fontSize={30.5}
          letterSpacing="0.2"
          fill={tinta}
        >
          Tu impresión, nuestra huella
        </text>
      )}
    </svg>
  );
}
