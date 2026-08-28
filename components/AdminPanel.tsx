"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export type AdminEvent = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  category: string;
  price: number;
  currency: string;
  currentPrice: number | null;
  status: string;
  closesAt: string | null;
  isCustom: boolean;
  forecastCount: number;
  paymentCount: number;
};

export type AdminPayment = {
  id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  blocked: boolean;
  forecastCount: number;
  paymentCount: number;
  createdAt: string;
  isSelf: boolean;
};

type AdminDict = {
  title: string;
  tabs: { events: string; payments: string; users: string; visits: string };
  newEvent: string;
  edit: string;
  delete: string;
  close: string;
  fields: Record<string, string>;
  save: string;
  cancel: string;
  deleteConfirm: string;
  actualPrice: string;
  closeConfirm: string;
  noEvents: string;
  noPayments: string;
  noUsers: string;
  payCols: Record<string, string>;
  saved: string;
  deleted: string;
  closed: string;
  err: string;
  usr: Record<string, string>;
  vis: Record<string, string>;
};

type FormState = {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  imageUrl: string;
  price: string;
  currency: string;
  currentPrice: string;
  closesAt: string;
};

const emptyForm: FormState = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  category: "GOLD",
  imageUrl: "",
  price: "50",
  currency: "EUR",
  currentPrice: "",
  closesAt: "",
};

export default function AdminPanel({
  categories,
  initialEvents,
  initialPayments,
  initialUsers,
  dict,
}: {
  categories: { value: string; label: string }[];
  initialEvents: AdminEvent[];
  initialPayments: AdminPayment[];
  initialUsers: AdminUser[];
  dict: AdminDict;
}) {
  const [tab, setTab] = useState<"events" | "payments" | "users" | "visits">("events");
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents);
  const [payments, setPayments] = useState<AdminPayment[]>(initialPayments);
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [visits, setVisits] = useState<{
    series: { date: string; views: number; visitors: number }[];
    topPages: { path: string; views: number }[];
    totalViews: number;
  } | null>(null);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [editing, setEditing] = useState<"new" | AdminEvent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const f = (k: keyof FormState) => (v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  function startNew() {
    setForm(emptyForm);
    setEditing("new");
  }

  function startEdit(e: AdminEvent) {
    setForm({
      title: e.title,
      titleEn: e.titleEn || "",
      description: "",
      descriptionEn: "",
      category: e.category,
      imageUrl: "",
      price: String(e.price),
      currency: e.currency,
      currentPrice: e.currentPrice !== null ? String(e.currentPrice) : "",
      closesAt: e.closesAt ? e.closesAt.slice(0, 10) : "",
    });
    setEditing(e);
  }

  async function refreshEvents() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    if (data.events) setEvents(data.events);
  }

  async function refreshPayments() {
    const res = await fetch("/api/admin/payments");
    const data = await res.json();
    if (data.payments) setPayments(data.payments);
  }

  async function refreshUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.users) setUsers(data.users);
  }

  async function updateUser(u: AdminUser, patch: { role?: "USER" | "ADMIN"; blocked?: boolean }) {
    setErr(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, ...patch }),
    });
    if (!res.ok) {
      setErr(dict.err);
      return;
    }
    setMsg(dict.saved);
    await refreshUsers();
  }

  async function loadVisits() {
    setVisitsLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (res.ok && data.series) setVisits(data);
      else setErr(dict.err);
    } catch {
      setErr(dict.err);
    } finally {
      setVisitsLoading(false);
    }
  }

  async function save() {
    setErr(null);
    const body = {
      title: form.title,
      titleEn: form.titleEn,
      description: form.description,
      descriptionEn: form.descriptionEn,
      category: form.category,
      imageUrl: form.imageUrl,
      price: Number(form.price) || 0,
      currency: form.currency,
      currentPrice: form.currentPrice === "" ? null : Number(form.currentPrice),
      closesAt: form.closesAt || null,
    };
    const isNew = editing === "new";
    const res = await fetch(isNew ? "/api/admin/events" : `/api/admin/events/${(editing as AdminEvent).id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setErr(dict.err);
      return;
    }
    setMsg(dict.saved);
    setEditing(null);
    await refreshEvents();
  }

  async function removeEvent(e: AdminEvent) {
    if (!window.confirm(dict.deleteConfirm)) return;
    const res = await fetch(`/api/admin/events/${e.id}`, { method: "DELETE" });
    if (!res.ok) {
      setErr(dict.err);
      return;
    }
    setMsg(dict.deleted);
    await refreshEvents();
  }

  async function closeEvent(e: AdminEvent) {
    if (!window.confirm(dict.closeConfirm)) return;
    const actual = window.prompt(dict.actualPrice);
    if (actual === null || actual === "") return;
    const res = await fetch(`/api/admin/events/${e.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualPrice: Number(actual) }),
    });
    if (!res.ok) {
      setErr(dict.err);
      return;
    }
    setMsg(dict.closed);
    await refreshEvents();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{dict.title}</h1>
        <div className="flex gap-2">
          <button
            className={`btn-ghost px-4 py-2 text-sm ${tab === "events" ? "!border-primary !shadow-neonSm" : ""}`}
            onClick={() => setTab("events")}
          >
            {dict.tabs.events}
          </button>
          <button
            className={`btn-ghost px-4 py-2 text-sm ${tab === "payments" ? "!border-primary !shadow-neonSm" : ""}`}
            onClick={() => {
              setTab("payments");
              void refreshPayments();
            }}
          >
            {dict.tabs.payments}
          </button>
          <button
            className={`btn-ghost px-4 py-2 text-sm ${tab === "users" ? "!border-primary !shadow-neonSm" : ""}`}
            onClick={() => {
              setTab("users");
              void refreshUsers();
            }}
          >
            {dict.tabs.users}
          </button>
          <button
            className={`btn-ghost px-4 py-2 text-sm ${tab === "visits" ? "!border-primary !shadow-neonSm" : ""}`}
            onClick={() => {
              setTab("visits");
              void loadVisits();
            }}
          >
            {dict.tabs.visits}
          </button>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-200">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-xl border border-red-700 bg-red-900/40 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      {editing && (
        <div className="neon-card mb-6 p-6">
          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label-form">{dict.fields.title}</label>
              <input className="input-neon" value={form.title} onChange={(e) => f("title")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.titleEn}</label>
              <input className="input-neon" value={form.titleEn} onChange={(e) => f("titleEn")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.description}</label>
              <textarea className="input-neon" rows={3} value={form.description} onChange={(e) => f("description")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.descriptionEn}</label>
              <textarea className="input-neon" rows={3} value={form.descriptionEn} onChange={(e) => f("descriptionEn")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.category}</label>
              <select className="input-neon" value={form.category} onChange={(e) => f("category")(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-form">{dict.fields.imageUrl}</label>
              <input className="input-neon" value={form.imageUrl} onChange={(e) => f("imageUrl")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.price}</label>
              <input className="input-neon" type="number" min="1" value={form.price} onChange={(e) => f("price")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.currency}</label>
              <input className="input-neon" value={form.currency} onChange={(e) => f("currency")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.currentPrice}</label>
              <input className="input-neon" type="number" step="any" value={form.currentPrice} onChange={(e) => f("currentPrice")(e.target.value)} />
            </div>
            <div>
              <label className="label-form">{dict.fields.closesAt}</label>
              <input className="input-neon" type="date" value={form.closesAt} onChange={(e) => f("closesAt")(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={save}>
              {dict.save}
            </button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              {dict.cancel}
            </button>
          </div>
        </div>
      )}

      {tab === "events" ? (
        <div className="neon-card overflow-x-auto">
          {events.length === 0 ? (
            <p className="p-6 text-white/50">{dict.noEvents}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-night-line text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3">Событие</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Цена</th>
                  <th className="px-4 py-3">Текущая</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Прогнозы</th>
                  <th className="px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-night-line/50 last:border-0">
                    <td className="px-4 py-3 font-medium text-white">
                      {e.title}{" "}
                      {e.isCustom && (
                        <span className="badge ml-1 bg-night-light text-accent-light">custom</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">{e.slug}</td>
                    <td className="px-4 py-3 text-accent">
                      {e.price} {e.currency}
                    </td>
                    <td className="px-4 py-3 text-white/70">{e.currentPrice ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${e.status === "ACTIVE" ? "bg-primary text-white" : "bg-night-light text-white/60"}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{e.forecastCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => startEdit(e)}>
                          {dict.edit}
                        </button>
                        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => closeEvent(e)}>
                          {dict.close}
                        </button>
                        <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => removeEvent(e)}>
                          {dict.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="border-t border-night-line p-4">
            <button className="btn-primary" onClick={startNew}>
              + {dict.newEvent}
            </button>
          </div>
        </div>
      ) : tab === "payments" ? (
        <div className="neon-card overflow-x-auto">
          {payments.length === 0 ? (
            <p className="p-6 text-white/50">{dict.noPayments}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-night-line text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3">{dict.payCols.user}</th>
                  <th className="px-4 py-3">{dict.payCols.event}</th>
                  <th className="px-4 py-3">{dict.payCols.amount}</th>
                  <th className="px-4 py-3">{dict.payCols.status}</th>
                  <th className="px-4 py-3">{dict.payCols.date}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-night-line/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.userName}</p>
                      <p className="text-xs text-white/40">{p.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-white/80">{p.eventTitle}</td>
                    <td className="px-4 py-3 text-accent">
                      {p.amount} {p.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          p.status === "PAID" ? "bg-emerald-900/70 text-emerald-200" : "bg-night-light text-white/60"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : tab === "users" ? (
        <div className="neon-card overflow-x-auto">
          {users.length === 0 ? (
            <p className="p-6 text-white/50">{dict.noUsers}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-night-line text-xs uppercase tracking-wide text-white/50">
                  <th className="px-4 py-3">{dict.usr.user}</th>
                  <th className="px-4 py-3">{dict.usr.role}</th>
                  <th className="px-4 py-3">{dict.usr.status}</th>
                  <th className="px-4 py-3">{dict.usr.forecasts}</th>
                  <th className="px-4 py-3">{dict.usr.payments}</th>
                  <th className="px-4 py-3">{dict.usr.registered}</th>
                  <th className="px-4 py-3">{dict.usr.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-night-line/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {u.name}
                        {u.isSelf && <span className="badge ml-1.5 bg-night-light text-accent-light">{dict.usr.you}</span>}
                      </p>
                      <p className="text-xs text-white/40">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === "ADMIN" ? "bg-primary text-white" : "bg-night-light text-white/60"}`}>
                        {u.role === "ADMIN" ? dict.usr.adminRole : dict.usr.userRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.blocked ? "bg-red-900/70 text-red-200" : "bg-emerald-900/70 text-emerald-200"}`}>
                        {u.blocked ? dict.usr.blocked : dict.usr.active}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70">{u.forecastCount}</td>
                    <td className="px-4 py-3 text-white/70">{u.paymentCount}</td>
                    <td className="px-4 py-3 text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {!u.isSelf && (
                          <>
                            <button
                              className="btn-ghost px-3 py-1.5 text-xs"
                              onClick={() => updateUser(u, { blocked: !u.blocked })}
                            >
                              {u.blocked ? dict.usr.unblock : dict.usr.block}
                            </button>
                            <button
                              className={`px-3 py-1.5 text-xs ${
                                u.role === "ADMIN" ? "btn-ghost" : "btn-primary"
                              }`}
                              onClick={() => updateUser(u, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}
                            >
                              {u.role === "ADMIN" ? dict.usr.makeUser : dict.usr.makeAdmin}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visitsLoading && <p className="text-white/50">{dict.vis.loading}</p>}
          {!visitsLoading && visits === null && <p className="text-white/50">{dict.vis.empty}</p>}
          {!visitsLoading && visits && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="neon-card p-5">
                  <p className="text-xs uppercase tracking-wide text-white/50">{dict.vis.total30}</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {visits.series.reduce((a, b) => a + b.views, 0)}
                  </p>
                </div>
                <div className="neon-card p-5">
                  <p className="text-xs uppercase tracking-wide text-white/50">{dict.vis.unique30}</p>
                  <p className="mt-1 text-3xl font-bold text-white">
                    {visits.series.reduce((a, b) => a + b.visitors, 0)}
                  </p>
                </div>
                <div className="neon-card p-5">
                  <p className="text-xs uppercase tracking-wide text-white/50">{dict.vis.totalAll}</p>
                  <p className="mt-1 text-3xl font-bold text-white">{visits.totalViews}</p>
                </div>
              </div>

              <div className="neon-card p-5">
                <h3 className="mb-4 font-semibold text-white">{dict.vis.chartTitle}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visits.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis stroke="#64748B" fontSize={11} width={48} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "#0F172A",
                          border: "1px solid #F59E0B",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                        labelStyle={{ color: "#F59E0B" }}
                        formatter={(value: unknown, name: unknown) => [
                          String(value),
                          String(name) === "views" ? dict.vis.views : dict.vis.visitors,
                        ]}
                        labelFormatter={(v: unknown) => String(v)}
                      />
                      <Area type="monotone" dataKey="views" stroke="#F59E0B" strokeWidth={2} fill="url(#viewsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="neon-card overflow-x-auto">
                {visits.topPages.length === 0 ? (
                  <p className="p-6 text-white/50">{dict.vis.noTop}</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-night-line text-xs uppercase tracking-wide text-white/50">
                        <th className="px-4 py-3">{dict.vis.page}</th>
                        <th className="px-4 py-3 text-right">{dict.vis.views}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.topPages.map((p, i) => (
                        <tr key={p.path} className="border-b border-night-line/50 last:border-0">
                          <td className="px-4 py-3 font-mono text-xs text-white/80">
                            <span className="mr-2 text-white/40">{i + 1}.</span>
                            {p.path}
                          </td>
                          <td className="px-4 py-3 text-right text-white/70">{p.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
