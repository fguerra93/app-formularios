/**
 * Logo oficial de PrintUp (printup.cl) — archivo de marca real.
 * El tamaño se controla con `className` (alto + w-auto). Los props `tinta` y
 * `conTagline` se conservan por compatibilidad con los llamadores; sobre fondo
 * oscuro, envolver el logo en un contenedor claro (ver footer).
 */
export function Logo({
  className,
}: {
  tinta?: string;
  className?: string;
  conTagline?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/img/logo-printup.gif"
      alt="PrintUp — Tu impresión, nuestra huella"
      width={1200}
      height={335}
      className={className}
    />
  );
}
