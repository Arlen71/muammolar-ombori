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

Ma'lumotlar bazasi — Prisma Postgres, HTTP orqali. [Prisma Console](https://console.prisma.io)
da baza yarating va **`prisma+postgres://`** bilan boshlanadigan manzilni
`.env` dagi `DATABASE_URL` ga qo'ying.

> Nega TCP emas: serverless muhitda ulanishlar hovuzini so'rovlar orasida
> saqlab bo'lmaydi. HTTP hech qanday hovuz talab qilmaydi va lokal muhit
> ishlab chiqarish bilan aynan bir xil ishlaydi.

Jadvallarni yarating va sinov ma'lumotini yuklang:

```bash
npm run db:deploy && npm run db:seed
```

Dasturni ishga tushiring:

```bash
npm run dev
```

### Sinov akkauntlari

Parol hammasida bir xil: `Parol2026!` (lokal standart).

Internetdan ochiq muhitga seed qilayotganda albatta o'zingiznikini bering,
chunki standart parol shu ochiq repoda turadi:

```bash
SEED_PASSWORD="..." npm run db:seed
```

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
| `npm run security` | Xavfsizlik tekshiruvi — 36 ta hujum stsenariysi |
| `npm run contrast` | Rang kontrasti — ikkala mavzu WCAG AA dan o'tishi |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run admin:create` | Administrator yaratish yoki parolini tiklash |
| `npm run db:check` | Baza diagnostikasi (deploydan keyin birinchi shuni yuriting) |
| `npm run db:studio` | Ma'lumotlarni brauzerda ko'rish |
| `npm run db:deploy` | Migratsiyalarni qo'llash |
| `npm run db:seed` | Sinov ma'lumotini qayta yuklash (mavjud ma'lumot o'chadi) |

## Ishlash tartibi

Loyiha [texnik topshiriq](docs/TZ.md) asosida quriladi. Har qanday ish
boshlanishidan oldin TZ'da tegishli talab topiladi; talab yo'q bo'lsa —
avval hujjatga qo'shiladi, keyin kod yoziladi.

Har bir tugallangan o'zgarishdan keyin:

```bash
npm run typecheck && npm run lint && npm test
```

```bash
git add -A && git commit -m "Nima o'zgargani" && git push
```

TZ'dagi talab holati (✅/⏳) ham o'sha commit ichida yangilanadi — shunda
hujjat va kod hech qachon bir-biridan uzoqlashmaydi.

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
src/middleware.ts           Marshrut himoyasi (edge runtime, bazaga tegmaydi)
src/app/rahbar/             Rahbar: sehrgar, muammolar, qo'llab-quvvatlash
src/app/ombor/              Dasturchi: ombor, filtrlar, "Men olaman"
src/app/admin/              Administrator: moderatsiya, dublikatlar, akkauntlar
src/app/api/fayl/[id]/      Biriktirmalarni ruxsat tekshirib berish
```

### Bilib qo'yish kerak bo'lgan qarorlar

**Xavfsizlik ikki qatlamli.** `middleware.ts` faqat cookie imzosi va rolni ko'radi —
u bazaga murojaat qila olmaydi. Foydalanuvchi bloklanganmi, dasturchi
tasdiqlanganmi, sessiya bekor qilinganmi — bularni sahifa qatlami
(`src/lib/auth.ts`) qayta tekshiradi. Shu sababli kirish sahifasidan bosh
sahifaga yo'naltirish ham middleware'da emas, `/kirish` sahifasining o'zida:
aks holda yaroqsiz cookie bilan cheksiz yo'naltirish halqasi hosil bo'ladi.

**Biriktirmalar ikki qavat himoyalangan.** Blob ombori `private` rejimda:
faylni internetdan havola bilan ochib bo'lmaydi, uni faqat token bilan server
o'qiy oladi. Bazada ochiq manzil emas, ichki yo'l saqlanadi. Foydalanuvchi
faylni `/api/fayl/[id]` orqali oladi, u yerda avval ruxsat tekshiriladi.
Saqlanadigan yo'l har doim tizim yaratgan UUID — foydalanuvchi bergan nom
hech qachon yo'l sifatida ishlatilmaydi.

**Ranglar komponentda yozilmaydi.** `globals.css` ikki qatlamli: xom hex
qiymatlar faqat `:root` (yorug') va `.dark` (qorong'i) bloklarida, komponentlar
esa faqat semantik tokenlarni (`bg-yuza`, `text-matn`, `ring-xato-chegara`)
ishlatadi. Shu tufayli mavzu almashtirish uchun bironta komponentga tegilmaydi.
`npm run contrast` har bir matn/fon juftligini WCAG AA ga solishtiradi va
mos kelmasa yiqiladi — mavzu qiymatini o'zgartirib, kontrastni bilmasdan
buzib qo'yishning oldini oladi.

**Ikki xil chegara tokeni bor.** `chegara` — kartochka konturi va ajratgich,
bu bezak. `chegara-kuchli` — forma maydonlari; ular fondan kamida 3:1
ajralishi shart (WCAG 1.4.11), aks holda maydon qayerda boshlanishi
ko'rinmaydi.

**Aloqa raqami muammoni olgan dasturchigagina ko'rinadi.** Bu tashkilot
rahbarini keraksiz qo'ng'iroqlardan himoya qiladi.

**Bitta muammoni bir vaqtda bitta dasturchi oladi.** Buni baza kafolatlaydi:
`ProblemAssignment.activeKey` maydoni unique, faol topshiriqda `problemId` ga
teng, qo'yib yuborilganda `null`.

**Sessiyani bekor qilish.** `User.sessionVersion` ni oshirish yetarli —
o'sha foydalanuvchining barcha ochiq cookie'lari darhol yaroqsiz bo'ladi.
Bloklash va parolni tiklash shu maydonni avtomatik oshiradi.

## Joylashtirish (Vercel)

Loyiha GitHub'ga ulangan: `main` ga har bir push avtomatik deploy bo'ladi.

Birinchi marta sozlash:

1. [vercel.com/new](https://vercel.com/new) da GitHub bilan kiring va
   `muammolar-ombori` reposini import qiling. Next.js o'zi aniqlanadi.
2. Muhit o'zgaruvchilarini qo'shing:
   - `DATABASE_URL` — Prisma Console'dagi `prisma+postgres://` manzili
   - `SESSION_SECRET` — yangi tasodifiy kalit (lokaldagi bilan bir xil bo'lmasin):
     ```bash
     node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
     ```
3. Deploy tugmasini bosing.
4. Birinchi administratorni yarating (lokaldan, bulut bazasiga):
   ```bash
   npm run admin:create -- --ism "Ism Familiya" --tel 901112233
   ```

### Fayl biriktirish

Biriktirmalar **`private` rejimdagi** Vercel Blob omborida saqlanadi.
Omborni yarating:

```bash
npx vercel blob create-store muammolar-fayllar --access private --yes
```

Buyruq `BLOB_READ_WRITE_TOKEN` ni loyihaga o'zi qo'shadi. Shundan keyin
**qayta deploy qiling** — Vercel muhit o'zgaruvchilarini deploy paytida
biriktiradi, mavjud build yangi o'zgaruvchini ko'rmaydi.

Ombor ulanmaguncha ilova ishlashda davom etadi: sehrgar fayl yuklash
o'rniga tushunarli xabar ko'rsatadi.

### Ma'lumot rezidentligi

TZ'dagi `T-8.2` talabi — ma'lumot O'zbekiston hududida saqlanishi — Vercel
va Prisma Postgres bilan **bajarilmaydi** (baza Frankfurtda). Sinov va pilot
uchun bu maqbul, lekin real fuqaro ma'lumotlari bilan ishlashdan oldin
O'zbekistondagi serverga ko'chirish shart. Ilova bunga tayyor: `DATABASE_URL`
ni o'zgartirish kifoya.

## Keyingi bosqichga qoldirilgan

Dasturchi ↔ rahbar savol-javob moduli · Telegram bot · Tashkilotlarning o'zi
ro'yxatdan o'tishi · OneID / E-IMZO · Yechimlar katalogi · Vazirlik darajasidagi
kuzatuvchi rol · Excel eksport · Bildirishnomalar (baza jadvali tayyor, interfeys yo'q)
