"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TopicChartProps = {
  data: { topic: string; count: number }[];
};

export function TopicChart({ data }: TopicChartProps) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#2a3347" />
        <XAxis type="number" stroke="#9ca3af" />
        <YAxis type="category" dataKey="topic" width={120} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#161b27",
            border: "1px solid #2a3347",
          }}
        />
        <Bar dataKey="count" fill="#06b6d4" />
      </BarChart>
    </ResponsiveContainer>
  );
}
