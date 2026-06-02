/** Human-readable season branding (URL/API/DB still use numeric `season`). */

export const SEASON_1 = 1 as const;
export const SEASON_2 = 2 as const;

export type SeasonNumber = typeof SEASON_1 | typeof SEASON_2;

export const SEASON_DISPLAY = {
  [SEASON_1]: {
    tabLabel: "시즌 1",
    tabSub: "아카이브",
    eraName: "실무왕 김총무",
    tag: "시즌 1 · 2025.03 — 2026.05",
    dashboardTitle: "ERP 종료 위기로 시작해 AI 도구 확산으로 마무리된 15개월",
    topBarDashboardSuffix: null as string | null,
  },
  [SEASON_2]: {
    tabLabel: "시즌 2",
    tabSub: "실무왕 박총무",
    eraName: "실무왕 박총무",
    tag: "시즌 2 · 실무왕 박총무",
    dashboardTitle: "오픈채팅 · 실무왕 박총무 시대 누적 데이터",
    topBarDashboardSuffix: "실무왕 박총무",
  },
} as const;

export function parseSeasonParam(raw: string | undefined): SeasonNumber {
  return Number(raw) === SEASON_2 ? SEASON_2 : SEASON_1;
}

export function seasonTag(season: number, fallbackFromDb?: string | null): string {
  if (season === SEASON_2) {
    return fallbackFromDb ?? SEASON_DISPLAY[SEASON_2].tag;
  }
  return SEASON_DISPLAY[SEASON_1].tag;
}

export function seasonTabText(season: number): { label: string; sub: string } {
  const d =
    season === SEASON_2 ? SEASON_DISPLAY[SEASON_2] : SEASON_DISPLAY[SEASON_1];
  return { label: d.tabLabel, sub: d.tabSub };
}
