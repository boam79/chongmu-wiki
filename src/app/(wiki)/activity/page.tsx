import { TopBar } from "@/components/layout/TopBar";

export const revalidate = 3600;

export default function ActivityPage() {
  return (
    <>
      <TopBar title="활동 데이터" breadcrumb="대시보드" />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-6 flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-accent-blue/50 bg-accent-blue/15 px-4 py-2 text-sm font-medium text-white"
            >
              시즌 1 아카이브
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm text-neutral-500"
              disabled
            >
              시즌 2 진행 중
            </button>
          </div>
          <p className="text-neutral-400">
            월별·히트맵·토픽·업체 차트는 analytics 스냅샷 연동 후 표시됩니다.
          </p>
        </div>
      </main>
    </>
  );
}
