#!/usr/bin/env node
/**
 * Shopify OAuth Token Exchange
 * Run: node scripts/shopify-auth.mjs
 * Opens browser → approve → saves token to .env.local
 */

import http from "node:http";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SHOP = process.env.SHOPIFY_SHOP || "YOUR_SHOP.myshopify.com";
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || "";
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || "";
const SCOPES = "read_products,read_inventory";
const REDIRECT_URI = "http://localhost:3456/callback";
const PORT = 3456;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/callback") {
    const code = url.searchParams.get("code");

    if (!code) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>Error: no se recibió código de autorización</h1>");
      return;
    }

    // Exchange code for access token
    try {
      const tokenRes = await fetch(
        `https://${SHOP}/admin/oauth/access_token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
          }),
        }
      );

      const data = await tokenRes.json();

      if (data.access_token) {
        // Save to .env.local
        const envPath = path.join(process.cwd(), ".env.local");
        let envContent = "";
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, "utf-8");
        }

        // Add or update SHOPIFY vars
        const vars = {
          SHOPIFY_SHOP: SHOP,
          SHOPIFY_ACCESS_TOKEN: data.access_token,
        };

        for (const [key, value] of Object.entries(vars)) {
          const regex = new RegExp(`^${key}=.*$`, "m");
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, `${key}=${value}`);
          } else {
            envContent += `\n${key}=${value}`;
          }
        }

        fs.writeFileSync(envPath, envContent.trim() + "\n");

        console.log("\n✅ Token obtenido y guardado en .env.local");
        console.log(`   SHOPIFY_ACCESS_TOKEN=${data.access_token}\n`);

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`
          <html>
          <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f7ff">
            <div style="text-align:center">
              <h1 style="color:#1B2A6B">✅ Conectado con Shopify</h1>
              <p>Token guardado en <code>.env.local</code></p>
              <p>Puedes cerrar esta ventana.</p>
            </div>
          </body>
          </html>
        `);
      } else {
        console.error("Error:", data);
        res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>Error al obtener token</h1><pre>${JSON.stringify(data, null, 2)}</pre>`);
      }
    } catch (err) {
      console.error("Error:", err);
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<h1>Error de conexión</h1><pre>${err.message}</pre>`);
    }

    // Close server after a short delay
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 1000);
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`
      <html>
      <body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0f7ff">
        <div style="text-align:center">
          <h1 style="color:#1B2A6B">Conectar PrintUp con Shopify</h1>
          <a href="https://${SHOP}/admin/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPES}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}"
             style="display:inline-block;margin-top:20px;padding:12px 32px;background:#1B2A6B;color:white;text-decoration:none;border-radius:8px;font-weight:bold">
            Autorizar App
          </a>
        </div>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  const authUrl = `http://localhost:${PORT}`;
  console.log(`\n🔐 Abre tu navegador en: ${authUrl}\n`);

  // Try to open browser automatically
  try {
    if (process.platform === "win32") {
      execSync(`start ${authUrl}`);
    } else if (process.platform === "darwin") {
      execSync(`open ${authUrl}`);
    } else {
      execSync(`xdg-open ${authUrl}`);
    }
  } catch {
    // Browser didn't open automatically, user can open manually
  }
});
