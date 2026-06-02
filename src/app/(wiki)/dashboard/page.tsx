import { TopBar } from "@/components/layout/TopBar";

export const revalidate = 3600;

export default function DashboardPage() {
  return (
    <>
      <TopBar title="홈 · 대시보드" breadcrumb="대시보드" />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px]">
          <section className="rounded-2xl border border-border bg-surface p-8">
            <p className="font-mono text-xs text-accent-cyan">시즌 1 · 2025.03 — 2026.05</p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              ERP 종료 위기로 시작해 AI 도구 확산으로 마무리된 15개월
            </h2>
            <p className="mt-3 text-neutral-400">
              Supabase 연동 후 analytics 스냅샷이 표시됩니다. 파이프라인:{" "}
              <code className="font-mono text-sm text-accent-amber">
                python scripts/process.py KakaoTalkChats.txt --season 1
              </code>
            </p>
          </section>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "총 메시지", value: "—" },
              { label: "참여 멤버", value: "—" },
              { label: "활성 기간", value: "15개월" },
              { label: "최고 활성월", value: "2025-06" },
            ].map((card) => (
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
        </div>
      </main>
    </>
  );
}
