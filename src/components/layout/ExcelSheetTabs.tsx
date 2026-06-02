"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildSeasonHref,
  parseSeasonParam,
  SEASON_1,
  SEASON_2,
  SEASON_DISPLAY,
} from "@/lib/seasons";

const SHEETS = [
  { href: "/dashboard", label: "대시보드", short: "Dashboard" },
  { href: "/activity", label: "활동데이터", short: "Activity" },
  { href: "/vendors", label: "업체비교", short: "Vendors" },
  { href: "/negotiation", label: "협상", short: "Negotiation" },
  { href: "/fleet", label: "법인차량", short: "Fleet" },
  { href: "/facility", label: "시설안전", short: "Facility" },
  { href: "/legal", label: "법무", short: "Legal" },
  { href: "/hr", label: "급여복리", short: "HR" },
  { href: "/checklist", label: "체크리스트", short: "Checklist" },
  { href: "/ai", label: "AI도구", short: "AI" },
  { href: "/community", label: "커뮤니티", short: "Community" },
] as const;

export function ExcelSheetTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const season = parseSeasonParam(searchParams.get("season") ?? undefined);

  return (
    <div className="excel-sheet-tabs flex items-stretch overflow-x-auto">
      <div className="flex shrink-0 items-center border-r border-excel-grid px-2">
        <button
          type="button"
          className="grid h-6 w-6 place-items-center text-excel-text-muted hover:bg-excel-grid/30"
          aria-label="시트 추가"
        >
          +
        </button>
      </div>
      <div className="flex flex-1 overflow-x-auto">
        {SHEETS.map((sheet) => {
          const active =
            pathname === sheet.href ||
            (sheet.href !== "/dashboard" && pathname.startsWith(sheet.href));
          return (
            <Link
              key={sheet.href}
              href={buildSeasonHref(sheet.href, season)}
              className={`excel-sheet-tab flex shrink-0 items-center px-4 py-1.5 ${
                active ? "active" : "hover:bg-white/80"
              }`}
              title={sheet.label}
            >
              {sheet.short}
            </Link>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-1 border-l border-excel-grid px-2">
        <Link
          href="/admin/upload"
          className={`excel-sheet-tab px-3 py-1 text-[10px] ${
            pathname.startsWith("/admin") ? "active" : "hover:bg-white/80"
          }`}
        >
          Admin
        </Link>
        {[SEASON_1, SEASON_2].map((n) => {
          const active = season === n;
          const display = SEASON_DISPLAY[n];
          return (
            <Link
              key={n}
              href={buildSeasonHref(pathname, n)}
              className={`excel-sheet-tab px-3 py-1 text-[10px] ${
                active ? "active" : "hover:bg-white/80"
              }`}
            >
              {display.tabLabel}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
