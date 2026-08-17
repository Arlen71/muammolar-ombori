# Muammolar ombori

Davlat tashkilotlari rahbarlari o'z tashkilotidagi ish jarayonlaridagi muammolarni
tizimga kiritadi. Davlat moliyalashtiradigan dasturchilar jamoasi shu ombordan
real ehtiyojni ko'radi, muammoni o'z zimmasiga oladi va **telefon orqali bog'lanib**
yechim taqdim etadi.

Bu marketplace emas — pul, tender, konkurs moduli yo'q. Butun qiymat bitta
narsaga bog'liq: **muammo kartochkasi sifatiga**.

## Ishga tushirish

```bash
npm install
```

Muhit faylini tayyorlang:

```bash
cp .env.example .env
```

`SESSION_SECRET` uchun yangi kalit yarating:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Lokal ma'lumotlar bazasini ko'taring (hech narsa o'rnatish shart emas — Docker ham,
PostgreSQL ham kerak emas):

```bash
npm run db:start
```

Buyruq bergan `postgres://...` manzilini `.env` dagi `DATABASE_URL` ga qo'ying,
so'ng jadvallarni yarating va sinov ma'lumotini yuklang:

```bash
npm run db:migrate && npm run db:seed
```

Dasturni ishga tushiring:

```bash
npm run dev
```

### Sinov akkauntlari

Parol hammasida bir xil: `Parol2026!`

| Rol | Telefon | Nima ko'radi |
|---|---|---|
| Administrator | `+998 90 111 22 33` | Moderatsiya, dublikatlar, foydalanuvchilar |
| Tashkilot rahbari | `+998 90 111 22 01` | O'z muammolari va sehrgar |
| Dasturchi (tasdiqlangan) | `+998 90 111 33 01` | Muammolar ombori |
| Dasturchi (tasdiqlanmagan) | `+998 90 111 33 03` | Faqat kutish ekrani |

## Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Ishlab chiqish serveri |
| `npm run build` | Ishlab chiqarish uchun yig'ish |
| `npm test` | Hisob-kitob mantiqi testlari |
| `npm run e2e` | Rollar va ruxsatlar tekshiruvi (dev server ochiq bo'lsin) |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run admin:create` | Administrator yaratish yoki parolini tiklash |
| `npm run db:check` | Baza diagnostikasi (deploydan keyin birinchi shuni yuriting) |
| `npm run db:studio` | Ma'lumotlarni brauzerda ko'rish |
| `npm run db:seed` | Sinov ma'lumotini qayta yuklash (mavjud ma'lumot o'chadi) |

## Asosiy oqim

```
Rahbar sehrgarni to'ldiradi  →  Moderatsiya  →  Ombor
                                                  ↓
Rahbar muammoni yopadi  ←  Yechim taqdim etildi  ←  Dasturchi oladi
                                                     (telefon orqali bog'lanadi)
```

Holatlar: `DRAFT → SUBMITTED → APPROVED → TAKEN → SOLUTION_OFFERED → RESOLVED`
(qo'shimcha: `REJECTED`, `ARCHIVED`).

Siklni **rahbar** yopadi, dasturchi emas — aks holda muammo "hal qilindi" deb
belgilanib, tashkilotda aslida hech narsa o'zgarmagan bo'lishi mumkin edi.

## Loyiha tuzilishi

```
prisma/schema.prisma        Ma'lumotlar modeli
src/lib/scoring.ts          Oylik yo'qotish, to'liqlik, ta'sir balli (+ testlar)
src/lib/labels.ts           Barcha o'zbekcha matnlar bir joyda
src/lib/auth.ts             Sessiya va rol tekshiruvlari (bazadan)
src/lib/similar.ts          Dublikat qidiruvi (pg_trgm, zaxira usul bilan)
src/proxy.ts                Marshrut himoyasi (Next 16 da middleware shunday ataladi)
src/app/rahbar/             Rahbar: sehrgar, muammolar, qo'llab-quvvatlash
src/app/ombor/              Dasturchi: ombor, filtrlar, "Men olaman"
src/app/admin/              Administrator: moderatsiya, dublikatlar, akkauntlar
src/app/api/fayl/[id]/      Biriktirmalarni ruxsat tekshirib berish
```

### Bilib qo'yish kerak bo'lgan qarorlar

**Xavfsizlik ikki qatlamli.** `proxy.ts` faqat cookie imzosi va rolni ko'radi —
u bazaga murojaat qila olmaydi. Foydalanuvchi bloklanganmi, dasturchi
tasdiqlanganmi, sessiya bekor qilinganmi — bularni sahifa qatlami
(`src/lib/auth.ts`) qayta tekshiradi. Shu sababli kirish sahifasidan bosh
sahifaga yo'naltirish ham `proxy.ts` da emas, `/kirish` sahifasining o'zida:
aks holda yaroqsiz cookie bilan cheksiz yo'naltirish halqasi hosil bo'ladi.

**Biriktirilgan fayllar `public/` da emas.** Ular tashkilotlarning ichki
hujjatlari, shuning uchun `uploads/` papkasida yotadi va faqat
`/api/fayl/[id]` orqali, ruxsat tekshirilgandan keyin beriladi. Diskdagi nom
har doim tizim yaratgan UUID — foydalanuvchi bergan nom hech qachon yo'l
sifatida ishlatilmaydi.

**Aloqa raqami muammoni olgan dasturchigagina ko'rinadi.** Bu tashkilot
rahbarini keraksiz qo'ng'iroqlardan himoya qiladi.

**Bitta muammoni bir vaqtda bitta dasturchi oladi.** Buni baza kafolatlaydi:
`ProblemAssignment.activeKey` maydoni unique, faol topshiriqda `problemId` ga
teng, qo'yib yuborilganda `null`.

**Sessiyani bekor qilish.** `User.sessionVersion` ni oshirish yetarli —
o'sha foydalanuvchining barcha ochiq cookie'lari darhol yaroqsiz bo'ladi.
Bloklash va parolni tiklash shu maydonni avtomatik oshiradi.

## Ishlab chiqarishga joylashtirish

1. **PostgreSQL 14+** o'rnating (O'zbekiston hududidagi serverda — shaxsiy
   ma'lumotlar to'g'risidagi qonun talabi).
2. `.env` ni tayyorlang:
   - `DATABASE_URL` — serverdagi baza manzili
   - `SESSION_SECRET` — **albatta yangi**, tasodifiy kalit
   - `DB_POOL_MAX="10"` — lokaldagi `1` emas (pastdagi izohga qarang)
   - `UPLOAD_DIR` — zaxira nusxasi olinadigan doimiy papka
3. Migratsiyalarni qo'llang: `npm run db:deploy`
4. Birinchi administratorni yarating:
   ```bash
   npm run admin:create -- --ism "Ism Familiya" --tel 901112233
   ```
   Parol avtomatik yaratiladi va **bir marta** ekranga chiqadi — uni darhol
   xavfsiz joyga ko'chiring. Boshqa foydalanuvchilar shu admin orqali,
   «Foydalanuvchilar» bo'limidan qo'shiladi.
5. Yig'ing va ishga tushiring: `npm run build && npm start`
6. Oldiga `nginx` qo'ying: HTTPS, `X-Forwarded-For` (audit jurnalidagi IP shundan
   olinadi) va fayl yuklash hajmi (`client_max_body_size 10m`).
7. `npm run db:check` bilan tekshiring.

### Admin parolini yo'qotib qo'ysangiz

```bash
npm run admin:create -- --tel 901112233 --parolni-tikla
```

Yangi parol beriladi va o'sha adminning barcha ochiq sessiyalari darhol uziladi.
Bu buyruq faqat `ADMIN` rolidagi akkauntlarda ishlaydi — oddiy foydalanuvchilar
parolini admin panelidan tiklash kerak.

Boshqa variantlar:

| Buyruq | Vazifasi |
|---|---|
| `npm run admin:create` | Interaktiv: ism va telefonni so'raydi |
| `... -- --yana` | Tizimda admin bo'lsa ham yana bittasini qo'shadi |
| `... -- --parol "..."` | Parolni avtomatik yaratish o'rniga o'zingiz belgilaysiz |
| `... -- --lavozim "..."` | Lavozimni ko'rsatadi |

Skript ishlab chiqarishda ham ishlaydi (seeddan farqli), mavjud ma'lumotga
tegmaydi va har bir amalni audit jurnaliga yozadi.

### Nega lokalda `DB_POOL_MAX=1`

`npm run db:start` PGlite — WASM ichida ishlaydigan PostgreSQL 17 — ni ko'taradi.
U bir nechta parallel ulanishni ko'tara olmaydi va ortiqchasini uzib yuboradi
(`P1017` xatosi). Bitta ulanishda barcha so'rovlar navbatga tushadi va muammo
yo'qoladi. Haqiqiy PostgreSQL'da bunday cheklov yo'q — u yerda `10` qo'ying.

## Keyingi bosqichga qoldirilgan

Dasturchi ↔ rahbar savol-javob moduli · Telegram bot · Tashkilotlarning o'zi
ro'yxatdan o'tishi · OneID / E-IMZO · Yechimlar katalogi · Vazirlik darajasidagi
kuzatuvchi rol · Excel eksport · Bildirishnomalar (baza jadvali tayyor, interfeys yo'q)
