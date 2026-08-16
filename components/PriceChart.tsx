"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function PriceChart({ data }: { data: { t: string; v: number }[] }) {
  return (
    <div className="h-64 w-full" style={{ filter: "drop-shadow(0 0 10px rgba(245, 158, 11, 0.25))" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke="#64748B" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
          <YAxis stroke="#64748B" fontSize={11} domain={["auto", "auto"]} width={64} />
          <Tooltip
            contentStyle={{
              background: "#0F172A",
              border: "1px solid #1E40AF",
              borderRadius: 12,
              color: "#fff",
            }}
            labelStyle={{ color: "#F59E0B" }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke="#2563EB"
            strokeWidth={2}
            fill="url(#priceGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
