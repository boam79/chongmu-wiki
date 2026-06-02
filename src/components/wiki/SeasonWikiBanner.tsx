import { SEASON_2, SEASON_DISPLAY, type SeasonNumber } from "@/lib/seasons";

type SeasonWikiBannerProps = {
  season: SeasonNumber;
};

export function SeasonWikiBanner({ season }: SeasonWikiBannerProps) {
  if (season !== SEASON_2) {
    return null;
  }

  return (
    <section className="excel-cell-panel border-l-4 border-l-excel-title bg-excel-ribbon-hover px-4 py-3">
      <p className="font-mono text-xs font-semibold text-excel-title">
        {SEASON_DISPLAY[SEASON_2].tag}
      </p>
      <p className="mt-1 text-sm text-excel-text">
        시즌 1 아카이브 지식을 기반으로, {SEASON_DISPLAY[SEASON_2].eraName} 오픈채팅
        데이터가 반영되면 블록에 &quot;시즌 2 추가&quot; 배지가 붙습니다.
      </p>
    </section>
  );
}
