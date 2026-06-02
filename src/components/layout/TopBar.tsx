import { Suspense } from "react";
import { SeasonSwitcher } from "./SeasonSwitcher";

type TopBarProps = {
  title: string;
  breadcrumb?: string;
};

export function TopBar({ title, breadcrumb }: TopBarProps) {
  const cellRef = breadcrumb ? `${breadcrumb}!A1` : "A1";

  return (
    <header className="excel-formula-bar sticky top-0 z-40 flex items-center gap-2 px-2 py-1">
      <div className="excel-name-box flex h-6 w-16 shrink-0 items-center justify-center text-[10px] text-excel-text-muted">
        {cellRef}
      </div>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-xs text-excel-text-muted">
        fx
      </div>
      <div className="excel-formula-input flex min-h-6 flex-1 items-center px-2 py-0.5">
        <span className="text-sm font-semibold text-excel-text">{title}</span>
        {breadcrumb && (
          <span className="ml-2 text-xs text-excel-text-muted">
            — {breadcrumb}
          </span>
        )}
      </div>
      <Suspense
        fallback={
          <div className="flex gap-1">
            <div className="h-6 w-16 animate-pulse bg-excel-header" />
            <div className="h-6 w-16 animate-pulse bg-excel-header" />
          </div>
        }
      >
        <SeasonSwitcher variant="topbar" />
      </Suspense>
    </header>
  );
}
