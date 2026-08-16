"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthDict = {
  loginTitle: string;
  registerTitle: string;
  email: string;
  name: string;
  password: string;
  submitLogin: string;
  submitRegister: string;
  noAccount: string;
  haveAccount: string;
  errors: Record<string, string>;
  logging: string;
};

export default function AuthForm({
  mode,
  locale,
  dict,
  next,
}: {
  mode: "login" | "register";
  locale: string;
  dict: AuthDict;
  next?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(dict.errors[data.error] || dict.errors.generic);
        setLoading(false);
        return;
      }
      router.push(next || `/${locale}/dashboard`);
      router.refresh();
    } catch {
      setError(dict.errors.generic);
      setLoading(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={submit} className="neon-card mx-auto w-full max-w-md p-8">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">
        {isRegister ? dict.registerTitle : dict.loginTitle}
      </h1>
      {error && (
        <div className="mb-4 rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {isRegister && (
        <div className="mb-4">
          <label className="label-form" htmlFor="name">
            {dict.name}
          </label>
          <input
            id="name"
            className="input-neon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
          />
        </div>
      )}
      <div className="mb-4">
        <label className="label-form" htmlFor="email">
          {dict.email}
        </label>
        <input
          id="email"
          type="email"
          className="input-neon"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-6">
        <label className="label-form" htmlFor="password">
          {dict.password}
        </label>
        <input
          id="password"
          type="password"
          className="input-neon"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? dict.logging : isRegister ? dict.submitRegister : dict.submitLogin}
      </button>
      <p className="mt-4 text-center text-sm text-white/60">
        {isRegister ? (
          <>
            {dict.haveAccount}{" "}
            <Link
              href={`/${locale}/auth/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-accent hover:underline"
            >
              {dict.submitLogin}
            </Link>
          </>
        ) : (
          <>
            {dict.noAccount}{" "}
            <Link
              href={`/${locale}/auth/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-accent hover:underline"
            >
              {dict.submitRegister}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
