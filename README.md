# Lumera — маркетплейс beauty-специалистов и студий

Полноценный full-stack проект (Next.js + PostgreSQL + Prisma). Брендинг временный (название **Lumera**, иконка) — заменяется в `public/icons`, `src/components/layout/logo.tsx`, `src/i18n/messages/*.json`.

> **Статус: Этап 1 из 4 — Фундамент.** Каталог, поиск, бронирование, кабинеты, подписки и админ-панели — следующие этапы. Что готово и чего ещё нет — см. раздел «Статус этапов».

## Архитектурные решения

| Решение | Почему |
|---|---|
| **Next.js 14 (App Router) + TypeScript**, один репозиторий, backend = Route Handlers/Server Actions поверх слоя `src/server` | SSR для SEO, одна кодовая база, бизнес-логика вынесена из UI (`src/server/*`), её можно позже вынести в отдельный сервис без переписывания |
| **PostgreSQL + Prisma** | Строгие связи, миграции, типобезопасность |
| **Защита от двойных броней на уровне БД** (`EXCLUDE USING gist`, см. `prisma/manual/`) | Только констрейнт БД защищает от гонок; проверка в коде — лишь удобство |
| **Деньги — целые minor units + код валюты** | Никаких float; несколько валют без переделки |
| **Тарифы — данные (`SubscriptionPlan`)**, не константы | Super Admin меняет цены без деплоя |
| **Права — один модуль `src/server/auth/permissions.ts`**, deny-by-default | Все проверки на сервере; покрыт тестами |
| **Платежи — интерфейс `PaymentProvider` + реестр** | Stripe / LiqPay / WayForPay подключаются добавлением файла, схема БД не меняется |
| **Хранилище — интерфейс `StorageProvider`** (S3-совместимое) | Реализация — этап 3 |
| **i18n — JSON-каталоги + `Language`/`Translation` в БД** | UI-строки в файлах, контент БД (города, категории) в `Translation` |
| **Только `@prisma/client`, `zod`, `lucide-react`, `clsx`, `tailwind-merge`** из runtime-зависимостей | Минимум зависимостей = меньше рисков при `npm install` |

### Роли и права

* **Платформенные роли** (`UserRole`): `CLIENT`, `MASTER`, `STUDIO_OWNER`, `SUPER_ADMIN`.
* **Роли внутри студии** (`StudioMember`): `OWNER`, `ADMIN`, `MASTER`. Власть в студии даёт **только активная запись `StudioMember`**, а не метка роли.
* `SUPER_ADMIN` получает только `admin:*` и не становится владельцем студии или мастером.
* Студия **не владеет** профилем мастера: доступ к нему scoped и действует, пока членство `ACTIVE`; загрузка в портфолио — только при `portfolioConsent`. После ухода мастера (`ENDED`) профиль, портфолио и отзывы остаются у мастера.
* Одна строка `StudioMember` на пару (студия, пользователь) на всю историю → повторное приглашение не списывает «подключение 99 ₴» второй раз.

Матрица прав и граничные случаи — в `tests/permissions.test.ts`.

## Что нужно установить

* Node.js **20.11+** (проверено на 22), npm
* PostgreSQL **14+** (проще всего — Docker, `docker-compose.yml` в комплекте)
* Python 3 + Pillow — **только** если захотите перегенерировать иконки (`npm run icons`); готовые PNG уже в архиве

## Запуск локально

```bash
cp .env.example .env                  # затем отредактируйте (см. ниже)
docker compose up -d db               # PostgreSQL на localhost:5432
npm install                           # создаст package-lock.json
npx prisma migrate dev --name init    # создаёт таблицы и папку prisma/migrations
npm run db:constraints                # CHECK/EXCLUDE-констрейнты (двойные брони и др.) — идемпотентно
npm run db:seed                       # демо-данные
npm run dev                           # http://localhost:3000  → редирект на /uk
```

`AUTH_SECRET` сгенерируйте: `openssl rand -base64 48`.

**Важно про миграции:** в архиве нет `prisma/migrations`, потому что Prisma генерирует её, подключаясь к живой БД. Первая миграция создаётся командой `prisma migrate dev --name init` — **закоммитьте** получившуюся папку. После каждой новой миграции повторяйте `npm run db:constraints` (скрипт идемпотентный).

### Демо-данные (`npm run db:seed`)

5 студий, 20 мастеров, 5 клиентов, Super Admin, 5 городов Украины с районами, 11 категорий, 4 тарифа, услуги с ценами, график работы, портфолио-заглушки (SVG), 7 бронирований и 4 отзыва к завершённым записям. Все e-mail — `@lumera.test`, у демо-подписок стоит `isDemo = true`, **платежей нет**.

* Super Admin: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (если пароль не задан — случайный, выводится один раз в консоль).
* Остальные: пароль из `SEED_DEMO_PASSWORD`, логины `client1@lumera.test`, `owner1@lumera.test`, `<slug-мастера>@lumera.test`.
* Сид отказывается работать на непустой БД. Полный сброс: `npm run db:reset` (**удаляет все данные**).

## Production build

```bash
npm run build && npm run start        # build делает prisma generate
npx prisma migrate deploy && npm run db:constraints   # на сервере, вместо migrate dev
```

## Тесты

```bash
npm run test        # права, тарифы студии, i18n, безопасность, схема
npm run typecheck
```

## Подключение платежей (этап 4)

Сейчас есть: интерфейс, реестр, `TEST`-провайдер (HMAC-подпись вебхуков — реальная проверка) и таблицы `Payment`, `PaymentMethod`, `WebhookEvent`. `STRIPE`, `LIQPAY`, `WAYFORPAY` явно бросают `ProviderNotConfiguredError` до реализации. `TEST` запрещён в production, если не задан `ALLOW_TEST_PAYMENTS=true`. Реальные ключи — в `.env` (см. `.env.example`), в код не попадают.

## Подключение хранилища фото (этап 3)

Контракт — `src/server/storage/types.ts`, валидация файлов (magic bytes, лимиты, SVG запрещён) — `src/server/security/upload.ts`. Реализация S3-клиента добавится в этапе 3; переменные `STORAGE_*` уже в `.env.example` (подойдут AWS S3, Cloudflare R2, MinIO, Backblaze B2).

## Развёртывание на сервере

1. VPS с Docker, управляемый PostgreSQL (или контейнер с томом + бэкапы).
2. `.env` на сервере: боевые `DATABASE_URL`, `APP_URL` (https), `AUTH_SECRET`.
3. `docker build -t lumera .` → `docker run --env-file .env -p 3000:3000 lumera`.
4. Миграции: `npx prisma migrate deploy && npm run db:constraints` (один раз на релиз).
5. Reverse proxy (Caddy/Nginx) с HTTPS — **обязательно**: PWA и service worker работают только по HTTPS.
6. Rate limiting сейчас in-memory (один процесс); для нескольких инстансов нужен Redis (задача этапа 4).

## PWA

`public/manifest.webmanifest`, `public/sw.js`, иконки (в т.ч. maskable и Apple Touch Icon), офлайн-страница. Service worker регистрируется **только в production**.

* Chrome / Edge / Samsung Internet (Windows, macOS, Android): кнопка «Встановити застосунок» через `beforeinstallprompt`.
* iOS/iPadOS Safari: API установки нет — показывается подсказка «Поделиться → На экран “Домой”».
* Firefox desktop: установку PWA не поддерживает.
* **Офлайн-бронирование и офлайн-оплата НЕ реализованы** (и не будут): без сети показывается страница «Нет соединения».

## Структура

```
prisma/            schema.prisma, seed.ts, manual/ (SQL-констрейнты)
public/            manifest, sw.js, offline.html, icons/, images/placeholder/
scripts/           make-icons.py
src/app/[locale]/  страницы (layout, статус, /design-system); api/health; robots; sitemap
src/components/    ui/ (дизайн-система), layout/, pwa/
src/i18n/          config, messages/{uk,en}.json, translate, routing (hreflang)
src/lib/           cn, money, datetime, slug
src/server/        env, db, auth/ (permissions, password), billing/, payments/, storage/, security/
tests/             vitest
```

## Как расширять

* **Язык:** `src/i18n/config.ts` (TypeScript заставит заполнить `localeMeta`) → `messages/<код>.json` → `dictionaries.ts` → строка в `Language`. Тест `i18n.test.ts` проверяет, что ключи совпадают.
* **Страна/город/район/категория:** строки в БД (+ `Translation`); править код не нужно.
* **Валюта:** строка в `Currency`, цены — `ServicePrice` (по строке на валюту).
* **Платёжный провайдер:** реализовать `PaymentProvider`, зарегистрировать в `registry.ts`, добавить переменные в `env.ts`.

## Статус этапов

| Этап | Содержание | Статус |
|---|---|---|
| 1 | Схема БД, сид, i18n uk/en, права, расчёт тарифов студии, дизайн-система, PWA-оболочка, безопасность-база | **готов** (см. ограничения ниже) |
| 2 | Главная, поиск и фильтры из БД, профили мастеров/студий, SEO-URL, sitemap из БД | не начат |
| 3 | Регистрация/вход/e-mail, кабинеты мастера и клиента, бронирование и слоты, отзывы, загрузка файлов | не начат |
| 4 | Студия-админка, приглашения, подписки и платежи, Super Admin, CSP с nonce, Redis rate-limit, e2e | не начат |

### Известные ограничения этапа 1

* Код **не запускался целиком** в среде разработки (там нет доступа к npm): проверены только модули без внешних зависимостей. Компиляцию Next/React-кода, `prisma generate`, миграции и сид вы запускаете первыми — присылайте логи.
* Заголовок CSP пока не включён (нужен nonce, этап 4); остальные security-заголовки включены.
* Шапка содержит только рабочие элементы (язык, установка PWA); «Войти», «Стать партнёром», поиск появятся вместе со своими страницами.
* Без доработок по этапу 2+ в sitemap только корневые страницы локалей.
