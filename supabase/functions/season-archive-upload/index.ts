import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = "chat-exports";
const MAX_CHUNK_BYTES = 4 * 1024 * 1024;

type Body = {
  action: "init" | "chunk" | "finalize";
  season: number;
  filename: string;
  uploadId?: string;
  chunkIndex?: number;
  totalChunks?: number;
  dataB64?: string;
  contentType?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function safeFilename(name: string): string | null {
  const base = name.split(/[/\\]/).pop()?.trim() ?? "";
  if (!base || base.includes("..") || base !== name.trim()) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  return base;
}

function verifyUploadSecret(req: Request): boolean {
  const expected = Deno.env.get("ADMIN_UPLOAD_SECRET")?.trim();
  if (!expected) return false;
  const provided = req.headers.get("x-admin-upload-secret")?.trim();
  return provided === expected;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyUploadSecret(req)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json({ error: "missing supabase env" }, 500);
  }

  const supabase = createClient(url, serviceKey);
  const { action, season, filename: rawFilename } = body;

  if (!season || !rawFilename) {
    return json({ error: "season and filename required" }, 400);
  }

  const filename = safeFilename(rawFilename);
  if (!filename) {
    return json({ error: "invalid filename" }, 400);
  }

  if (filename.endsWith(".txt") === false && filename.endsWith(".jsonl") === false) {
    return json({ error: "only .txt or .jsonl allowed" }, 400);
  }

  const finalPath = `season-${season}/${filename}`;

  if (action === "init") {
    if (season === 1) {
      const { data: listed } = await supabase.storage.from(BUCKET).list(
        `season-${season}`,
        { search: filename, limit: 10 },
      );
      if (listed?.some((o) => o.name === filename)) {
        return json({ error: "season-1 archive already exists", path: finalPath }, 409);
      }
    }
    const uploadId = crypto.randomUUID();
    return json({ uploadId, finalPath, maxChunkBytes: MAX_CHUNK_BYTES });
  }

  const uploadId = body.uploadId;
  if (!uploadId) {
    return json({ error: "uploadId required" }, 400);
  }

  if (action === "chunk") {
    const chunkIndex = body.chunkIndex;
    const dataB64 = body.dataB64;
    if (chunkIndex === undefined || !dataB64) {
      return json({ error: "chunkIndex and dataB64 required" }, 400);
    }
    const raw = atob(dataB64);
    if (raw.length > MAX_CHUNK_BYTES) {
      return json({ error: `chunk exceeds ${MAX_CHUNK_BYTES} bytes` }, 400);
    }
    const stagingPath = `_staging/${uploadId}/${String(chunkIndex).padStart(5, "0")}`;
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    const { error } = await supabase.storage.from(BUCKET).upload(stagingPath, bytes, {
      upsert: true,
      contentType: "application/octet-stream",
    });
    if (error) {
      return json({ error: error.message }, 500);
    }
    return json({ ok: true, stagingPath, bytes: bytes.length });
  }

  if (action === "finalize") {
    const totalChunks = body.totalChunks;
    const contentType = body.contentType ?? "application/octet-stream";
    if (!totalChunks || totalChunks < 1) {
      return json({ error: "totalChunks required" }, 400);
    }

    const parts: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const stagingPath = `_staging/${uploadId}/${String(i).padStart(5, "0")}`;
      const { data, error } = await supabase.storage.from(BUCKET).download(stagingPath);
      if (error || !data) {
        return json({ error: `missing chunk ${i}: ${error?.message}` }, 500);
      }
      const buf = new Uint8Array(await data.arrayBuffer());
      parts.push(buf);
    }

    const totalLen = parts.reduce((n, p) => n + p.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const p of parts) {
      merged.set(p, offset);
      offset += p.length;
    }

    const upsert = season !== 1;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(finalPath, merged, {
      upsert,
      contentType,
    });
    if (upErr) {
      return json({ error: upErr.message }, 500);
    }

    for (let i = 0; i < totalChunks; i++) {
      const stagingPath = `_staging/${uploadId}/${String(i).padStart(5, "0")}`;
      await supabase.storage.from(BUCKET).remove([stagingPath]);
    }

    return json({ ok: true, path: finalPath, bytes: totalLen });
  }

  return json({ error: "unknown action" }, 400);
});
