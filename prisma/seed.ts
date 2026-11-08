/**
 * Demo seed: 5 studios, 20 masters, 5 clients, 1 super admin, Ukrainian cities, categories, plans, translations,
 * services with prices, portfolio placeholders, schedules, a few bookings and reviews.
 *
 * - Refuses to run on a non-empty database (use `npm run db:reset`) unless SEED_FORCE=true.
 * - Creates NO payments and NO real people: all e-mails are @lumera.test; demo subscriptions are flagged isDemo.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import { hashPassword } from '../src/server/auth/password';
import { slugify } from '../src/lib/slug';
import { randomBytes } from 'node:crypto';

const db = new PrismaClient();

type Cat = { icon: string; uk: string; en: string; subs: [string, string][] };
const CATEGORIES: Record<string, Cat> = {
  tattoo: { icon: 'PenTool', uk: 'Татуювання', en: 'Tattoo', subs: [['Японський стиль', 'Japanese'], ['Fine line', 'Fine line'], ['Блекворк', 'Blackwork'], ['Реалізм', 'Realism'], ['Перекриття', 'Cover-up']] },
  piercing: { icon: 'Gem', uk: 'Пірсинг', en: 'Piercing', subs: [['Вуха', 'Ears'], ['Ніс', 'Nose']] },
  nails: { icon: 'Sparkles', uk: 'Нейл-арт', en: 'Nail art', subs: [['Дизайн', 'Design'], ['Нарощування', 'Extensions']] },
  'manicure-pedicure': { icon: 'Hand', uk: 'Манікюр і педикюр', en: 'Manicure & pedicure', subs: [['Манікюр', 'Manicure'], ['Педикюр', 'Pedicure']] },
  eyebrows: { icon: 'Eye', uk: 'Брови', en: 'Eyebrows', subs: [['Ламінування', 'Lamination'], ['Корекція', 'Shaping']] },
  lashes: { icon: 'Eye', uk: 'Вії', en: 'Lashes', subs: [['Класика', 'Classic'], ["Об'єм", 'Volume']] },
  hair: { icon: 'Scissors', uk: 'Перукарі', en: 'Hairdressers', subs: [['Стрижка', 'Haircut'], ['Фарбування', 'Colouring'], ['Укладка', 'Styling']] },
  barber: { icon: 'Scissors', uk: 'Барбери', en: 'Barbers', subs: [['Стрижка', 'Haircut'], ['Борода', 'Beard']] },
  makeup: { icon: 'Palette', uk: 'Візажисти', en: 'Makeup artists', subs: [['Денний', 'Day'], ['Вечірній', 'Evening']] },
  cosmetology: { icon: 'Flower2', uk: 'Косметологи', en: 'Cosmetologists', subs: [['Чистка', 'Cleansing'], ['Пілінг', 'Peeling']] },
  massage: { icon: 'HeartHandshake', uk: 'Масаж', en: 'Massage', subs: [['Класичний', 'Classic'], ['Релакс', 'Relax']] },
};

// name, minutes, UAH base price, "from" price?
const SERVICE_TEMPLATES: Record<string, [string, number, number, boolean][]> = {
  tattoo: [['Тату малого розміру', 120, 3000, true], ['Тату середнього розміру', 240, 6000, true], ['Консультація та ескіз', 30, 300, false]],
  piercing: [['Пірсинг вуха', 30, 600, false], ['Пірсинг носа', 30, 700, false]],
  nails: [['Манікюр з покриттям', 120, 900, false], ['Дизайн нігтів', 60, 400, true]],
  'manicure-pedicure': [['Класичний манікюр', 60, 600, false], ['Педикюр', 90, 800, false]],
  eyebrows: [['Корекція та фарбування брів', 60, 550, false], ['Ламінування брів', 60, 700, false]],
  lashes: [['Нарощування вій: класика', 150, 1100, false], ["Нарощування вій: об'єм", 180, 1400, false]],
  hair: [['Жіноча стрижка', 60, 900, false], ['Фарбування', 180, 2500, true], ['Укладка', 45, 700, false]],
  barber: [['Чоловіча стрижка', 45, 600, false], ['Догляд за бородою', 30, 400, false]],
  makeup: [['Денний макіяж', 60, 1200, false], ['Вечірній макіяж', 90, 1800, false]],
  cosmetology: [['Чистка обличчя', 90, 1500, false], ['Пілінг', 60, 1300, false]],
  massage: [['Класичний масаж спини', 60, 1000, false], ['Масаж усього тіла', 90, 1600, false]],
};

const CITIES = [
  { slug: 'kyiv', uk: 'Київ', en: 'Kyiv', lat: 50.4501, lng: 30.5234, factor: 1.2, districts: [['Поділ', 'Podil'], ['Печерськ', 'Pechersk'], ['Оболонь', 'Obolon'], ["Лук'янівка", 'Lukianivka']] },
  { slug: 'lviv', uk: 'Львів', en: 'Lviv', lat: 49.8397, lng: 24.0297, factor: 1.0, districts: [['Галицький', 'Halytskyi'], ['Франківський', 'Frankivskyi'], ['Шевченківський', 'Shevchenkivskyi'], ['Сихівський', 'Sykhivskyi'], ['Личаківський', 'Lychakivskyi']] },
  { slug: 'kharkiv', uk: 'Харків', en: 'Kharkiv', lat: 49.9935, lng: 36.2304, factor: 0.9, districts: [['Салтівка', 'Saltivka'], ['Центр', 'Centre']] },
  { slug: 'odesa', uk: 'Одеса', en: 'Odesa', lat: 46.4825, lng: 30.7233, factor: 0.95, districts: [['Приморський', 'Prymorskyi'], ['Аркадія', 'Arkadia']] },
  { slug: 'dnipro', uk: 'Дніпро', en: 'Dnipro', lat: 48.4647, lng: 35.0462, factor: 0.9, districts: [['Центр', 'Centre'], ['Соборний', 'Sobornyi']] },
] as const;

const STUDIOS = [
  { key: 'ink', name: 'Ink & Ember Tattoo Studio', city: 'lviv', cats: ['tattoo', 'piercing'], owner: ['Тарас', 'Романюк'], street: 'вул. Городоцька, 24', about: 'Студія татуювання в центрі Львова: індивідуальні ескізи, стерильність і спокійна атмосфера.' },
  { key: 'velvet', name: 'Velvet Beauty Lab', city: 'kyiv', cats: ['nails', 'manicure-pedicure', 'lashes', 'eyebrows', 'makeup', 'hair'], owner: ['Ольга', 'Іваненко'], street: 'вул. Сагайдачного, 12', about: 'Б’юті-простір на Подолі: нігті, вії, брови, макіяж і волосся в одному місці.' },
  { key: 'atelier', name: 'Atelier Noir Barbershop', city: 'kyiv', cats: ['barber', 'hair'], owner: ['Сергій', 'Кучер'], street: 'вул. Жилянська, 59', about: 'Барбершоп і чоловічий догляд: класичні та сучасні стрижки, борода, укладка.' },
  { key: 'seaside', name: 'Seaside Beauty House', city: 'odesa', cats: ['hair', 'nails', 'manicure-pedicure', 'cosmetology', 'massage'], owner: ['Алла', 'Чорновіл'], street: 'вул. Дерибасівська, 8', about: 'Салон краси біля моря: волосся, нігті, косметологія та масаж.' },
  { key: 'dnipro', name: 'Skin & Body Studio', city: 'dnipro', cats: ['cosmetology', 'massage'], owner: ['Павло', 'Зінченко'], street: 'просп. Дмитра Яворницького, 40', about: 'Студія догляду за шкірою та тілом у центрі Дніпра.' },
] as const;

// first, last, city, categories, studio keys (active), extra
const MASTERS: { f: string; l: string; city: string; cats: string[]; studios: string[]; ended?: string; male?: boolean }[] = [
  { f: 'Олена', l: 'Коваль', city: 'lviv', cats: ['tattoo'], studios: ['ink'] },
  { f: 'Дмитро', l: 'Мельник', city: 'lviv', cats: ['tattoo'], studios: ['ink'], male: true },
  { f: 'Іван', l: 'Шевчук', city: 'lviv', cats: ['tattoo'], studios: ['ink'], male: true },
  { f: 'Софія', l: 'Бондар', city: 'lviv', cats: ['piercing'], studios: ['ink'] },
  { f: 'Марія', l: 'Ткаченко', city: 'kyiv', cats: ['nails', 'manicure-pedicure'], studios: ['velvet'] },
  { f: 'Анна', l: 'Кравчук', city: 'kyiv', cats: ['lashes'], studios: ['velvet'] },
  { f: 'Вікторія', l: 'Олійник', city: 'kyiv', cats: ['eyebrows', 'makeup'], studios: ['velvet'] },
  { f: 'Катерина', l: 'Лисенко', city: 'kyiv', cats: ['hair'], studios: ['velvet', 'atelier'] },
  { f: 'Андрій', l: 'Гончаренко', city: 'kyiv', cats: ['barber'], studios: ['atelier'], male: true },
  { f: 'Максим', l: 'Поліщук', city: 'kyiv', cats: ['barber'], studios: ['atelier'], male: true },
  { f: 'Юлія', l: 'Савчук', city: 'odesa', cats: ['hair'], studios: ['seaside'] },
  { f: 'Тетяна', l: 'Руденко', city: 'odesa', cats: ['nails', 'manicure-pedicure'], studios: ['seaside'] },
  { f: 'Олексій', l: 'Мороз', city: 'odesa', cats: ['massage'], studios: ['seaside'], male: true },
  { f: 'Наталія', l: 'Дорошенко', city: 'dnipro', cats: ['cosmetology'], studios: ['dnipro'] },
  { f: 'Ірина', l: 'Павленко', city: 'dnipro', cats: ['massage', 'cosmetology'], studios: ['dnipro'] },
  { f: 'Богдан', l: 'Яценко', city: 'lviv', cats: ['tattoo'], studios: [], male: true },
  { f: 'Леся', l: 'Гринчишин', city: 'lviv', cats: ['nails', 'manicure-pedicure'], studios: [] },
  { f: 'Оксана', l: 'Стельмах', city: 'odesa', cats: ['hair', 'makeup'], studios: [], ended: 'seaside' },
  { f: 'Роман', l: 'Левченко', city: 'kharkiv', cats: ['barber', 'hair'], studios: [], male: true },
  { f: 'Христина', l: 'Данилюк', city: 'kharkiv', cats: ['lashes', 'eyebrows'], studios: [] },
];

const CLIENTS = [['Анастасія', 'Мартинюк'], ['Віталій', 'Остапчук'], ['Дарина', 'Захарченко'], ['Євген', 'Кулик'], ['Злата', 'Пономаренко']];

const BIOS = [
  'Працюю з любов’ю до деталей. Стерильні матеріали, індивідуальний підхід до кожного клієнта.',
  'Понад кілька років практики. Допоможу підібрати рішення, яке підійде саме вам.',
  'Люблю чисті лінії та акуратну роботу. Записуйтесь — обговоримо ваші побажання.',
];

const round10 = (n: number) => Math.round(n / 10) * 10;

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  if ((await db.user.count()) > 0 && process.env.SEED_FORCE !== 'true') {
    console.error('Database is not empty. Use `npm run db:reset` (drops all data) or set SEED_FORCE=true.');
    process.exit(1);
  }
  const demoPassword = process.env.SEED_DEMO_PASSWORD || (isProd ? '' : 'Demo12345!');
  if (!demoPassword) throw new Error('SEED_DEMO_PASSWORD is required when NODE_ENV=production');
  const adminPasswordPlain = process.env.SEED_ADMIN_PASSWORD || randomBytes(12).toString('base64url');
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lumera.test';

  const now = new Date();
  const demoHash = await hashPassword(demoPassword);
  const adminHash = await hashPassword(adminPasswordPlain);
  const translations: Prisma.TranslationCreateManyInput[] = [];
  const tr = (entityType: string, entityId: string, field: string, uk: string, en: string) =>
    translations.push({ entityType, entityId, field, locale: 'uk', value: uk }, { entityType, entityId, field, locale: 'en', value: en });

  // ── reference data ──
  await db.language.createMany({ data: [
    { code: 'uk', name: 'Українська', isActive: true, isDefault: true, sortOrder: 1 },
    { code: 'en', name: 'English', isActive: true, sortOrder: 2 },
    { code: 'pl', name: 'Polski', isActive: false, sortOrder: 3 },
    { code: 'de', name: 'Deutsch', isActive: false, sortOrder: 4 },
    { code: 'ru', name: 'Русский', isActive: false, sortOrder: 5 },
  ] });
  await db.currency.createMany({ data: [
    { code: 'UAH', symbol: '₴', isActive: true, sortOrder: 1 },
    { code: 'EUR', symbol: '€', isActive: false, sortOrder: 2 },
    { code: 'USD', symbol: '$', isActive: false, sortOrder: 3 },
    { code: 'PLN', symbol: 'zł', isActive: false, sortOrder: 4 },
  ] });

  const ua = await db.country.create({ data: { code: 'UA', slug: 'ukraine', name: 'Ukraine', currency: 'UAH', sortOrder: 1 } });
  tr('country', ua.id, 'name', 'Україна', 'Ukraine');
  const pl = await db.country.create({ data: { code: 'PL', slug: 'poland', name: 'Poland', currency: 'PLN', isActive: false, sortOrder: 2 } });
  tr('country', pl.id, 'name', 'Польща', 'Poland');

  const cityBySlug = new Map<string, { id: string; factor: number; districts: Map<string, string> }>();
  for (const [i, c] of CITIES.entries()) {
    const city = await db.city.create({ data: { countryId: ua.id, slug: c.slug, name: c.en, latitude: c.lat, longitude: c.lng, isPopular: true, sortOrder: i + 1 } });
    tr('city', city.id, 'name', c.uk, c.en);
    const districts = new Map<string, string>();
    for (const [duk, den] of c.districts) {
      const d = await db.district.create({ data: { cityId: city.id, slug: slugify(den), name: den } });
      tr('district', d.id, 'name', duk, den);
      districts.set(den, d.id);
    }
    cityBySlug.set(c.slug, { id: city.id, factor: c.factor, districts });
  }

  const catBySlug = new Map<string, string>();
  for (const [i, [slug, c]] of Object.entries(CATEGORIES).entries()) {
    const cat = await db.category.create({ data: { slug, name: c.en, icon: c.icon, sortOrder: i + 1 } });
    tr('category', cat.id, 'name', c.uk, c.en);
    catBySlug.set(slug, cat.id);
    for (const [j, [suk, sen]] of c.subs.entries()) {
      const sub = await db.subcategory.create({ data: { categoryId: cat.id, slug: slugify(sen), name: sen, sortOrder: j + 1 } });
      tr('subcategory', sub.id, 'name', suk, sen);
    }
  }

  const plans: Prisma.SubscriptionPlanCreateManyInput[] = [
    { code: 'basic', kind: 'INDIVIDUAL', name: 'Basic', priceMinor: 29900, features: { portfolioItems: 20 }, sortOrder: 1 },
    { code: 'pro', kind: 'INDIVIDUAL', name: 'Pro', priceMinor: 44900, features: { portfolioItems: 60 }, sortOrder: 2 },
    { code: 'premium', kind: 'INDIVIDUAL', name: 'Premium', priceMinor: 59900, features: { portfolioItems: 200, featuredPlacement: true }, sortOrder: 3 },
    { code: 'studio_base', kind: 'STUDIO', name: 'Studio Base', priceMinor: 49900, seatPriceMinor: 14900, connectionFeeMinor: 9900, features: { branches: 3 }, sortOrder: 4 },
  ];
  await db.subscriptionPlan.createMany({ data: plans });
  const planByCode = new Map((await db.subscriptionPlan.findMany()).map((p) => [p.code, p.id]));

  await db.siteSetting.createMany({ data: [
    { key: 'platform.multiStudioMasters', value: true },
    { key: 'platform.gracePeriodDays', value: 7 },
    { key: 'platform.paymentRetryDays', value: [1, 3, 5] },
    { key: 'home.sections', value: ['categories', 'masters', 'studios', 'cities', 'benefits', 'partner'] },
  ] });

  // ── users ──
  const mkUser = (email: string, f: string, l: string, role: 'CLIENT' | 'MASTER' | 'STUDIO_OWNER' | 'SUPER_ADMIN', hash = demoHash, phone?: string) =>
    db.user.create({
      data: { email, firstName: f, lastName: l, passwordHash: hash, phone, emailVerifiedAt: now, roles: { create: { role } } },
    });

  const admin = await mkUser(adminEmail, 'Platform', 'Admin', 'SUPER_ADMIN', adminHash);
  const clients = [];
  for (const [i, [f, l]] of CLIENTS.entries()) clients.push(await mkUser(`client${i + 1}@lumera.test`, f, l, 'CLIENT', demoHash, `+38050000${String(i + 1).padStart(4, '0')}`));

  // ── studios ──
  const studioByKey = new Map<string, { id: string; ownerId: string; branchId: string; cityId: string }>();
  for (const [i, s] of STUDIOS.entries()) {
    const city = cityBySlug.get(s.city)!;
    const owner = await mkUser(`owner${i + 1}@lumera.test`, s.owner[0], s.owner[1], 'STUDIO_OWNER');
    const address = await db.address.create({ data: { countryId: ua.id, cityId: city.id, line1: s.street } });
    const studio = await db.studioProfile.create({
      data: {
        ownerId: owner.id, slug: slugify(s.name), name: s.name, description: s.about, cityId: city.id, addressId: address.id,
        email: `hello@${slugify(s.name)}.lumera.test`, phone: `+3803200000${i}0`,
        logoUrl: `/images/placeholder/avatar-${(i % 6) + 1}.svg`, coverUrl: `/images/placeholder/cover-${(i % 4) + 1}.svg`,
        socials: { instagram: slugify(s.name) }, status: 'PUBLISHED', publishedAt: now,
        categories: { create: s.cats.map((c) => ({ categoryId: catBySlug.get(c)! })) },
        photos: { create: [1, 2, 3].map((n) => ({ url: `/images/placeholder/interior-${n}.svg`, sortOrder: n })) },
      },
    });
    const branch = await db.studioBranch.create({ data: { studioId: studio.id, name: s.name, addressId: address.id, isMain: true } });
    await db.studioMember.create({ data: { studioId: studio.id, userId: owner.id, role: 'OWNER', branchId: branch.id, countsAsSeat: false } });
    await db.subscription.create({ data: {
      planId: planByCode.get('studio_base')!, ownerType: 'STUDIO', studioId: studio.id, status: 'ACTIVE', isDemo: true,
      currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30 * 864e5), nextBillingAt: new Date(now.getTime() + 30 * 864e5),
    } });
    studioByKey.set(s.key, { id: studio.id, ownerId: owner.id, branchId: branch.id, cityId: city.id });
  }

  // ── masters ──
  const masterIds: { id: string; userId: string; cats: string[]; city: string; studios: string[]; serviceIds: { id: string; dur: number; buffer: number; price: number }[] }[] = [];
  const planCycle = ['basic', 'pro', 'premium'];
  for (const [i, m] of MASTERS.entries()) {
    const city = cityBySlug.get(m.city)!;
    const slug = slugify(`${m.f} ${m.l}`);
    const user = await mkUser(`${slug}@lumera.test`, m.f, m.l, 'MASTER', demoHash, `+38067000${String(i + 1).padStart(4, '0')}`);
    const solo = m.studios.length === 0;
    const address = solo ? await db.address.create({ data: { countryId: ua.id, cityId: city.id, line1: `вул. Демонстраційна, ${10 + i}` } }) : null;
    const master = await db.masterProfile.create({
      data: {
        userId: user.id, slug, displayName: `${m.f} ${m.l}`,
        headline: m.cats.map((c) => CATEGORIES[c]!.uk).join(' · '), bio: BIOS[i % BIOS.length],
        experienceSince: 2012 + (i % 11), gender: m.male ? 'male' : 'female', showGender: false,
        cityId: city.id, addressId: address?.id ?? null, workAreaNote: solo ? 'Індивідуальний кабінет, за попереднім записом' : null,
        avatarUrl: `/images/placeholder/avatar-${(i % 6) + 1}.svg`, coverUrl: `/images/placeholder/cover-${(i % 4) + 1}.svg`,
        contactEmail: `${slug}@lumera.test`, socials: { instagram: slug.replace(/-/g, '.') },
        status: 'PUBLISHED', publishedAt: now,
        categories: { create: m.cats.map((c) => ({ categoryId: catBySlug.get(c)! })) },
        portfolio: { create: Array.from({ length: 6 }, (_, n) => ({
          url: `/images/placeholder/portfolio-${((i + n) % 8) + 1}.svg`, caption: `Робота ${n + 1}`, sortOrder: n,
          categoryId: catBySlug.get(m.cats[n % m.cats.length]!)!, uploadedByUserId: user.id,
        })) },
        hours: { create: [
          ...[0, 1, 2, 3, 4].flatMap((weekday) => [
            { weekday, startMinute: 10 * 60, endMinute: 14 * 60 }, { weekday, startMinute: 15 * 60, endMinute: 19 * 60 },
          ]),
          ...(i % 2 === 0 ? [{ weekday: 5, startMinute: 11 * 60, endMinute: 16 * 60 }] : []),
        ] },
      },
    });
    await db.subscription.create({ data: {
      planId: planByCode.get(planCycle[i % 3]!)!, ownerType: 'USER', userId: user.id, status: 'ACTIVE', isDemo: true,
      currentPeriodStart: now, currentPeriodEnd: new Date(now.getTime() + 30 * 864e5), nextBillingAt: new Date(now.getTime() + 30 * 864e5),
    } });

    const tier = 0.9 + (i % 5) * 0.1;
    const serviceIds: { id: string; dur: number; buffer: number; price: number }[] = [];
    for (const cat of m.cats) {
      for (const [name, dur, base, from] of SERVICE_TEMPLATES[cat]!) {
        const price = round10(base * city.factor * tier);
        const svc = await db.service.create({ data: {
          masterId: master.id, categoryId: catBySlug.get(cat)!, name, durationMin: dur, bufferMin: 15,
          prices: { create: { currency: 'UAH', amountMinor: price * 100, isFrom: from } },
        } });
        serviceIds.push({ id: svc.id, dur, buffer: 15, price: price * 100 });
      }
    }

    for (const key of m.studios) {
      const st = studioByKey.get(key)!;
      await db.studioMember.create({ data: {
        studioId: st.id, userId: user.id, masterId: master.id, role: 'MASTER', branchId: st.branchId,
        portfolioConsent: i % 2 === 0, connectionFeePaidAt: now,
      } });
    }
    if (m.ended) {
      const st = studioByKey.get(m.ended)!;
      await db.studioMember.create({ data: {
        studioId: st.id, userId: user.id, masterId: master.id, role: 'MASTER', status: 'ENDED',
        connectionFeePaidAt: new Date(now.getTime() - 200 * 864e5), joinedAt: new Date(now.getTime() - 200 * 864e5), leftAt: new Date(now.getTime() - 30 * 864e5),
      } });
    }
    masterIds.push({ id: master.id, userId: user.id, cats: m.cats, city: m.city, studios: m.studios, serviceIds });
  }

  // ── bookings & reviews (no overlaps; instants at 08:00 UTC = 10:00/11:00 Kyiv, inside working hours) ──
  const dayAt = (offsetDays: number, hourUtc = 8) => {
    const d = new Date(now); d.setUTCDate(d.getUTCDate() + offsetDays); d.setUTCHours(hourUtc, 0, 0, 0);
    while ([0, 6].includes(d.getUTCDay())) d.setUTCDate(d.getUTCDate() + 1); // keep to Mon–Fri
    return d;
  };
  const plan: { master: number; client: number; offset: number; status: 'COMPLETED' | 'CONFIRMED' | 'PENDING'; rating?: number; text?: string }[] = [
    { master: 0, client: 0, offset: -21, status: 'COMPLETED', rating: 5, text: '(демо) Чудова робота, дуже уважний майстер.' },
    { master: 4, client: 1, offset: -14, status: 'COMPLETED', rating: 5, text: '(демо) Манікюр ідеальний, рекомендую.' },
    { master: 8, client: 2, offset: -10, status: 'COMPLETED', rating: 4, text: '(демо) Гарна стрижка, трохи довго чекали.' },
    { master: 10, client: 3, offset: -7, status: 'COMPLETED', rating: 5, text: '(демо) Дякую! Усе на високому рівні.' },
    { master: 0, client: 4, offset: 3, status: 'CONFIRMED' },
    { master: 5, client: 0, offset: 4, status: 'CONFIRMED' },
    { master: 13, client: 1, offset: 5, status: 'PENDING' },
  ];
  for (const p of plan) {
    const m = masterIds[p.master]!; const svc = m.serviceIds[0]!; const client = clients[p.client]!;
    const startsAt = dayAt(p.offset); const endsAt = new Date(startsAt.getTime() + (svc.dur + svc.buffer) * 60_000);
    const studioKey = m.studios[0]; const st = studioKey ? studioByKey.get(studioKey) : undefined;
    const booking = await db.booking.create({ data: {
      clientId: client.id, masterId: m.id, studioId: st?.id, branchId: st?.branchId, serviceId: svc.id, startsAt, endsAt,
      timezone: 'Europe/Kyiv', status: p.status, priceMinor: svc.price, currency: 'UAH',
      clientName: `${client.firstName} ${client.lastName}`, clientPhone: client.phone ?? '+380500000000', clientEmail: client.email,
    } });
    if (p.status === 'COMPLETED') {
      await db.review.create({ data: {
        bookingId: booking.id, authorId: client.id, masterId: m.id, studioId: st?.id, rating: p.rating!, text: p.text,
        status: 'PUBLISHED', publishedAt: now,
      } });
    }
  }

  // aggregates from PUBLISHED reviews
  for (const m of await db.masterProfile.findMany({ select: { id: true } })) {
    const a = await db.review.aggregate({ where: { masterId: m.id, status: 'PUBLISHED' }, _avg: { rating: true }, _count: true });
    const bookings = await db.booking.count({ where: { masterId: m.id, status: { in: ['COMPLETED', 'CONFIRMED'] } } });
    if (a._count > 0) await db.masterProfile.update({ where: { id: m.id }, data: { ratingAvg: a._avg.rating ?? 0, ratingCount: a._count, bookingCount: bookings } });
  }
  for (const s of await db.studioProfile.findMany({ select: { id: true } })) {
    const a = await db.review.aggregate({ where: { studioId: s.id, status: 'PUBLISHED' }, _avg: { rating: true }, _count: true });
    if (a._count > 0) await db.studioProfile.update({ where: { id: s.id }, data: { ratingAvg: a._avg.rating ?? 0, ratingCount: a._count } });
  }

  await db.translation.createMany({ data: translations });
  await db.auditLog.create({ data: { actorId: admin.id, action: 'seed.run', entityType: 'system', meta: { masters: MASTERS.length, studios: STUDIOS.length } } });

  console.log('\nSeed complete.');
  console.log(`  Super admin : ${adminEmail}  /  ${process.env.SEED_ADMIN_PASSWORD ? '(password from SEED_ADMIN_PASSWORD)' : adminPasswordPlain}`);
  console.log(`  Demo users  : client1@lumera.test … client5@lumera.test, owner1@lumera.test … owner5@lumera.test, <master-slug>@lumera.test`);
  console.log(`  Demo password: ${isProd ? '(from SEED_DEMO_PASSWORD)' : demoPassword}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
