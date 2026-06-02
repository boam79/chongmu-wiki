import { Suspense } from "react";
import { SeasonSwitcher } from "./SeasonSwitcher";

type TopBarProps = {
  title: string;
  breadcrumb?: string;
};

export function TopBar({ title, breadcrumb }: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/80 px-10 py-4 backdrop-blur-md">
      <div>
        <p className="font-mono text-xs font-semibold text-neutral-500">
          {breadcrumb ?? "총무위키"}
        </p>
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </div>
      <div className="flex-1" />
      <Suspense
        fallback={
          <div className="flex gap-2">
            <div className="h-7 w-24 animate-pulse rounded-full bg-surface" />
            <div className="h-7 w-24 animate-pulse rounded-full bg-surface" />
          </div>
        }
      >
        <SeasonSwitcher variant="topbar" />
      </Suspense>
    </header>
  );
}
