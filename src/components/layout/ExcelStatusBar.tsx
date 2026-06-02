"use client";

import { useSearchParams } from "next/navigation";
import { parseSeasonParam, SEASON_DISPLAY } from "@/lib/seasons";

export function ExcelStatusBar() {
  const searchParams = useSearchParams();
  const season = parseSeasonParam(searchParams.get("season") ?? undefined);
  const display = SEASON_DISPLAY[season];

  return (
    <div className="excel-status-bar flex h-6 items-center justify-between px-3">
      <span>준비</span>
      <div className="flex items-center gap-4 text-[10px]">
        <span>{display.tag}</span>
        <span>{display.tabSub}</span>
        <a
          href="https://chongmu-wiki.vercel.app"
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          chongmu-wiki.vercel.app
        </a>
      </div>
    </div>
  );
}
