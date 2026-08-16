# «Прогноз AI» — ИИ-прогнозы на рынки

Платформа, где посетитель выбирает событие (золото, нефть, доллар, биткоин, ставки, индексы),
выбирает дату в календаре, оплачивает прогноз (Stripe, от €50) — и **искусственный интеллект
рассчитывает прогноз**: аналитический текст, график траектории, вероятность направления и ключевые уровни.

## Стек

- **Next.js 14** (App Router, TypeScript) + Tailwind CSS + Framer Motion + Recharts
- **Prisma 6** + **PostgreSQL** (Neon.tech — без Docker)
- **Stripe** Checkout (реальные деньги, EUR)
- **OpenAI** (`gpt-4o-mini`) — генерация прогнозов
- Auth: собственный JWT (bcrypt + jose, httpOnly-cookie)
- i18n: RU / EN
- Деплой: VPS + Dokploy + Traefik (см. `docs/DEPLOY.md`)

## Быстрый старт (локально)

```bash
npm install
cp .env.example .env   # заполнить (см. docs/USER_ACCOUNTS.md)
npx prisma db push
npx prisma generate
npx prisma db seed     # админ: admin@example.com / admin123; демо-юзер: user@example.com / user123
npm run dev            # http://localhost:3000
```

> Без `STRIPE_SECRET_KEY` и `OPENAI_API_KEY` работает dev-обход: оплата считается
> выполненной, прогноз генерируется локальным ДЕМО-движком (не в production!).

## Реальные рыночные данные

Для «Нового прогноза» цена и история подтягиваются автоматически из бесплатных API (ключи не нужны):

- **Криптовалюты** — Binance (`BTC`, `ETH`, `USDT`…): реальная цена + 45 дней истории свечей
- **Валюты** — open.er-api.com (`EUR/USD`, `USD/RUB`, «Доллар», «Рубль»…)
- Золото/нефть — планируется через Alpha Vantage (бесплатный ключ)

Если источник найден, реальная цена используется вместо введённой вручную, а история
попадает в промпт ИИ и в график. См. `lib/market.ts`.

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Neon **pooled**-строка (рантайм) |
| `DIRECT_URL` | Neon **direct**-строка (миграции) |
| `JWT_SECRET` | секрет подписи сессий |
| `STRIPE_SECRET_KEY` | Stripe secret (test/live) |
| `STRIPE_WEBHOOK_SECRET` | подпись вебхука `/api/webhooks/stripe` |
| `OPENAI_API_KEY` | ключ OpenAI |
| `OPENAI_MODEL` | модель (по умолчанию `gpt-4o-mini`) |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | базовый URL сайта |

## Ключевые маршруты

- `/` — каталог событий (карточки: картинка + sparkline + цена)
- `/new-forecast` — **свой прогноз**: посетитель сам добавляет рынок/событие, выбирает дату и оплачивает
- `/events/[slug]` — событие: история цены, календарь дат, покупка прогноза
- `/forecast/[id]` — готовый прогноз (текст, график, вероятность, уровни)
- `/dashboard` — история прогнозов и статистика точности
- `/leaderboard` — рейтинг точности
- `/admin` — админ-панель (события, платежи, закрытие с расчётом точности)
- `/api/webhooks/stripe` — вебхук оплаты (событие `checkout.session.completed`)

## Как работает оплата → прогноз

1. `POST /api/forecasts/checkout` — создаётся прогноз (`PENDING`) и Stripe Checkout-сессия.
2. Вебхук `checkout.session.completed` — платёж `PAID`, запускается фоновая генерация.
3. `lib/ai.ts` — OpenAI возвращает `{direction, confidence, summaryRu, summaryEn, support, resistance, drift, volatility}`;
   в коде строится траектория графика (детерминированная, 40 точек).
4. Прогноз → `READY`; страница `/forecast/[id]` автообновляется.
5. При ошибке генерации — статус `FAILED` + кнопка «Повторить».

## Дисклеймер

Прогнозы носят информационный характер и не являются инвестиционной рекомендацией.
Точность в лидерборде — геймификационная метрика (совпадение направления прогноза
с фактической ценой на дату, которую фиксирует админ при закрытии события).

## Деплой

Полный ранбук — [`docs/DEPLOY.md`](docs/DEPLOY.md) (VPS → Dokploy → Traefik → Neon → Stripe webhook).
Чек-лист аккаунтов и ключей — [`docs/USER_ACCOUNTS.md`](docs/USER_ACCOUNTS.md).
