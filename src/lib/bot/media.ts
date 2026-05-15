import { getMetaConfig } from "@/lib/meta";

interface MediaDownloadResult {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

/**
 * Descarga un archivo de la API de Meta.
 *
 * WhatsApp: envia un media_id que primero hay que resolver a URL
 *   GET https://graph.facebook.com/v21.0/{media-id} -> { url }
 *   GET url con Authorization header -> binary
 *
 * Instagram/Facebook: envia URL directa del attachment
 */
export async function downloadMetaMedia(
  mediaIdOrUrl: string,
  canal: string
): Promise<MediaDownloadResult | null> {
  try {
    const config = await getMetaConfig();
    let downloadUrl: string;
    let mimeType = "application/octet-stream";

    if (canal === "whatsapp") {
      // Paso 1: Obtener URL real del media
      const mediaInfoRes = await fetch(
        `https://graph.facebook.com/v21.0/${mediaIdOrUrl}`,
        {
          headers: { Authorization: `Bearer ${config.pageAccessToken}` },
        }
      );

      if (!mediaInfoRes.ok) {
        console.error(
          "Error fetching media info:",
          await mediaInfoRes.text()
        );
        return null;
      }

      const mediaInfo = await mediaInfoRes.json();
      downloadUrl = mediaInfo.url;
      mimeType = mediaInfo.mime_type || mimeType;
    } else {
      // Instagram/Facebook: URL directa
      downloadUrl = mediaIdOrUrl;
    }

    if (!downloadUrl) return null;

    // Paso 2: Descargar el archivo
    const downloadRes = await fetch(downloadUrl, {
      headers:
        canal === "whatsapp"
          ? { Authorization: `Bearer ${config.pageAccessToken}` }
          : {},
    });

    if (!downloadRes.ok) {
      console.error("Error downloading media:", downloadRes.status);
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determinar extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "image/svg+xml": "svg",
    };
    const ext = extMap[mimeType] || "bin";
    const fileName = `diseno_${Date.now()}.${ext}`;

    return { buffer, mimeType, fileName };
  } catch (error) {
    console.error("downloadMetaMedia error:", error);
    return null;
  }
}
