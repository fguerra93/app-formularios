// Runtime mode helpers.
//
// `NEXT_PUBLIC_MODO` controls whether the app runs in demo/sandbox mode
// (payments are simulated, a warning banner is shown) or production.
// It is a NEXT_PUBLIC_ var so it is available both on the server and the client
// (inlined at build time).

export type Modo = "sandbox" | "produccion";

export const MODO: Modo =
  process.env.NEXT_PUBLIC_MODO === "sandbox" ? "sandbox" : "produccion";

/** True when running in the demo/sandbox environment (no real charges). */
export const IS_SANDBOX = MODO === "sandbox";
