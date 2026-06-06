import { configuracionRepo } from "@/server/repositories";
import { createHmac, timingSafeEqual } from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetaConfig {
  pageAccessToken: string;
  pageId: string;
  igAccountId: string;
  appSecret: string;
  whatsappPhoneNumberId: string;
}

interface MetaApiResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
}

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

/**
 * Reads Meta / WhatsApp / Instagram configuration keys from the
 * `configuracion` table in Supabase.
 */
export async function getMetaConfig(): Promise<MetaConfig> {
  const keys = [
    "meta_page_access_token",
    "meta_page_id",
    "meta_ig_account_id",
    "meta_app_secret",
    "meta_whatsapp_phone_number_id",
  ];

  const map = await configuracionRepo.getMany(keys);

  return {
    pageAccessToken: map["meta_page_access_token"] || "",
    pageId: map["meta_page_id"] || "",
    igAccountId: map["meta_ig_account_id"] || "",
    appSecret: map["meta_app_secret"] || "",
    whatsappPhoneNumberId: map["meta_whatsapp_phone_number_id"] || "",
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

/**
 * Verifies the `X-Hub-Signature-256` header sent by Meta on every webhook
 * POST request.  Returns `true` when the signature is valid.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  appSecret: string
): boolean {
  if (!signature || !appSecret) return false;

  const expectedSignature =
    "sha256=" +
    createHmac("sha256", appSecret).update(body).digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Buffers have different lengths – signature is invalid
    return false;
  }
}

// ---------------------------------------------------------------------------
// Channel-specific send functions
// ---------------------------------------------------------------------------

/**
 * Sends a text message via the WhatsApp Cloud API.
 *
 * Endpoint: POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  accessToken: string,
  phoneNumberId?: string
): Promise<MetaApiResponse> {
  const config = phoneNumberId ? { whatsappPhoneNumberId: phoneNumberId } : await getMetaConfig();
  const numId = phoneNumberId || config.whatsappPhoneNumberId;

  if (!numId || !accessToken) {
    return { ok: false, error: "Missing WhatsApp phone number ID or access token" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${numId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("WhatsApp API error:", data);
      return { ok: false, error: data?.error?.message || "WhatsApp API error" };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("sendWhatsAppMessage error:", err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Sends a text message via the Instagram Messaging API.
 *
 * Endpoint: POST https://graph.facebook.com/v21.0/{igAccountId}/messages
 */
export async function sendInstagramMessage(
  recipientId: string,
  message: string,
  accessToken: string,
  igAccountId?: string
): Promise<MetaApiResponse> {
  const id = igAccountId || (await getMetaConfig()).igAccountId;

  if (!id || !accessToken) {
    return { ok: false, error: "Missing Instagram account ID or access token" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Instagram API error:", data);
      return { ok: false, error: data?.error?.message || "Instagram API error" };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("sendInstagramMessage error:", err);
    return { ok: false, error: String(err) };
  }
}

/**
 * Sends a text message via the Facebook Messenger Platform.
 *
 * Endpoint: POST https://graph.facebook.com/v21.0/me/messages
 */
export async function sendFacebookMessage(
  recipientId: string,
  message: string,
  accessToken: string
): Promise<MetaApiResponse> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token" };
  }

  try {
    const res = await fetch(
      "https://graph.facebook.com/v21.0/me/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error("Facebook Messenger API error:", data);
      return { ok: false, error: data?.error?.message || "Facebook API error" };
    }

    return { ok: true, data };
  } catch (err) {
    console.error("sendFacebookMessage error:", err);
    return { ok: false, error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// Unified send function
// ---------------------------------------------------------------------------

/**
 * Sends a message through the appropriate Meta channel API.
 *
 * @param canal       - "whatsapp" | "instagram" | "facebook"
 * @param contactoId  - Phone number (WhatsApp) or PSID / IGSID (FB / IG)
 * @param message     - Plain text message body
 */
export async function sendMessageByChannel(
  canal: string,
  contactoId: string,
  message: string
): Promise<MetaApiResponse> {
  const config = await getMetaConfig();

  if (!config.pageAccessToken) {
    return { ok: false, error: "No Meta access token configured" };
  }

  switch (canal) {
    case "whatsapp":
      return sendWhatsAppMessage(
        contactoId,
        message,
        config.pageAccessToken,
        config.whatsappPhoneNumberId
      );

    case "instagram":
      return sendInstagramMessage(
        contactoId,
        message,
        config.pageAccessToken,
        config.igAccountId
      );

    case "facebook":
      return sendFacebookMessage(
        contactoId,
        message,
        config.pageAccessToken
      );

    default:
      return { ok: false, error: `Canal no soportado: ${canal}` };
  }
}
