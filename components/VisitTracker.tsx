"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();
  const base = typeof window !== "undefined" ? sessionStorage.getItem("pv:base") : null;

  useEffect(() => {
    const now = Date.now();
    const key = `pv:${pathname}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (now - last < 30000) return; // не считаем повторно ту же страницу в течение 30 сек
    sessionStorage.setItem(key, String(now));

    const payload = { path: pathname };
    try {
      navigator.sendBeacon("/api/analytics/track", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    } catch {
      void fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname, base]);

  return null;
}
