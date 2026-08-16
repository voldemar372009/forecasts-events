"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${locale}`);
    router.refresh();
  }
  return (
    <button onClick={logout} className="text-sm font-medium text-white/70 transition-colors hover:text-accent">
      {label}
    </button>
  );
}
