#!/usr/bin/env node
/**
 * Sync products from Shopify public JSON into Supabase.
 * Run: node scripts/sync-shopify.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * in .env.local (or environment variables).
 */

import fs from "node:fs";
import path from "node:path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const SHOP = "4cd053-ux.myshopify.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

// Mapping: Shopify collection handle → our category slug
const COLLECTION_MAP = {
  "articulos-publicitarios": "articulos-publicitarios",
  "grafica-publicitaria": "grafica-publicitaria",
  "poleras-personalizadas": "poleras-personalizadas",
  "transferibles": "transferibles",
  "pendones-y-banderas": "pendones-y-banderas",
};

// Shopify collections that mark products as "destacado"
const FEATURED_COLLECTION = "destacados";

async function supabase(table, method, body, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "resolution=merge-duplicates,return=representation" : "return=representation",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${table}: ${res.status} ${text}`);
  }
  return res.json();
}

async function fetchShopify(endpoint) {
  const res = await fetch(`https://${SHOP}/${endpoint}`);
  return res.json();
}

async function main() {
  console.log("Sincronizando productos desde Shopify...\n");

  // 1. Fetch all products
  const { products } = await fetchShopify("products.json?limit=250");
  console.log(`Productos en Shopify: ${products.length}`);

  // 2. Fetch featured collection
  const { products: featuredProducts } = await fetchShopify(
    `collections/${FEATURED_COLLECTION}/products.json`
  );
  const featuredHandles = new Set(featuredProducts.map((p) => p.handle));
  console.log(`Productos destacados: ${featuredHandles.size}`);

  // 3. Build product → category mapping from collections
  const productCategories = {};
  for (const [collHandle, catSlug] of Object.entries(COLLECTION_MAP)) {
    const { products: collProducts } = await fetchShopify(
      `collections/${collHandle}/products.json`
    );
    for (const p of collProducts) {
      // First matching category wins (some products are in multiple collections)
      if (!productCategories[p.handle]) {
        productCategories[p.handle] = catSlug;
      }
    }
  }

  // 4. Get existing categories from Supabase
  const categories = await supabase("categorias", "GET", null, "?select=id,slug");
  const catMap = {};
  for (const c of categories) catMap[c.slug] = c.id;

  // 5. Upsert products
  let synced = 0;
  for (const p of products) {
    const catSlug = productCategories[p.handle];
    const catId = catSlug ? catMap[catSlug] : null;

    const imagenes = p.images.map((img, i) => ({
      url: img.src,
      alt: img.alt || `${p.title} ${i + 1}`,
      orden: i,
    }));

    const variantes =
      p.variants.length === 1 && p.variants[0].title === "Default Title"
        ? []
        : [
            {
              nombre: p.options?.[0]?.name || "Opcion",
              opciones: p.variants.map((v) => ({
                valor: v.title,
                precio_extra: Math.round(parseFloat(v.price)) - Math.round(parseFloat(p.variants[0].price)),
              })),
            },
          ];

    // Strip HTML from body
    const descripcion = p.body_html
      ? p.body_html
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/\n{3,}/g, "\n\n")
          .trim()
      : null;

    const producto = {
      nombre: p.title,
      slug: p.handle,
      descripcion,
      descripcion_corta: descripcion?.substring(0, 120) + "..." || null,
      precio: Math.round(parseFloat(p.variants[0].price)),
      categoria_id: catId,
      imagenes: JSON.stringify(imagenes),
      variantes: JSON.stringify(variantes),
      stock: p.variants.reduce(
        (sum, v) => sum + (v.inventory_quantity || 0),
        0
      ) || 100,
      destacado: featuredHandles.has(p.handle),
      activo: p.published_at !== null,
      tags: p.tags ? p.tags.split(", ").filter(Boolean) : [],
      sku: p.variants[0]?.sku || null,
    };

    try {
      await supabase("productos", "POST", producto, "?on_conflict=slug");
      synced++;
      console.log(`  + ${p.title}`);
    } catch (err) {
      console.error(`  x ${p.title}: ${err.message}`);
    }
  }

  console.log(`\nSincronizados: ${synced}/${products.length}`);
}

main().catch(console.error);
