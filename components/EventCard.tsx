"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

export type EventCardData = {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  imageUrl: string;
  currentPrice: number | null;
  price: number;
  currency: string;
  chartData: { t: string; v: number }[] | null;
  closed: boolean;
};

type Labels = {
  from: string;
  current: string;
  open: string;
  closed: string;
};

export default function EventCard({
  event,
  locale,
  labels,
}: {
  event: EventCardData;
  locale: string;
  labels: Labels;
}) {
  const spark = event.chartData && event.chartData.length > 1 ? event.chartData : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="neon-card neon-card-hover overflow-hidden group"
    >
      <Link href={`/${locale}/events/${event.slug}`} className="block">
        <div className="relative h-40 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="badge absolute left-3 top-3 border border-accent/30 bg-accent/15 text-accent-light backdrop-blur">
            {event.categoryLabel}
          </span>
          {event.closed && (
            <span className="badge absolute right-3 top-3 bg-red-900/80 text-white">
              {labels.closed}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white">{event.title}</h3>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-xs text-white/50">{labels.current}</p>
              {event.currentPrice !== null ? (
                <p className="text-xl font-bold text-primary-light">
                  {event.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                </p>
              ) : (
                <p className="text-xl font-bold text-white/40">—</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">{labels.from}</p>
              <p className="text-lg font-bold text-accent">
                {event.price} {event.currency}
              </p>
            </div>
          </div>
          {spark ? (
            <div
              className="mt-3 h-12 w-full"
              style={{ filter: "drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${event.slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fill={`url(#spark-${event.slug})`}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-3 h-12 rounded-lg bg-night-light/50" />
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-primary-light group-hover:text-accent-light transition-colors">
              {event.closed ? labels.closed : labels.open} →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
