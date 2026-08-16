import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getDict, isLocale, defaultLocale } from "@/lib/i18n";
import AdminPanel, { type AdminEvent, type AdminPayment } from "@/components/AdminPanel";

export const dynamic = "force-dynamic";

const CATEGORIES = ["GOLD", "OIL", "CURRENCY", "CRYPTO", "RATES", "OTHER"];

export default async function AdminPage({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : defaultLocale;
  const dict = getDict(locale);
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/admin`);
  if (user.role !== "ADMIN") redirect(`/${locale}`);

  const [eventsRaw, paymentsRaw] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { forecasts: true, payments: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const events: AdminEvent[] = eventsRaw.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    titleEn: e.titleEn,
    category: e.category,
    price: Number(e.price.toString()),
    currency: e.currency,
    currentPrice: e.currentPrice ? Number(e.currentPrice.toString()) : null,
    status: e.status,
    closesAt: e.closesAt ? e.closesAt.toISOString() : null,
    forecastCount: e._count.forecasts,
    paymentCount: e._count.payments,
  }));

  const payments: AdminPayment[] = paymentsRaw.map((p) => ({
    id: p.id,
    userName: p.user.name,
    userEmail: p.user.email,
    eventTitle: p.event.title,
    amount: Number(p.amount.toString()),
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="fade-in">
      <AdminPanel
        categories={CATEGORIES}
        initialEvents={events}
        initialPayments={payments}
        dict={dict.admin}
      />
    </div>
  );
}
