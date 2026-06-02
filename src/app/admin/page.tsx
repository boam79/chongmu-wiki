import Link from "next/link";
import { SEASON_DISPLAY, SEASON_2 } from "@/lib/seasons";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-2xl font-bold text-white">관리자</h1>
      <ul className="mt-6 space-y-3">
        <li>
          <Link
            href="/admin/upload"
            className="block rounded-lg border border-border bg-surface px-4 py-3 text-white hover:border-accent-cyan/40"
          >
            📤 데이터 업로드
            <span className="mt-1 block text-sm text-neutral-400">
              {SEASON_DISPLAY[SEASON_2].tabSub} · KakaoTalk txt 누적 merge
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
