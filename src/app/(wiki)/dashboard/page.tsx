import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { TopBar } from "@/components/layout/TopBar";
import { getLatestAnalytics } from "@/lib/analytics";
import { parseSeasonParam, SEASON_2, SEASON_DISPLAY, topBarBreadcrumb } from "@/lib/seasons";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<{ season?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const season = parseSeasonParam(params.season);
  const analytics = await getLatestAnalytics(season);

  const dashboardTitle =
    season === SEASON_2 && SEASON_DISPLAY[SEASON_2].topBarDashboardSuffix
      ? `홈 · 대시보드 (${SEASON_DISPLAY[SEASON_2].topBarDashboardSuffix})`
      : "홈 · 대시보드";

  return (
    <>
      <TopBar
        title={dashboardTitle}
        breadcrumb={topBarBreadcrumb("대시보드", season)}
      />
      <main className="flex-1 p-4">
        <div className="mx-auto max-w-[980px]">
          <DashboardContent season={season} analytics={analytics} />
        </div>
      </main>
    </>
  );
}
