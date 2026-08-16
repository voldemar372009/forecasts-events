# Чек-лист аккаунтов и ключей (только руками владельца)

Автоматически создать эти аккаунты невозможно — нужны твои email/телефон/платёжные данные.
Создай и пришли мне значения (или вставь сам в `.env` / Dokploy по этому списку).

## 1. GitHub — репозиторий

1. https://github.com → зарегистрироваться.
2. New repository: имя `forecasts-events`, **Public**.
3. НЕ создавать README/.gitignore (я запушу готовый код).
4. Скопировать URL репозитория (HTTPS) — пригодится для `git remote add origin`.

## 2. Neon.tech — база данных (бесплатно)

1. https://neon.tech → Sign up (GitHub/email).
2. New Project: название `forecasts-events`, регион — ближайший (Frankfurt), ветка main.
3. В разделе Connection Details скопировать **ДВЕ** строки:
   - **Pooled connection** (порт 5432, `...-pooler...`) → в `DATABASE_URL`
   - **Direct connection** (порт 5432 без pooler) → в `DIRECT_URL`
   - Формат: `postgresql://user:password@host/dbname?sslmode=require`

## 3. Stripe — платежи (тестовый режим)

1. https://dashboard.stripe.com → зарегистрироваться.
2. Developers → API keys → скопировать `sk_test_...` (Secret key) → `STRIPE_SECRET_KEY`.
3. (После деплоя) Developers → Webhooks → Add endpoint → `https://<домен>/api/webhooks/stripe`, событие `checkout.session.completed` → скопировать `whsec_...` → `STRIPE_WEBHOOK_SECRET`.
4. Тестовая карта для оплаты: `4242 4242 4242 4242`, любая дата/CVC.

## 4. OpenAI — AI-прогнозы

1. https://platform.openai.com → зарегистрироваться.
2. Billing → пополнить баланс (например $5–10).
3. API keys → Create new secret key → скопировать `sk-...` → `OPENAI_API_KEY`.
4. Модель: `gpt-4o-mini` (дешёвая; можно поменять в `lib/ai.ts`).

## 5. VPS (для деплоя, ~$3–5/мес)

1. Hip-Hosting (https://hip-hosting.com) или Hostinger.
2. Тариф: 2 vCPU / 2 GB RAM, **Ubuntu 24.04 LTS**.
3. Сохранить: IP-адрес, root-пароль. Дальше — по `docs/DEPLOY.md`.

## Куда вставить значения

| Переменная | Откуда | Куда |
|---|---|---|
| `DATABASE_URL` | Neon (Pooled) | `.env` + Dokploy env |
| `DIRECT_URL` | Neon (Direct) | `.env` + Dokploy env |
| `STRIPE_SECRET_KEY` | Stripe API keys | `.env` + Dokploy env |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhooks | Dokploy env |
| `OPENAI_API_KEY` | OpenAI API keys | `.env` + Dokploy env |
| `JWT_SECRET` | сгенерировать (см. ниже) | `.env` + Dokploy env |
| `APP_URL` / `NEXT_PUBLIC_APP_URL` | твой домен | `.env` + Dokploy env |

Генерация `JWT_SECRET` (PowerShell): `-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 48 | %{[char]$_})`
