"use client";

import { useState } from "react";

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

type AdminDict = {
  title: string;
  tabs: { events: string; payments: string };
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
  payCols: Record<string, string>;
  saved: string;
  deleted: string;
  closed: string;
  err: string;
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
  dict,
}: {
  categories: string[];
  initialEvents: AdminEvent[];
  initialPayments: AdminPayment[];
  dict: AdminDict;
}) {
  const [tab, setTab] = useState<"events" | "payments">("events");
  const [events, setEvents] = useState<AdminEvent[]>(initialEvents);
  const [payments, setPayments] = useState<AdminPayment[]>(initialPayments);
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
                  <option key={c} value={c}>
                    {c}
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
      ) : (
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
      )}
    </div>
  );
}
