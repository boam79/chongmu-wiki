export function ExcelTitleBar() {
  return (
    <div className="excel-title-bar flex h-8 items-center justify-between px-3 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">총무위키</span>
        <span className="opacity-70">— Microsoft Excel</span>
      </div>
      <div className="flex items-center gap-3 opacity-90">
        <button type="button" className="hover:bg-white/10 px-1" aria-label="최소화">
          ─
        </button>
        <button type="button" className="hover:bg-white/10 px-1" aria-label="최대화">
          □
        </button>
        <button type="button" className="hover:bg-red-600 px-1.5" aria-label="닫기">
          ✕
        </button>
      </div>
    </div>
  );
}
