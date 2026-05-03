/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Converts an array of JSON blocks into responsive, table-based HTML
 * suitable for email clients.
 *
 * Block types:
 *   header, texto, imagen, boton, separador, columnas,
 *   producto, cupon, social, footer, espaciador
 */

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderBlock(block: any): string {
  switch (block.tipo) {
    case "header":
      return renderHeader(block);
    case "texto":
      return renderTexto(block);
    case "imagen":
      return renderImagen(block);
    case "boton":
      return renderBoton(block);
    case "separador":
      return renderSeparador(block);
    case "columnas":
      return renderColumnas(block);
    case "producto":
      return renderProducto(block);
    case "cupon":
      return renderCupon(block);
    case "social":
      return renderSocial(block);
    case "footer":
      return renderFooter(block);
    case "espaciador":
      return renderEspaciador(block);
    default:
      return "";
  }
}

function renderHeader(block: any): string {
  const bgColor = block.backgroundColor || "#6366f1";
  const textColor = block.textColor || "#ffffff";
  const titulo = escapeHtml(block.titulo || "");
  const logoUrl = block.logoUrl || "";
  const padding = block.padding || "30px 20px";

  let logoHtml = "";
  if (logoUrl) {
    logoHtml = `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-width:180px;max-height:60px;margin-bottom:10px;" />
      <br />`;
  }

  return `<tr>
  <td align="center" style="background-color:${bgColor};padding:${padding};">
    ${logoHtml}
    <h1 style="margin:0;font-size:${block.fontSize || "28px"};color:${textColor};font-family:Arial,sans-serif;font-weight:bold;">
      ${titulo}
    </h1>
    ${block.subtitulo ? `<p style="margin:8px 0 0;font-size:16px;color:${textColor};opacity:0.9;">${escapeHtml(block.subtitulo)}</p>` : ""}
  </td>
</tr>`;
}

function renderTexto(block: any): string {
  const align = block.align || "left";
  const fontSize = block.fontSize || "16px";
  const color = block.color || "#333333";
  const padding = block.padding || "20px 30px";
  const contenido = block.contenido || block.texto || "";

  return `<tr>
  <td style="padding:${padding};">
    <p style="margin:0;font-size:${fontSize};line-height:1.6;color:${color};text-align:${align};font-family:Arial,sans-serif;">
      ${contenido}
    </p>
  </td>
</tr>`;
}

function renderImagen(block: any): string {
  const url = escapeHtml(block.url || block.src || "");
  const alt = escapeHtml(block.alt || "Imagen");
  const width = block.width || "100%";
  const padding = block.padding || "10px 30px";
  const link = block.link || "";
  const borderRadius = block.borderRadius || "0";

  const imgTag = `<img src="${url}" alt="${alt}" width="${width === "100%" ? "600" : width}" style="max-width:100%;height:auto;display:block;border-radius:${borderRadius};" />`;

  const content = link
    ? `<a href="${escapeHtml(link)}" target="_blank" style="text-decoration:none;">${imgTag}</a>`
    : imgTag;

  return `<tr>
  <td align="center" style="padding:${padding};">
    ${content}
  </td>
</tr>`;
}

function renderBoton(block: any): string {
  const texto = escapeHtml(block.texto || block.label || "Click aqui");
  const url = escapeHtml(block.url || block.link || "#");
  const bgColor = block.backgroundColor || "#6366f1";
  const textColor = block.textColor || "#ffffff";
  const borderRadius = block.borderRadius || "6px";
  const padding = block.padding || "20px 30px";
  const fontSize = block.fontSize || "16px";

  return `<tr>
  <td align="center" style="padding:${padding};">
    <table border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center" style="border-radius:${borderRadius};background-color:${bgColor};">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:${fontSize};font-family:Arial,sans-serif;color:${textColor};text-decoration:none;border-radius:${borderRadius};font-weight:bold;">
            ${texto}
          </a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function renderSeparador(block: any): string {
  const color = block.color || "#e5e7eb";
  const thickness = block.thickness || "1px";
  const padding = block.padding || "10px 30px";

  return `<tr>
  <td style="padding:${padding};">
    <hr style="border:none;border-top:${thickness} solid ${color};margin:0;" />
  </td>
</tr>`;
}

function renderColumnas(block: any): string {
  const columnas = block.columnas || block.columns || [];
  const padding = block.padding || "10px 30px";
  const colCount = columnas.length || 2;
  const colWidth = Math.floor(600 / colCount);

  const colsHtml = columnas
    .map((col: any) => {
      const innerHtml = (col.bloques || col.blocks || [])
        .map((b: any) => {
          const rendered = renderBlock(b);
          // Strip outer <tr><td>...</td></tr> and just keep inner content
          return rendered;
        })
        .join("");

      return `<td width="${colWidth}" valign="top" style="padding:5px;font-family:Arial,sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          ${innerHtml}
        </table>
      </td>`;
    })
    .join("");

  return `<tr>
  <td style="padding:${padding};">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        ${colsHtml}
      </tr>
    </table>
  </td>
</tr>`;
}

function renderProducto(block: any): string {
  const nombre = escapeHtml(block.nombre || "Producto");
  const precio = escapeHtml(block.precio || "");
  const precioAnterior = block.precioAnterior || "";
  const imagen = escapeHtml(block.imagen || "");
  const descripcion = block.descripcion || "";
  const url = escapeHtml(block.url || "#");
  const btnTexto = escapeHtml(block.btnTexto || "Ver producto");
  const btnColor = block.btnColor || "#6366f1";
  const padding = block.padding || "15px 30px";

  return `<tr>
  <td style="padding:${padding};">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${imagen ? `<tr>
        <td align="center" style="padding:0;">
          <a href="${url}" target="_blank"><img src="${imagen}" alt="${nombre}" width="540" style="max-width:100%;height:auto;display:block;" /></a>
        </td>
      </tr>` : ""}
      <tr>
        <td style="padding:20px;">
          <h3 style="margin:0 0 8px;font-size:20px;color:#111;font-family:Arial,sans-serif;">
            <a href="${url}" target="_blank" style="color:#111;text-decoration:none;">${nombre}</a>
          </h3>
          ${descripcion ? `<p style="margin:0 0 12px;font-size:14px;color:#666;font-family:Arial,sans-serif;line-height:1.4;">${descripcion}</p>` : ""}
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;">
            ${precioAnterior ? `<span style="text-decoration:line-through;color:#999;font-size:14px;margin-right:8px;">${escapeHtml(precioAnterior)}</span>` : ""}
            <span style="font-size:22px;font-weight:bold;color:${btnColor};">${precio}</span>
          </p>
          <table border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="border-radius:6px;background-color:${btnColor};">
                <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-family:Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">
                  ${btnTexto}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function renderCupon(block: any): string {
  const codigo = escapeHtml(block.codigo || "DESCUENTO");
  const descuento = escapeHtml(block.descuento || block.descripcion || "10% OFF");
  const expira = block.expira || block.fechaExpiracion || "";
  const bgColor = block.backgroundColor || "#fef3c7";
  const borderColor = block.borderColor || "#f59e0b";
  const padding = block.padding || "15px 30px";

  return `<tr>
  <td style="padding:${padding};">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:${bgColor};border:2px dashed ${borderColor};border-radius:8px;">
      <tr>
        <td align="center" style="padding:25px 20px;">
          <p style="margin:0 0 8px;font-size:14px;color:#92400e;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">
            ${descuento}
          </p>
          <p style="margin:0 0 12px;font-size:28px;font-weight:bold;color:#92400e;font-family:'Courier New',monospace;letter-spacing:4px;background:#fff;display:inline-block;padding:8px 24px;border-radius:4px;border:1px solid ${borderColor};">
            ${codigo}
          </p>
          ${expira ? `<p style="margin:8px 0 0;font-size:12px;color:#b45309;font-family:Arial,sans-serif;">Valido hasta: ${escapeHtml(expira)}</p>` : ""}
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function renderSocial(block: any): string {
  const redes = block.redes || block.links || [];
  const padding = block.padding || "20px 30px";
  const iconSize = block.iconSize || "32";

  // Map of social network names to default icon URLs (using simple-icons CDN)
  const defaultIcons: Record<string, string> = {
    facebook: "https://cdn.simpleicons.org/facebook/1877F2",
    instagram: "https://cdn.simpleicons.org/instagram/E4405F",
    twitter: "https://cdn.simpleicons.org/x/000000",
    x: "https://cdn.simpleicons.org/x/000000",
    youtube: "https://cdn.simpleicons.org/youtube/FF0000",
    tiktok: "https://cdn.simpleicons.org/tiktok/000000",
    linkedin: "https://cdn.simpleicons.org/linkedin/0A66C2",
    whatsapp: "https://cdn.simpleicons.org/whatsapp/25D366",
  };

  const linksHtml = redes
    .map((red: any) => {
      const nombre = (red.nombre || red.name || "").toLowerCase();
      const url = escapeHtml(red.url || "#");
      const icon = red.icon || defaultIcons[nombre] || "";
      return `<td align="center" style="padding:0 8px;">
        <a href="${url}" target="_blank">
          <img src="${escapeHtml(icon)}" alt="${escapeHtml(nombre)}" width="${iconSize}" height="${iconSize}" style="display:block;border:0;" />
        </a>
      </td>`;
    })
    .join("");

  return `<tr>
  <td align="center" style="padding:${padding};">
    <table border="0" cellspacing="0" cellpadding="0">
      <tr>
        ${linksHtml}
      </tr>
    </table>
  </td>
</tr>`;
}

function renderFooter(block: any): string {
  const texto = block.texto || block.contenido || "";
  const bgColor = block.backgroundColor || "#f9fafb";
  const textColor = block.textColor || "#9ca3af";
  const padding = block.padding || "30px";
  const showUnsubscribe = block.showUnsubscribe !== false;

  return `<tr>
  <td style="background-color:${bgColor};padding:${padding};">
    <p style="margin:0;font-size:12px;line-height:1.6;color:${textColor};text-align:center;font-family:Arial,sans-serif;">
      ${texto}
    </p>
    ${showUnsubscribe ? `<p style="margin:12px 0 0;font-size:12px;text-align:center;font-family:Arial,sans-serif;">
      <a href="{{link_desuscribir}}" style="color:${textColor};text-decoration:underline;">Desuscribirse</a>
    </p>` : ""}
  </td>
</tr>`;
}

function renderEspaciador(block: any): string {
  const height = block.height || block.alto || "20px";

  return `<tr>
  <td style="height:${height};font-size:0;line-height:0;">&nbsp;</td>
</tr>`;
}

/**
 * Renders an array of template blocks to a full responsive email HTML document.
 */
export function renderTemplateToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) {
    return "";
  }

  const blocksHtml = blocks.map((block) => renderBlock(block)).join("\n");

  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title></title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
  <center style="width:100%;background-color:#f4f4f7;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">
    <tr>
    <td>
    <![endif]-->
    <table class="email-container" align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
${blocksHtml}
    </table>
    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}
