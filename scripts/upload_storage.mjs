/**
 * Upload season chat files to Supabase Storage (service role).
 * Usage: node --env-file=.env.local scripts/upload_storage.mjs --season 1
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const BUCKET = "chat-exports";

const season = Number(process.argv.find((a) => a.startsWith("--season="))?.split("=")[1] ?? "1");
const root = resolve(process.cwd());

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const files = [
  {
    local: resolve(root, "KakaoTalkChats.txt"),
    remote: `season-${season}/KakaoTalkChats.txt`,
    contentType: "text/plain; charset=utf-8",
  },
  {
    local: resolve(root, "analytics/season-1/messages.jsonl"),
    remote: `season-${season}/messages.jsonl`,
    contentType: "application/x-ndjson",
  },
];

async function uploadFile(localPath, remotePath, contentType) {
  if (!existsSync(localPath)) {
    console.warn(`skip (not found): ${localPath}`);
    return null;
  }
  const body = readFileSync(localPath);
  const { data, error } = await supabase.storage.from(BUCKET).upload(remotePath, body, {
    upsert: true,
    contentType,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`${remotePath}: ${error.message}`);
  return { remotePath, bytes: body.length, data };
}

async function main() {
  console.log(`bucket=${BUCKET} season=${season}`);

  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw listErr;
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 52_428_800,
    });
    if (createErr && !createErr.message.includes("already exists")) {
      throw createErr;
    }
  }

  for (const f of files) {
    const result = await uploadFile(f.local, f.remote, f.contentType);
    if (result) {
      console.log(`OK ${result.remotePath} (${(result.bytes / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  const { data: listed } = await supabase.storage.from(BUCKET).list(`season-${season}`);
  console.log("storage listing:", listed?.map((o) => o.name).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
