# DEPLOY — деплой «Прогнозы на события» на VPS (Dokploy + Traefik)

Этот ранбук собран по «Золотому стандарту» + фиксы, найденные при сборке проекта.
Выполняется в терминале на VPS (Ubuntu 24.04). SSH-доступ: `ssh root@YOUR_IP`.

## 1. Покупка VPS

- Hip-Hosting или Hostinger: 2 vCPU, 2 GB RAM, Ubuntu 24.04 LTS, ~$3–5/мес.
- Сохранить: IP-адрес, root-пароль.

## 2. Установка Dokploy

```bash
ssh root@YOUR_IP
curl -sSL https://dokploy.com/install.sh | sh
```

- Открыть `http://YOUR_IP:3000`, создать admin-аккаунт Dokploy.
- **Важно:** Dokploy ставит свой Docker + Traefik. Проверить Traefik (см. §6).

## 3. Настройка проекта в Dokploy

1. Project → новый проект `forecasts-events`.
2. Add Application → Source: GitHub-репозиторий `forecasts-events`.
3. Build: **Dockerfile** (лежит в корне репозитория) → Dokploy соберёт `node:20-alpine` + `next build`, запустит `next start -H 0.0.0.0` (фикс из «Золотого стандарта» — без него контейнер не принимает запросы).
4. В **Environment Variables** (секреты!) добавить:

```
DATABASE_URL=postgresql://<pooled-строка из Neon>?sslmode=require
DIRECT_URL=postgresql://<direct-строка из Neon>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
JWT_SECRET=<длинная случайная строка>
APP_URL=https://<домен>
NEXT_PUBLIC_APP_URL=https://<домен>
```

5. **Домен:** в настройках Application → Domains → указать `your-app-xxxxx-YOUR_IP.traefik.me` (Dokploy создаст домен автоматически) или свой домен через DNS-запись.

## 4. Миграция базы (Neon)

В репозитории (локально или через Dokploy terminal) один раз:

```bash
npx prisma db push
npx prisma generate
npx prisma db seed   # создаст админа admin@example.com / admin123 и события
```

> **КРИТИЧНО (Neon):** в `DATABASE_URL` — **pooled**-строка (для рантайма), в `DIRECT_URL` — **direct**-строка (для миграций). Если обе одинаковые pooled — `prisma db push` падает с ошибкой PgBouncer.

## 5. Stripe Webhook (после деплоя)

```bash
# на своей машине
stripe listen --forward-to https://<домен>/api/webhooks/stripe
```

или в Dashboard Stripe → Developers → Webhooks → Add endpoint:
- URL: `https://<домен>/api/webhooks/stripe`
- Событие: `checkout.session.completed`
- Скопировать подпись `whsec_...` в `STRIPE_WEBHOOK_SECRET`.

## 6. Проверка Traefik (КРИТИЧНО)

```bash
ssh root@YOUR_IP
docker service ls | grep traefik
```

Если пусто — создать вручную:

```bash
docker service create \
  --name dokploy-traefik \
  --network dokploy-network \
  --publish published=80,target=80 \
  --publish published=443,target=443 \
  --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
  --mount type=bind,source=/etc/dokploy/traefik/traefik.yml,target=/etc/traefik/traefik.yml \
  --mount type=bind,source=/etc/dokploy/traefik/dynamic,target=/etc/dokploy/traefik/dynamic \
  traefik:v3.6.1
```

## 7. Диагностика «ERR_CONNECTION_REFUSED»

1. `docker service ps <app-service> --no-trunc` — контейнер вообще запущен?
2. `docker service ls | grep traefik` — Traefik жив?
3. В приложении `package.json`: `"start": "next start -H 0.0.0.0"`.
4. `docker service logs <app-service>` — смотрит ли приложение на 0.0.0.0:3000.

## 8. Live-режим Stripe (после запуска)

- Stripe Dashboard → активировать live-режим (нужна верификация бизнеса).
- Заменить `sk_test_...` → `sk_live_...`, `whsec_test_...` → `whsec_live_...` в Dokploy env, передеплой.
- Включить **дисклеймер**: «Прогнозы носят информационный характер и не являются инвестиционной рекомендацией» (уже на страницах).
