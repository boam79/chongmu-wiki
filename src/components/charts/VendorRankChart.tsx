"use client";

type VendorRankChartProps = {
  data: { vendor: string; count: number }[];
};

export function VendorRankChart({ data }: VendorRankChartProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-neutral-400">업체 언급 순위 (준비 중)</p>
      <ul className="mt-2 space-y-1 text-sm text-neutral-400">
        {data.map((item) => (
          <li key={item.vendor}>
            {item.vendor}: {item.count}
          </li>
        ))}
      </ul>
    </div>
  );
}
