// NextCloud Sync Worker
// Polls Supabase every 30s for unsynced forms, downloads files,
// uploads to NextCloud via WebDAV, then deletes from Supabase Storage.

import { createClient } from "@supabase/supabase-js";

// --- Config from environment ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL; // e.g. https://printup.internos
const NEXTCLOUD_USER = process.env.NEXTCLOUD_USER;
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_PASSWORD;
const NEXTCLOUD_FOLDER = process.env.NEXTCLOUD_FOLDER || "/PrintUp/Pedidos_Nuevos";
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL || "30000", 10);
const STORAGE_BUCKET = "formularios-archivos";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  process.exit(1);
}
if (!NEXTCLOUD_URL || !NEXTCLOUD_USER || !NEXTCLOUD_PASSWORD) {
  console.error("NEXTCLOUD_URL, NEXTCLOUD_USER, NEXTCLOUD_PASSWORD are required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- NextCloud WebDAV helpers ---

function davUrl(path) {
  return `${NEXTCLOUD_URL}/remote.php/dav/files/${NEXTCLOUD_USER}${path}`;
}

function authHeaders() {
  const encoded = Buffer.from(`${NEXTCLOUD_USER}:${NEXTCLOUD_PASSWORD}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

async function ensureFolder(folderPath) {
  const parts = folderPath.split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current += `/${part}`;
    const res = await fetch(davUrl(current), {
      method: "MKCOL",
      headers: authHeaders(),
    });
    // 201 = created, 405 = already exists — both OK
    if (!res.ok && res.status !== 405) {
      throw new Error(`Failed to create folder ${current}: ${res.status} ${res.statusText}`);
    }
  }
}

async function uploadToNextCloud(folderPath, fileName, buffer, contentType) {
  const fullPath = `${folderPath}/${fileName}`;
  const res = await fetch(davUrl(fullPath), {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": contentType || "application/octet-stream",
    },
    body: buffer,
  });
  if (!res.ok && res.status !== 201 && res.status !== 204) {
    throw new Error(`Failed to upload ${fullPath}: ${res.status} ${res.statusText}`);
  }
}

// --- Supabase helpers ---

async function downloadFromSupabase(fileUrl) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Failed to download ${fileUrl}: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function getStoragePath(form) {
  // nextcloud_path is the folder name used in Supabase Storage
  return form.nextcloud_path;
}

async function deleteFromSupabaseStorage(storageFolderPath, fileNames) {
  const paths = fileNames.map((name) => `${storageFolderPath}/${name}`);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) {
    console.error(`  Error deleting from Supabase Storage:`, error.message);
    return false;
  }
  return true;
}

// --- Main sync loop ---

async function syncOne(form) {
  const storagePath = getStoragePath(form);
  const ncFolderPath = `${NEXTCLOUD_FOLDER}/${storagePath}`;
  const archivos = form.archivos || [];

  if (archivos.length === 0) {
    console.log(`  [${form.id}] No files to sync, marking as synced`);
    await supabase.from("formularios").update({ nextcloud_synced: true }).eq("id", form.id);
    return;
  }

  console.log(`  [${form.id}] ${form.nombre} — ${archivos.length} file(s)`);

  // 1. Create folder in NextCloud
  await ensureFolder(ncFolderPath);
  console.log(`    Created folder: ${ncFolderPath}`);

  // 2. Download each file from Supabase and upload to NextCloud
  const syncedFileNames = [];
  for (const archivo of archivos) {
    try {
      console.log(`    Downloading: ${archivo.nombre} (${(archivo.tamaño / 1024).toFixed(1)} KB)`);
      const buffer = await downloadFromSupabase(archivo.url);

      console.log(`    Uploading to NextCloud: ${archivo.nombre}`);
      await uploadToNextCloud(ncFolderPath, archivo.nombre, buffer, archivo.tipo);

      syncedFileNames.push(archivo.nombre);
    } catch (err) {
      console.error(`    Error syncing ${archivo.nombre}:`, err.message);
    }
  }

  // 3. If all files synced, delete from Supabase Storage and mark as synced
  if (syncedFileNames.length === archivos.length) {
    console.log(`    All files synced. Deleting from Supabase Storage...`);
    await deleteFromSupabaseStorage(storagePath, syncedFileNames);

    await supabase
      .from("formularios")
      .update({ nextcloud_synced: true })
      .eq("id", form.id);

    console.log(`    Done! Marked as synced.`);
  } else {
    console.log(`    Partial sync: ${syncedFileNames.length}/${archivos.length} files. Will retry next cycle.`);
  }
}

async function syncAll() {
  try {
    const { data: forms, error } = await supabase
      .from("formularios")
      .select("*")
      .eq("nextcloud_synced", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error querying Supabase:", error.message);
      return;
    }

    if (!forms || forms.length === 0) return;

    console.log(`\n[${new Date().toISOString()}] Found ${forms.length} unsynced form(s)`);

    for (const form of forms) {
      try {
        await syncOne(form);
      } catch (err) {
        console.error(`  Error processing form ${form.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Sync cycle error:", err.message);
  }
}

// --- Startup ---

async function testNextCloudConnection() {
  try {
    const res = await fetch(davUrl("/"), {
      method: "PROPFIND",
      headers: { ...authHeaders(), Depth: "0" },
    });
    if (res.ok || res.status === 207) {
      console.log(`NextCloud connection OK (${NEXTCLOUD_USER}@${NEXTCLOUD_URL})`);
      return true;
    }
    console.error(`NextCloud connection failed: ${res.status} ${res.statusText}`);
    return false;
  } catch (err) {
    console.error(`NextCloud connection error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log("=== NextCloud Sync Worker ===");
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`NextCloud URL: ${NEXTCLOUD_URL}`);
  console.log(`NextCloud User: ${NEXTCLOUD_USER}`);
  console.log(`NextCloud Folder: ${NEXTCLOUD_FOLDER}`);
  console.log(`Sync Interval: ${SYNC_INTERVAL}ms`);
  console.log("");

  const connected = await testNextCloudConnection();
  if (!connected) {
    console.error("Cannot connect to NextCloud. Exiting.");
    process.exit(1);
  }

  // Ensure base folder exists
  try {
    await ensureFolder(NEXTCLOUD_FOLDER);
    console.log(`Base folder ensured: ${NEXTCLOUD_FOLDER}`);
  } catch (err) {
    console.error(`Cannot create base folder: ${err.message}`);
    process.exit(1);
  }

  console.log("\nStarting sync loop...\n");

  // Run immediately, then every SYNC_INTERVAL
  await syncAll();
  setInterval(syncAll, SYNC_INTERVAL);
}

main();
