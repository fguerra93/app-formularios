import webpush from "web-push";
import { pushSubscriptionsRepo } from "@/server/repositories";

/**
 * Web Push (Fase F6) con VAPID. Las claves viven en env (VAPID_PUBLIC_KEY,
 * VAPID_PRIVATE_KEY, VAPID_SUBJECT). Si no están configuradas, las funciones de
 * envío hacen **no-op** (degradación elegante): la app del dueño sigue
 * funcionando sin push hasta que se configuren las claves en prod.
 *
 * Generar claves una vez:  npx web-push generate-vapid-keys
 */
let configured = false;
function configurar(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contacto@printup.cl";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export function vapidPublicKey(): string {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export type PreferenciaPush = "aprobaciones" | "margen" | "stock" | "op";

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
}

/** Envía un push a todas las suscripciones (respetando preferencias). */
export async function enviarPushATodos(
  payload: PushPayload,
  pref?: PreferenciaPush
): Promise<{ enviados: number; podados: number }> {
  if (!configurar()) {
    console.warn("Web Push sin VAPID configurado (no-op).");
    return { enviados: 0, podados: 0 };
  }

  let subs: Record<string, unknown>[];
  try {
    subs = await pushSubscriptionsRepo.listAll();
  } catch {
    return { enviados: 0, podados: 0 };
  }

  const data = JSON.stringify(payload);
  let enviados = 0;
  let podados = 0;

  for (const s of subs) {
    const prefs = (s.preferencias as Record<string, boolean> | null) || {};
    if (pref && prefs[pref] === false) continue;
    try {
      await webpush.sendNotification(
        {
          endpoint: String(s.endpoint),
          keys: { p256dh: String(s.p256dh), auth: String(s.auth) },
        },
        data
      );
      enviados++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      // 404/410 = suscripción muerta -> podar.
      if (code === 404 || code === 410) {
        try {
          await pushSubscriptionsRepo.removeByEndpoint(String(s.endpoint));
          podados++;
        } catch {
          /* ignore */
        }
      } else {
        console.error("push send error:", (e as Error)?.message || e);
      }
    }
  }
  return { enviados, podados };
}

/* ── Conveniencias por tipo de alerta (las llaman los flujos del negocio) ── */
export const pushNuevaAprobacion = (titulo: string) =>
  enviarPushATodos(
    { title: "Nueva aprobación pendiente", body: titulo, url: "/m", tag: "aprobacion" },
    "aprobaciones"
  );

export const pushMargenBajo = (texto: string) =>
  enviarPushATodos({ title: "Alerta de margen", body: texto, url: "/m", tag: "margen" }, "margen");

export const pushStockCritico = (texto: string) =>
  enviarPushATodos({ title: "Stock crítico", body: texto, url: "/m", tag: "stock" }, "stock");

export const pushOpAtascada = (texto: string) =>
  enviarPushATodos({ title: "OP atascada en el taller", body: texto, url: "/m", tag: "op" }, "op");
