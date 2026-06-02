import { TopBar } from "@/components/layout/TopBar";
import { getLatestAnalytics } from "@/lib/analytics";
import { parseSeasonParam, SEASON_2, SEASON_DISPLAY, topBarBreadcrumb } from "@/lib/seasons";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<{ season?: string }>;
};

function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("ko-KR");
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const season = parseSeasonParam(params.season);
  const analytics = await getLatestAnalytics(season);
  const hasData = analytics != null && (analytics.total_messages ?? 0) > 0;

  const monthly = analytics?.monthly_stats as Record<string, number> | null;
  const peakMonth = monthly
    ? Object.entries(monthly).sort(([, a], [, b]) => b - a)[0]
    : null;

  return (
    <>
      <TopBar
        title="활동 데이터"
        breadcrumb={topBarBreadcrumb("대시보드", season)}
      />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px]">
          {season === SEASON_2 && !hasData ? (
            <p className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-neutral-400">
              {SEASON_DISPLAY[SEASON_2].eraName} 활동 데이터가 아직 없습니다.{" "}
              <span className="font-mono text-accent-amber">txt 업로드 후 반영</span>
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-400">
                {hasData
                  ? `메시지 ${formatNumber(analytics?.total_messages)}건 · 멤버 ${formatNumber(analytics?.member_count)}명${
                      peakMonth
                        ? ` · 최다 월 ${peakMonth[0]} (${formatNumber(peakMonth[1])}건)`
                        : ""
                    }`
                  : "analytics 스냅샷 연동 후 차트가 표시됩니다."}
              </p>
              <p className="text-sm text-neutral-600">
                월별·히트맵·토픽·업체 차트는 다음 단계에서 연동 예정 (MVP: 요약 수치만).
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
