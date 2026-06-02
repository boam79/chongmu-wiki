"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildSeasonHref,
  parseSeasonParam,
  SEASON_2,
  SEASON_DISPLAY,
  sidebarBrandSubtitle,
} from "@/lib/seasons";

const NAV = [
  {
    label: "대시보드",
    items: [
      { href: "/dashboard", icon: "🏠", title: "홈 · 대시보드" },
      { href: "/activity", icon: "📊", title: "활동 데이터" },
    ],
  },
  {
    label: "실무 지식",
    items: [
      { href: "/vendors", icon: "🏢", title: "업체 비교" },
      { href: "/negotiation", icon: "🤝", title: "협상 · 예산절감" },
      { href: "/fleet", icon: "🚗", title: "법인차량 관리" },
      { href: "/facility", icon: "🔥", title: "시설 · 안전 · 소방" },
      { href: "/legal", icon: "⚖️", title: "법무 · 등기 · 라이선스" },
      { href: "/hr", icon: "💰", title: "급여 · 복리후생" },
      { href: "/checklist", icon: "✅", title: "체크리스트 · 캘린더" },
    ],
  },
  {
    label: "디지털",
    items: [{ href: "/ai", icon: "🤖", title: "AI 도구 활용" }],
  },
  {
    label: "커뮤니티",
    items: [{ href: "/community", icon: "👥", title: "커뮤니티 이야기" }],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const season = parseSeasonParam(searchParams.get("season") ?? undefined);
  const brandSubtitle = sidebarBrandSubtitle(season);

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col border-r border-border bg-sidebar/95 backdrop-blur-md">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent-blue to-accent-cyan text-lg shadow-lg">
            🗂️
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent-cyan">
              CHONGMU WIKI
            </p>
            <p className="text-[15px] font-extrabold tracking-tight text-white">
              총무 실무 위키
            </p>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10.5px] font-semibold text-neutral-500">
          {brandSubtitle}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1 pt-4 font-mono text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={buildSeasonHref(item.href, season)}
                  className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-accent-blue/15 text-white"
                      : "text-neutral-400 hover:bg-surface-2 hover:text-neutral-200"
                  }`}
                >
                  <span className="w-5 text-center text-[15px]">{item.icon}</span>
                  {item.title}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <p className="px-2 pb-1 font-mono text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
          관리
        </p>
        <Link
          href="/admin/upload"
          className={`mb-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
            pathname.startsWith("/admin")
              ? "bg-accent-cyan/15 text-white"
              : season === SEASON_2
                ? "text-accent-cyan hover:bg-surface-2 hover:text-white"
                : "text-neutral-500 hover:bg-surface-2 hover:text-neutral-300"
          }`}
        >
          <span className="w-5 text-center text-[15px]">📤</span>
          <span>
            데이터 업로드
            <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">
              {SEASON_DISPLAY[SEASON_2].tabSub} · 누적 merge
            </span>
          </span>
        </Link>
        <p className="px-2 pt-1 text-[11px] text-neutral-500">
          <a
            href="https://chongmu-wiki.vercel.app"
            className="hover:text-neutral-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            chongmu-wiki.vercel.app
          </a>
        </p>
      </div>
    </aside>
  );
}
