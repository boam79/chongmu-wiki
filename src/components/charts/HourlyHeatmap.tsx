"use client";

type HourlyHeatmapProps = {
  data: Record<string, Record<string, number>>;
};

export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-neutral-400">시간대·요일 히트맵 (준비 중)</p>
      <pre className="mt-2 font-mono text-xs text-neutral-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
