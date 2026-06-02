"use client";

import Link from "next/link";
import { useState } from "react";
import { SEASON_1, SEASON_2, SEASON_DISPLAY } from "@/lib/seasons";

type StatusKind = "idle" | "loading" | "success" | "error";

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [secret, setSecret] = useState("");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setStatusKind("error");
      setStatusMessage("KakaoTalk 내보내기 .txt 파일을 선택해 주세요.");
      return;
    }

    setStatusKind("loading");
    setStatusMessage("파일 업로드 · 기존 messages.jsonl merge · analytics 갱신 중…");

    const formData = new FormData();
    formData.append("season", String(SEASON_2));
    formData.append("file", file);
    if (secret.trim()) {
      formData.append("secret", secret.trim());
    }

    const headers: HeadersInit = {};
    if (secret.trim()) {
      headers["x-admin-upload-secret"] = secret.trim();
    }

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        headers,
        body: formData,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        total_messages?: number;
        member_count?: number;
        first_date?: string | null;
        last_date?: string | null;
      };

      if (!response.ok || !payload.ok) {
        setStatusKind("error");
        setStatusMessage(payload.message ?? "업로드에 실패했습니다.");
        return;
      }

      setStatusKind("success");
      setStatusMessage(
        `반영 완료 — 메시지 ${payload.total_messages?.toLocaleString("ko-KR") ?? "—"}건, ` +
          `멤버 ${payload.member_count?.toLocaleString("ko-KR") ?? "—"}명` +
          (payload.first_date && payload.last_date
            ? ` (${payload.first_date} ~ ${payload.last_date})`
            : "") +
          `. 대시보드에서 「${SEASON_DISPLAY[SEASON_2].tabLabel} · ${SEASON_DISPLAY[SEASON_2].tabSub}」 탭을 확인하세요.`,
      );
      setFile(null);
    } catch {
      setStatusKind("error");
      setStatusMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <p className="text-sm text-excel-text-muted">
        <Link href="/dashboard?season=2" className="hover:text-excel-title">
          ← 대시보드로
        </Link>
      </p>

      <h1 className="mt-4 text-xl font-bold text-excel-text">
        {SEASON_DISPLAY[SEASON_2].tag} · 데이터 업로드
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-excel-text-muted">
        <strong className="font-medium text-excel-text">
          {SEASON_DISPLAY[SEASON_2].eraName}
        </strong>{" "}
        오픈채팅방에서 KakaoTalk「대화 내보내기」로 받은 .txt를 올리면, Supabase
        Storage에 저장된 기존 <code className="text-excel-text">messages.jsonl</code>
        과 MD5 hash 기준으로 <strong className="text-excel-text">누적 merge</strong>
        됩니다. 중복 메시지는 자동 제외되고,{" "}
        <code className="text-excel-text">analytics_snapshots</code> (season=2)가
        새 스냅샷으로 갱신됩니다.
      </p>

      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-excel-text-muted">
        <li>카카오톡 → 방 설정 → 대화 내용 내보내기 → .txt 저장</li>
        <li>아래에서 파일 선택 후 업로드</li>
        <li>대시보드·활동 데이터에서 시즌 2 탭 확인</li>
      </ol>

      <p className="excel-cell-panel mt-3 px-3 py-2 text-xs text-excel-text-muted">
        시즌 1 ({SEASON_DISPLAY[SEASON_1].eraName})은 아카이브로{" "}
        <span className="text-excel-text">수정·merge 불가</span>입니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="upload-file" className="block text-sm text-excel-text-muted">
            KakaoTalk .txt
          </label>
          <input
            id="upload-file"
            type="file"
            accept=".txt,text/plain"
            disabled={statusKind === "loading"}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              if (statusKind !== "loading") {
                setStatusKind("idle");
                setStatusMessage(null);
              }
            }}
            className="mt-1 w-full text-sm text-excel-text file:mr-3 file:border file:border-excel-grid file:bg-excel-header file:px-3 file:py-2 file:text-excel-text disabled:opacity-50"
          />
          {file && (
            <p className="mt-1 text-xs text-excel-text-muted">
              선택됨: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="upload-secret" className="block text-sm text-excel-text-muted">
            업로드 비밀번호{" "}
            <span className="text-excel-text-muted/70">(Production 필수 · Vercel ADMIN_UPLOAD_SECRET)</span>
          </label>
          <input
            id="upload-secret"
            type="password"
            autoComplete="off"
            disabled={statusKind === "loading"}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Vercel ADMIN_UPLOAD_SECRET과 동일"
            className="mt-1 w-full border border-excel-grid bg-white px-3 py-2 text-sm text-excel-text placeholder:text-excel-text-muted/50 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={statusKind === "loading" || !file}
          className="w-full border border-excel-title bg-excel-title px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {statusKind === "loading"
            ? "처리 중… (대용량은 1~2분 걸릴 수 있음)"
            : "업로드 · merge · 스냅샷 갱신"}
        </button>
      </form>

      {statusMessage && (
        <p
          role="status"
          className={`mt-6 border px-4 py-3 text-sm leading-relaxed ${
            statusKind === "success"
              ? "border-excel-title bg-excel-ribbon-hover text-excel-title"
              : statusKind === "error"
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-excel-grid bg-excel-header text-excel-text"
          }`}
        >
          {statusMessage}
        </p>
      )}

      {statusKind === "success" && (
        <p className="mt-4 text-sm">
          <Link
            href="/dashboard?season=2"
            className="text-excel-title hover:underline"
          >
            시즌 2 대시보드 보기 →
          </Link>
          {" · "}
          <Link href="/activity?season=2" className="text-excel-title hover:underline">
            활동 데이터 보기 →
          </Link>
        </p>
      )}
    </main>
  );
}
