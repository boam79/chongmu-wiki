#!/usr/bin/env node
/**
 * Upload Season archive via Supabase Edge Function (no service_role in local env).
 * Usage: node scripts/mcp_season_upload.mjs --season 1 --file KakaoTalkChats.txt
 */
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const CHUNK = 3 * 1024 * 1024; // base64-safe under 4MB edge limit

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  if (i === -1) return def;
  return args[i + 1] ?? def;
}

const season = Number(flag("--season", "1"));
const file = flag("--file", null);
const projectUrl =
  process.env.SUPABASE_URL || "https://ibzxzhepsorsqqdcbfgo.supabase.co";
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!file || !anonKey) {
  console.error("Need --file and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  process.exit(1);
}

const localPath = resolve(file);
if (!existsSync(localPath)) {
  console.error("File not found:", localPath);
  process.exit(1);
}

const filename = basename(localPath);
const contentType =
  filename.endsWith(".jsonl")
    ? "application/x-ndjson"
    : "text/plain; charset=utf-8";

const fnUrl = `${projectUrl.replace(/\/$/, "")}/functions/v1/season-archive-upload`;

async function invoke(payload) {
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function uploadFile() {
  const buf = readFileSync(localPath);
  const totalChunks = Math.ceil(buf.length / CHUNK);
  console.log(`Upload ${filename} (${buf.length} bytes, ${totalChunks} chunks)`);

  const init = await invoke({
    action: "init",
    season,
    filename,
  });
  const { uploadId } = init;
  console.log("  uploadId:", uploadId);

  for (let i = 0; i < totalChunks; i++) {
    const slice = buf.subarray(i * CHUNK, (i + 1) * CHUNK);
    const dataB64 = Buffer.from(slice).toString("base64");
    const r = await invoke({
      action: "chunk",
      season,
      filename,
      uploadId,
      chunkIndex: i,
      dataB64,
    });
    console.log(`  chunk ${i + 1}/${totalChunks} -> ${r.bytes} bytes`);
  }

  const done = await invoke({
    action: "finalize",
    season,
    filename,
    uploadId,
    totalChunks,
    contentType,
  });
  console.log("  done:", done);
}

uploadFile().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
