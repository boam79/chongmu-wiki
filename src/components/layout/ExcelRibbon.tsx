const RIBBON_GROUPS = [
  {
    label: "클립보드",
    buttons: ["붙여넣기", "잘라내기", "복사"],
  },
  {
    label: "글꼴",
    buttons: ["굵게", "기울임", "밑줄"],
  },
  {
    label: "맞춤",
    buttons: ["왼쪽", "가운데", "오른쪽"],
  },
  {
    label: "표",
    buttons: ["테두리", "채우기", "서식"],
  },
] as const;

export function ExcelRibbon() {
  return (
    <div className="excel-ribbon">
      <div className="flex border-b border-excel-grid px-2">
        {["파일", "홈", "삽입", "데이터", "검토", "보기"].map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`px-3 py-1.5 text-xs ${
              i === 1
                ? "border-b-2 border-excel-title bg-white font-semibold text-excel-title"
                : "text-excel-text-muted hover:bg-white/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex gap-0 overflow-x-auto px-2 py-1.5">
        {RIBBON_GROUPS.map((group) => (
          <div
            key={group.label}
            className="flex flex-col border-r border-excel-grid px-3 last:border-r-0"
          >
            <div className="flex gap-1">
              {group.buttons.map((btn) => (
                <button
                  key={btn}
                  type="button"
                  className="rounded px-2 py-1 text-[10px] text-excel-text hover:bg-excel-ribbon-hover"
                >
                  {btn}
                </button>
              ))}
            </div>
            <span className="mt-0.5 text-center text-[9px] text-excel-text-muted">
              {group.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
