"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  series: { t: string; v: number }[];
  targetDate: string;
  targetValue: number;
};

export default function ForecastChart({ series, targetDate, targetValue }: Props) {
  const data = series.map((p) => ({ ...p }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke="#64748B" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis stroke="#64748B" fontSize={11} domain={["auto", "auto"]} width={64} />
          <Tooltip
            contentStyle={{
              background: "#0F172A",
              border: "1px solid #F59E0B",
              borderRadius: 12,
              color: "#fff",
            }}
            labelStyle={{ color: "#F59E0B" }}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke="#F59E0B"
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceDot
            x={targetDate}
            y={targetValue}
            r={6}
            fill="#F59E0B"
            stroke="#0B1120"
            strokeWidth={2}
            label={{ value: "🎯", position: "top", fontSize: 14 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
