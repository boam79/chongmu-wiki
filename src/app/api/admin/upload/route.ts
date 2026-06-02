import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const BUCKET = "chat-exports";
const ANALYTICS_MARKER = "__ANALYTICS_JSON__";

type BasicAnalytics = {
  season: number;
  season_label: string;
  season_start: string | null;
  season_end: string | null;
  snapshot_date: string;
  first_date: string | null;
  last_date: string | null;
  total_messages: number;
  member_count: number;
  active_months: number;
  top_members: Json;
  monthly_stats: Json;
  time_analysis: Json;
  is_active: boolean;
};

function parseAnalyticsFromStdout(stdout: string): BasicAnalytics | null {
  for (const line of stdout.split("\n")) {
    if (line.startsWith(ANALYTICS_MARKER)) {
      return JSON.parse(line.slice(ANALYTICS_MARKER.length)) as BasicAnalytics;
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const seasonRaw = formData.get("season");
    const file = formData.get("file");

    const season = Number(seasonRaw);
    if (!Number.isInteger(season) || season < 2) {
      return NextResponse.json(
        { ok: false, message: "season은 2 이상이어야 합니다. 시즌 1은 아카이브(불변)입니다." },
        { status: 400 },
      );
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, message: "txt 파일이 필요합니다." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".txt")) {
      return NextResponse.json(
        { ok: false, message: "KakaoTalk 내보내기 .txt 파일만 허용됩니다." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const workDir = await mkdtemp(join(tmpdir(), "chongmu-upload-"));
    const txtPath = join(workDir, "upload.txt");
    const existingJsonlPath = join(workDir, "existing.jsonl");
    const mergedJsonlPath = join(workDir, "messages.jsonl");

    try {
      const txtBuffer = Buffer.from(await file.arrayBuffer());
      await writeFile(txtPath, txtBuffer);

      const storagePrefix = `season-${season}`;
      const existingRemote = `${storagePrefix}/messages.jsonl`;
      const { data: existingBlob, error: downloadError } = await admin.storage
        .from(BUCKET)
        .download(existingRemote);

      if (existingBlob && !downloadError) {
        await writeFile(existingJsonlPath, Buffer.from(await existingBlob.arrayBuffer()));
      }

      const scriptPath = resolve(process.cwd(), "scripts/process.py");
      const mergeArg = existingBlob ? ["--merge", existingJsonlPath] : [];
      const result = spawnSync(
        "python3",
        [
          scriptPath,
          txtPath,
          "--season",
          String(season),
          ...mergeArg,
          "-o",
          mergedJsonlPath,
          "--print-analytics",
        ],
        { encoding: "utf-8", maxBuffer: 20 * 1024 * 1024 },
      );

      if (result.status !== 0) {
        return NextResponse.json(
          {
            ok: false,
            message: "파싱 실패",
            detail: result.stderr || result.stdout,
          },
          { status: 500 },
        );
      }

      const analytics = parseAnalyticsFromStdout(result.stdout ?? "");
      if (!analytics) {
        return NextResponse.json(
          { ok: false, message: "analytics JSON을 파싱하지 못했습니다." },
          { status: 500 },
        );
      }

      const mergedBytes = await readFile(mergedJsonlPath);
      const txtRemote = `${storagePrefix}/batch-${Date.now()}.txt`;
      const jsonlRemote = `${storagePrefix}/messages.jsonl`;

      const uploads = await Promise.all([
        admin.storage.from(BUCKET).upload(txtRemote, txtBuffer, {
          upsert: true,
          contentType: "text/plain; charset=utf-8",
        }),
        admin.storage.from(BUCKET).upload(jsonlRemote, mergedBytes, {
          upsert: true,
          contentType: "application/x-ndjson",
        }),
      ]);

      for (const upload of uploads) {
        if (upload.error) {
          return NextResponse.json(
            { ok: false, message: `Storage 업로드 실패: ${upload.error.message}` },
            { status: 500 },
          );
        }
      }

      await admin
        .from("analytics_snapshots")
        .update({ is_active: false })
        .eq("season", season)
        .eq("is_active", true);

      const { error: insertError } = await admin.from("analytics_snapshots").insert({
        season: analytics.season,
        season_label: analytics.season_label,
        season_start: analytics.season_start,
        season_end: analytics.season_end,
        snapshot_date: analytics.snapshot_date,
        first_date: analytics.first_date,
        last_date: analytics.last_date,
        total_messages: analytics.total_messages,
        member_count: analytics.member_count,
        active_months: analytics.active_months,
        top_members: analytics.top_members,
        monthly_stats: analytics.monthly_stats,
        time_analysis: analytics.time_analysis,
        recent_batch: {
          uploaded_at: new Date().toISOString(),
          source_file: file.name,
          storage_txt: txtRemote,
        },
        is_active: true,
      });

      if (insertError) {
        return NextResponse.json(
          { ok: false, message: `DB insert 실패: ${insertError.message}` },
          { status: 500 },
        );
      }

      revalidatePath("/dashboard");
      revalidatePath("/activity");

      return NextResponse.json({
        ok: true,
        season,
        total_messages: analytics.total_messages,
        member_count: analytics.member_count,
        first_date: analytics.first_date,
        last_date: analytics.last_date,
        storage: { txt: txtRemote, jsonl: jsonlRemote },
      });
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
