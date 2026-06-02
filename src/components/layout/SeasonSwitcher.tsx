"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SEASON_1, SEASON_2, SEASON_DISPLAY, buildSeasonHref } from "@/lib/seasons";

const SEASONS = [
  { n: SEASON_1, ...SEASON_DISPLAY[SEASON_1] },
  { n: SEASON_2, ...SEASON_DISPLAY[SEASON_2] },
].map(({ n, tabLabel, tabSub }) => ({
  n,
  label: tabLabel,
  sub: tabSub,
}));

type SeasonSwitcherProps = {
  variant?: "default" | "topbar";
};

export function SeasonSwitcher({ variant = "default" }: SeasonSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("season") ?? "1") || 1;

  if (variant === "topbar") {
    return (
      <div className="flex items-center gap-1">
        {SEASONS.map(({ n, label }) => {
          const active = current === n;
          return (
            <Link
              key={n}
              href={buildSeasonHref(pathname, n)}
              className={`border px-2 py-0.5 text-[10px] transition-colors ${
                active
                  ? "border-excel-title bg-excel-ribbon-hover font-semibold text-excel-title"
                  : "border-excel-grid bg-white text-excel-text-muted hover:bg-excel-header"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap gap-1">
      {SEASONS.map(({ n, label, sub }) => {
        const active = current === n;
        return (
          <Link
            key={n}
            href={buildSeasonHref(pathname, n)}
            className={`excel-sheet-tab px-3 py-1 text-xs ${
              active ? "active" : "hover:bg-white/80"
            }`}
          >
            {label}
            <span className="ml-1 opacity-70">{sub}</span>
          </Link>
        );
      })}
    </div>
  );
}
