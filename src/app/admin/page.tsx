import Link from "next/link";
import { SEASON_DISPLAY, SEASON_2 } from "@/lib/seasons";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-bold text-excel-text">관리자</h1>
      <ul className="mt-4 space-y-2">
        <li>
          <Link
            href="/admin/upload"
            className="excel-cell-panel block px-4 py-3 text-excel-text hover:bg-excel-ribbon-hover"
          >
            📤 데이터 업로드
            <span className="mt-1 block text-sm text-excel-text-muted">
              {SEASON_DISPLAY[SEASON_2].tabSub} · KakaoTalk txt 누적 merge
            </span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
