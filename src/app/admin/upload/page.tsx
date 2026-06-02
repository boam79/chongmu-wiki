"use client";

import { useState } from "react";
import { SEASON_1, SEASON_2, SEASON_DISPLAY } from "@/lib/seasons";

export default function AdminUploadPage() {
  const [season, setSeason] = useState("2");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatus("txt 파일을 선택해 주세요.");
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("season", season);
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        total_messages?: number;
        member_count?: number;
      };

      if (!response.ok || !payload.ok) {
        setStatus(payload.message ?? "업로드 실패");
        return;
      }

      setStatus(
        `반영 완료 — 메시지 ${payload.total_messages?.toLocaleString("ko-KR")}건, ` +
          `멤버 ${payload.member_count?.toLocaleString("ko-KR")}명. 대시보드에서 「${SEASON_DISPLAY[SEASON_2].tabLabel} · ${SEASON_DISPLAY[SEASON_2].tabSub}」 탭을 확인하세요.`,
      );
      setFile(null);
    } catch {
      setStatus("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-2xl font-bold text-white">
        {SEASON_DISPLAY[SEASON_2].tag} · txt 업로드
      </h1>
      <p className="mt-2 text-sm text-neutral-400">
        {SEASON_DISPLAY[SEASON_2].eraName} 오픈채팅 KakaoTalk보내기 txt를 업로드하면
        기존 messages.jsonl과 hash 기준 merge 후 analytics 스냅샷이 갱신됩니다. 시즌 1(
        {SEASON_DISPLAY[SEASON_1].eraName})은 아카이브(불변)입니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm text-neutral-400">시즌</label>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-white"
          >
            <option value="2">
              {SEASON_DISPLAY[SEASON_2].tabLabel} · {SEASON_DISPLAY[SEASON_2].tabSub}{" "}
              (누적)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-400">KakaoTalk .txt</label>
          <input
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm text-neutral-300 file:mr-3 file:rounded file:border-0 file:bg-accent-blue/20 file:px-3 file:py-2 file:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "처리 중…" : "업로드 · merge · 스냅샷 갱신"}
        </button>
      </form>

      {status && (
        <p
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            status.includes("완료")
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
              : "border-border bg-surface text-neutral-300"
          }`}
        >
          {status}
        </p>
      )}
    </main>
  );
}
