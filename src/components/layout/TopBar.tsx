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
      <div className="flex items-center gap-3 font-mono text-xs text-neutral-500">
        <span className="rounded-full border border-border bg-surface px-3 py-1">
          시즌 1 아카이브
        </span>
        <span className="rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 text-accent-cyan">
          ● 시즌 2 준비
        </span>
      </div>
    </header>
  );
}
