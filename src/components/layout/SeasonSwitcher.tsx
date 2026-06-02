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
      <div className="flex items-center gap-2">
        {SEASONS.map(({ n, label, sub }) => {
          const active = current === n;
          return (
            <Link
              key={n}
              href={buildSeasonHref(pathname, n)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                active
                  ? n === 2
                    ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
                    : "border-border bg-surface text-white"
                  : "border-transparent text-neutral-500 hover:border-border hover:bg-surface/50 hover:text-neutral-300"
              }`}
            >
              {n === 2 && active && "● "}
              {label}
              <span className="ml-1 opacity-70">{sub}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {SEASONS.map(({ n, label, sub }) => {
        const active = current === n;
        return (
          <Link
            key={n}
            href={buildSeasonHref(pathname, n)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-accent-blue/50 bg-accent-blue/15 text-white"
                : "border-border text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs font-normal opacity-70">{sub}</span>
          </Link>
        );
      })}
    </div>
  );
}
