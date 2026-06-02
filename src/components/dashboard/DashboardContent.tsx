import type { AnalyticsSnapshot } from "@/lib/supabase/types";
import { SEASON_1, SEASON_2, SEASON_DISPLAY, seasonTag } from "@/lib/seasons";

type DashboardContentProps = {
  season: number;
  analytics: AnalyticsSnapshot | null;
};

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("ko-KR");
}

function formatDateRange(
  first: string | null | undefined,
  last: string | null | undefined,
): string {
  if (!first && !last) return "—";
  if (first && last) return `${first} ~ ${last}`;
  return first ?? last ?? "—";
}

export function DashboardContent({ season, analytics }: DashboardContentProps) {
  const isSeason2 = season === SEASON_2;
  const hasData = analytics != null && (analytics.total_messages ?? 0) > 0;

  if (isSeason2 && !hasData) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="font-mono text-xs text-accent-cyan">
          {SEASON_DISPLAY[SEASON_2].tag}
        </p>
        <h2 className="mt-3 text-xl font-bold text-white">아직 반영된 데이터가 없습니다</h2>
        <p className="mt-3 text-neutral-400">
          KakaoTalk 내보내기 txt를 Admin에서 업로드하면 누적 집계가 반영됩니다.
        </p>
        <p className="mt-2 font-mono text-sm text-accent-amber">txt 업로드 후 반영</p>
      </section>
    );
  }

  const topMember = (
    analytics?.top_members as { name: string; count: number }[] | null
  )?.[0];

  const hourly = (
    analytics?.time_analysis as { hourly?: Record<string, number> } | null
  )?.hourly;
  const peakHour = hourly
    ? Object.entries(hourly).sort(([, a], [, b]) => b - a)[0]
    : null;

  const cards = [
    { label: "총 메시지", value: formatNumber(analytics?.total_messages) },
    { label: "참여 멤버", value: formatNumber(analytics?.member_count) },
    {
      label: "활동 기간",
      value: formatDateRange(analytics?.first_date, analytics?.last_date),
    },
    {
      label: peakHour ? `피크 시간 (${peakHour[0]}시)` : "피크 시간",
      value: peakHour ? formatNumber(peakHour[1]) : "—",
    },
  ];

  const seasonMeta =
    season === SEASON_1
      ? {
          tag: SEASON_DISPLAY[SEASON_1].tag,
          title: SEASON_DISPLAY[SEASON_1].dashboardTitle,
        }
      : {
          tag: seasonTag(SEASON_2, analytics?.season_label),
          title: SEASON_DISPLAY[SEASON_2].dashboardTitle,
        };

  return (
    <>
      <section className="rounded-2xl border border-border bg-surface p-8">
        <p className="font-mono text-xs text-accent-cyan">{seasonMeta.tag}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{seasonMeta.title}</h2>
        {topMember && (
          <p className="mt-3 text-neutral-400">
            최다 발언:{" "}
            <span className="text-neutral-200">{topMember.name}</span> (
            {formatNumber(topMember.count)}건)
          </p>
        )}
        {!hasData && season === SEASON_1 && (
          <p className="mt-3 text-neutral-500">
            시즌 1 스냅샷이 없으면 파이프라인 실행 후 표시됩니다:{" "}
            <code className="font-mono text-sm text-accent-amber">
              python scripts/process.py KakaoTalkChats.txt --season 1
            </code>
          </p>
        )}
        {analytics?.snapshot_date && (
          <p className="mt-2 font-mono text-xs text-neutral-600">
            스냅샷: {analytics.snapshot_date}
            {isSeason2 ? " · 누적 merge" : " · 아카이브"}
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-surface-2 p-5"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-accent-cyan">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
