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
| `npm test` | Hisob-kitob va vektor mantiqi — 30 ta test |
| `npm run e2e` | Rollar va ruxsatlar — 39 ta tekshiruv (dev server ochiq bo'lsin) |
| `npm run security` | Xavfsizlik tekshiruvi — 52 ta hujum stsenariysi |
| `npm run embedding` | Muammolarning vektorlarini to'ldiradi (`-- --kalibrlash` — chegarani tanlash) |
| `npm run contrast` | Rang kontrasti — 58 juftlik, ikkala mavzu WCAG AA dan o'tishi |
| `npm run typecheck` | TypeScript tekshiruvi |
| `npm run lint` | ESLint |
| `npm run admin:create` | Administrator yaratish yoki parolini tiklash |
| `npm run db:check` | Baza diagnostikasi (deploydan keyin birinchi shuni yuriting) |
| `npm run db:studio` | Ma'lumotlarni brauzerda ko'rish |
| `npm run db:deploy` | Migratsiyalarni qo'llash |
| `npm run db:seed` | Sinov ma'lumotini qayta yuklash (mavjud ma'lumot o'chadi) |

### Tekshiruv skriptlari o'z ma'lumotini yaratadi

`npm run e2e` va `npm run security` bazaga vaqtinchalik yozuv qo'shadi
(`E2E-` va `XAVF-` prefiksli) va oxirida o'chiradi. Ikkalasi ham
boshlanishida eski qoldiqni tozalaydi — skript Ctrl+C bilan
to'xtatilganda `finally` bloki ishlamaydi va yozuv bazada qolib ketardi.

Nega bu muhim: bir vaqtlar "qoralama omborda 404 beradi" tekshiruvi
bazadan `status: "DRAFT"` bo'yicha qidirardi. `prisma/seed.ts` esa
qoralama yaratmaydi — ya'ni toza o'rnatishda tekshiruv jimgina
o'tkazib yuborilardi va faqat uzilib qolgan yurishdan qolgan axlat
yozuv tufayli ishlab kelgan. Bajarilmagan tekshiruv yiqilganidan
yomonroq: yiqilgani ko'rinadi, yo'qolgani esa yo'q.

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
Rahbar sehrgarni to'ldiradi  →  Ombor (darhol)
                                   ↓
Rahbar muammoni yopadi  ←  Yechim  ←  Dasturchi oladi
                                       ↑
                              Suhbat: dasturchi ↔ rahbar
```

Holatlar: `DRAFT → APPROVED → TAKEN → SOLUTION_OFFERED → RESOLVED`
(qo'shimcha: `ARCHIVED`; `SUBMITTED` va `REJECTED` eski yozuvlarda qoladi).

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

**Fayllar brauzerdan omborga BEVOSITA yuklanadi.** Vercel serverless
funksiyasiga 4.5 MB dan katta so'rov tanasi umuman kirmaydi — bu
platforma cheklovi, `next.config.ts` dan sozlab bo'lmaydi (o'lchangan:
4 MB o'tadi, 4.4 MB da 413 `FUNCTION_PAYLOAD_TOO_LARGE`). Ilgari fayl
server action orqali ketardi va kodda 10 MB deb yozilgani holda amalda
~4.4 MB dan kattasi tushunarsiz "Kutilmagan xatolik" ekrani bilan
yiqilardi.

Endi `/api/yuklash` faqat qisqa muddatli token beradi, fayl baytlari
esa serverdan o'tmaydi. Token cheklangan: chaqiruvchining O'Z papkasiga
(`rasmlar/<foydalanuvchiId>/`, `biriktirmalar/<muammoId>/`), faqat
ruxsat etilgan turlarga va belgilangan hajmgacha. Yo'lni mijoz taklif
qiladi, lekin uni ikki joy tekshiradi — token berishda va bazaga
biriktirishda.

Chegaralar `uploads-client.ts` da, bitta manbada: brauzer ham, server
ham o'sha yerdan o'qiydi.

**Avatar manziliga versiya qo'shiladi** (`?v=…`). Manzil
`/api/rasm/<id>` hech qachon o'zgarmaydi, rasm esa o'zgaradi — versiyasiz
brauzer eski nusxani bir soat keshda ushlab turardi.

**Profil rasmlari biriktirmalardan boshqacha himoyalangan.** Har qanday
kirgan foydalanuvchi hamkasbining rasmini ko'ra oladi (`/api/rasm/[id]`) —
dasturchi muammoni olgach mas'ul shaxsga qo'ng'iroq qiladi va kim bilan
gaplashayotganini ko'rish aloqani osonlashtiradi. Biriktirmalar esa
tashkilot bo'yicha cheklangan. Ikkalasi ham `private` blobda va
sessiyasiz 401 qaytaradi.

Profilda foydalanuvchi faqat ism, lavozim, pochta va rasmni o'zgartiradi.
Telefon (login), rol va tashkilot administrator qo'lida: bu maydonlar
`profilniYangila` sxemasida umuman yo'q, ya'ni so'rovni qo'lda
o'zgartirgan odam ham ularga yeta olmaydi.

**Diagrammalar kutubxonasiz.** `grafik.tsx` — oddiy HTML va CSS, server
komponenti. Brauzerga bir bayt JavaScript ketmaydi; recharts yoki
chart.js ~50–150 KB qo'shardi va client komponentiga majbur qilardi.
Gorizontal ustunlar va oqim uchun `div` va `width: %` yetarli. Har bir
diagrammada raqam ustunning yonida matn bo'lib turadi — ma'no faqat
uzunlik bilan berilmaydi (WCAG 1.4.1).

**Vizual til my.gov.uz dan olingan.** Rahbar ham, dasturchi ham Yagona
interaktiv davlat xizmatlari portalini har kuni ochadi. Bu tizim o'sha
oiladan ekani birinchi qarashda ko'rinishi kerak — begona ko'ringan
davlat sayti ishonch uyg'otmaydi. Portaldan olingani:

| Element | Qiymat |
|---|---|
| Brend ko'ki | `#0068e0` (bosilganda `#0153b2`) |
| Sahifa foni | `#f2f4f7` — kartochkalar oq, fondan o'zi ajraladi |
| Urg'u | `#00dc82` — gradient va faol menyu belgisi |
| Shrift | Montserrat (kodlar uchun JetBrains Mono qoldi) |
| Radius | 14 px |
| Yon panel | To'q ko'k ustun, oq yozuvlar |
| Jadval | Navbatma-navbat oq va `#eaf4ff` qatorlar |
| Tugma | Kapsula shakli |

Kartochkalarda kontur ham, soya ham yo'q — my.gov.uz da ham shunday:
oq to'rtburchak kulrang fondan o'zi ajralib turadi. Qorong'i mavzuda
yuzalar orasidagi farq kichrayadi, shuning uchun u yerda nozik kontur
qaytariladi. Bu `--u-quti-chegara` tokeni orqali qilinadi (yorug'da
`transparent`), ya'ni komponentlarda `dark:` varianti yo'q.

Portaldan olinmagani ham bor. Ularning bosh sahifasidagi
illyustratsiyalar o'rnida bizda Oqsaroy koshinlarining sakkiz qirrali
yulduz naqshi (`naqsh.tsx`) qoldi — pilot Qashqadaryoda va bu naqsh
gradient panelni tekis rangdan chiqaradi. Ikonkalarga o'ralgan
gorizontal karusel ham olinmadi: bu ichki ish quroli, xizmat vitrinasi
emas.

**Gradientdagi matn kontrasti alohida hisoblangan.** Ko'k bilan
yashilning o'rtasi feruza (`#00a7ad`) bo'lib chiqadi va oq matn u yerda
2.9:1 beradi — AA dan past. my.gov.uz da bu sezilmaydi, chunki
ularning sarlavhasi ikki so'z va chap chekkada turadi; bizda esa u
to'liq jumla. Shu sababli `.gradient-brend` ikki qatlamli: pastda qiya
gradient, ustida chapdan o'ngga so'nuvchi toza brend ko'ki. Matn 70%
gacha bo'lgan qismda turadi va u yerda fon aynan `#0068e0` (5.2:1),
yashil esa o'ng yuqori burchakda — matnsiz joyda. 1024 pikseldan tor
ekranda matn panelning butun kengligini egallaydi, himoyalanadigan joy
qolmaydi — u yerda gradient butunlay ko'k.

**Harakat faqat birinchi taassurot joyida.** Pog'onali kirish
(`.jonlanish`) va sanaladigan raqamlar (`Sanoq`) — ochiq sahifa bilan
kirish ekranida. Ish ekranlarida (ombor, rahbar, admin) ular yo'q:
xodim bu sahifalarni kuniga o'nlab marta ochadi va har filtrda
qatorlarning qaytadan pog'onalanishi ishga xalaqit beradi. U yerda
faqat javob harakati qoladi — kartochka ko'tarilishi (`.kotarilish`),
tugma bosilishi, mavzu o'tishi.

`prefers-reduced-motion` da `animation-delay` ham nolga tushiriladi,
faqat davomiylik emas: aks holda `animation-fill-mode: both` boshlang'ich
`opacity: 0` ni kechikish davomida ushlab turadi va harakatni o'chirgan
foydalanuvchi kontentni yarim soniyagacha ko'rmay qoladi.

**Ranglar komponentda yozilmaydi.** `globals.css` ikki qatlamli: xom hex
qiymatlar faqat `:root` (yorug') va `.dark` (qorong'i) bloklarida, komponentlar
esa faqat semantik tokenlarni (`bg-yuza`, `text-matn`, `ring-xato-chegara`)
ishlatadi. Shu tufayli mavzu almashtirish uchun bironta komponentga tegilmaydi.
`npm run contrast` har bir matn/fon juftligini WCAG AA ga solishtiradi va
mos kelmasa yiqiladi — mavzu qiymatini o'zgartirib, kontrastni bilmasdan
buzib qo'yishning oldini oladi.

**`loading.tsx` faqat `/admin` bo'limida.** Bu fayl segmentni oqim
rejimiga o'tkazadi — javob sarlavhasi skelet bilan birga darhol
jo'natiladi. Shundan keyin chaqirilgan `notFound()` HTTP statusini
o'zgartira olmaydi va sahifa 404 o'rniga **200** qaytaradi. Yopiq
omborda bu jiddiy: ruxsat yo'q resursga 200 javob berish "bunday
sahifa bor" degani. `/ombor` va `/rahbar` ostida `notFound()`
chaqiriladi, shuning uchun u yerda skelet yo'q. Buni `npm run e2e`
tekshiradi.

**Tizim bitta viloyatda ishlaydi.** Pilot hududi `src/lib/hudud.ts` da
qotirilgan (`PILOT_HUDUDI = "QASHQADARYO"`). Interfeysda viloyat
tanlanmaydi — tashkilot yaratilganda uni server qo'yadi, chunki pilot
chegarasi mahsulot qarori, foydalanuvchi tanlovi emas. Ajratish TUMAN
bo'yicha: bir viloyat ichida odamlar aynan tumanni izlaydi ("Qarshi
shahrida qanday muammolar bor?"), viloyat filtri esa har doim butun
bazani qaytarardi.

`Region` enum'i sxemada 14 ta viloyat bilan qolyapti — boshqa viloyatga
kengaytirish uchun `hudud.ts` dagi ikki qiymatni o'zgartirish kifoya,
bazaga tegilmaydi. Tumanlar ro'yxati ham shu faylda; ma'muriy bo'linish
o'zgarganda (masalan Ko'kdala tumani 2018-yilda tashkil etilgan) uni
rasmiy manba bilan solishtirib turing.

**Ro'yxatlar ikki ko'rinishda.** `MuammolarJadvali` katta ekranda jadval,
telefonda kartochka chizadi — ikkalasi bitta faylda. Sabab: ustun
qo'shilganda uni ikki joyda o'zgartirish kerak bo'lsa, vaqt o'tib ular
bir-biridan uzoqlashadi. Ustunlarni sahifaning o'zi tanlaydi.

**`/rahbar/boshqalar` ataylab jadval emas.** U yerda rahbar har bir
muammoning tavsifini o'qib, "bizda ham shumi?" degan qarorga keladi.
Tavsif matni jadval hujayrasiga sig'maydi.

**Jadval ichida `sr-only` matn ishlatilmaydi.** Bunday element
`position: absolute` bo'ladi va o'zining oqimdagi joyida qoladi;
gorizontal siljiydigan jadvalda bu joy ekrandan ancha o'ngda bo'lib,
butun sahifani yon tomonga siljitib yuboradi.

**Ikki xil chegara tokeni bor.** `chegara` — kartochka konturi va ajratgich,
bu bezak. `chegara-kuchli` — forma maydonlari; ular fondan kamida 3:1
ajralishi shart (WCAG 1.4.11), aks holda maydon qayerda boshlanishi
ko'rinmaydi.

**Moderatsiya yo'q — muammo darhol omborga tushadi.** Ilgari zanjir
`SUBMITTED → (admin) → APPROVED` edi va u ikki narsani buzardi: rahbar
yuborgach kutib qolardi, dasturchi esa muammoni umuman ko'rmasdi.
Kartochkadagi kamchilikni endi dasturchi **suhbat orqali** rahbardan
to'g'ridan-to'g'ri so'raydi — bu moderatorning taxmin qilishidan aniqroq.

Nazorat butunlay yo'qolmadi: administrator nomaqbul yoki takroriy
yozuvni **keyin** arxivga oladi (sabab bilan, u rahbarga ko'rinadi).
Bu "oldindan to'sish" emas, "keyin tuzatish" modeli.

`APPROVED` holati saqlanib qoldi — ombor, filtrlar va statistika
o'shanga tayanadi. Faqat unga o'tish endi yuborish paytida bo'ladi.

**Suhbat har (muammo × dasturchi) juftligi uchun alohida va yopiq.**
Dasturchi boshqasining yozishmasini ko'rmaydi. Rahbar tomonidan
tashkilotning istalgan rahbari javob beradi — muallif ta'tilda bo'lsa
yozishma to'xtab qolmasligi kerak. Administrator **o'qiydi, yozmaydi**:
bu rasmiy ish yozishmasi va nizo chiqqanda platforma egasi ko'ra
olishi kerak, lekin u suhbatning tarafi emas.

Ruxsat mantig'i `src/lib/suhbat.ts` da, bitta joyda — sahifa, fayl
marshruti va yuklash tokeni o'sha funksiyani chaqiradi. Begona
foydalanuvchiga **404** qaytariladi, 403 emas: 403 "bunday suhbat bor"
degani bo'lardi. Buni `npm run security` tekshiradi.

**Chiqish tugmasi — oddiy forma, server action emas.** Next server
action'ni URL bilan emas, yig'ish paytida hisoblangan xesh bilan
chaqiradi. Yangi versiya joylashtirilganda xeshlar almashadi, brauzerda
ochiq turgan sahifa esa eskisicha qoladi: bosilgan tugma endi mavjud
bo'lmagan xeshni yuboradi va javob «Server action not found» (404)
bo'ladi — foydalanuvchi buni «Kutilmagan xatolik» ekrani sifatida
ko'radi. Ish sahifasi kun bo'yi ochiq turadigan rahbar buni albatta
uchratadi.

Chiqish esa aynan nimadir noto'g'ri ketganda bosiladigan tugma, ya'ni
u ilovaning eng ishonchli qismi bo'lishi kerak. Shuning uchun u
`POST /chiqish` marshrutiga yuboradigan oddiy HTML forma
(`src/app/chiqish/route.ts`): JavaScript ham, xesh ham, klient holati
ham ishtirok etmaydi. Faqat POST — GET bo'lsa begona saytdagi `<img>`
odamni tizimdan chiqarib yuborardi.

Qolgan action'lar uchun `next.config.ts` da `deploymentId` bor. Vercel
loyihasida **Settings → Advanced → Skew Protection** yoqilsa, eski
versiyadan kelgan so'rov o'sha versiyaga yo'naltiriladi va eskirgan
sahifa ham ishlab ketaveradi.

**Dublikat qidiruvi ma'no bo'yicha ishlaydi.** Ilgari `pg_trgm` so'zlarni
uch harfli bo'laklarga bo'lib solishtirardi va umumiy so'z bo'lmasa hech
narsa topmasdi:

    «Xodimlar ta'til so'rovini qog'ozda yozadi»
    «Mehnat ta'tili hujjatlari jurnalda yuritiladi»

Bu bitta muammo, lekin ularda birgina umumiy so'z yo'q. Endi sarlavha,
tavsif va hozirgi jarayon vektorga aylantiriladi (`embedding.ts`) va
solishtirish ma'no bo'yicha ketadi. Bu omborning eng kuchli signali uchun
muhim: dasturchi «37 ta tashkilotda shu muammo bor» degan raqamga qarab
tanlaydi, dublikat topilmasa esa bitta muammo o'nta yozuv bo'lib
tarqalib ketadi.

Qidiruv **qaror qabul qilmaydi**. U nomzodlarni ball bilan qaytaradi,
birlashtirishni odam bosadi: birlashtirish bir tashkilotning muammosini
ombordan olib tashlab, boshqasining kartochkasidagi «+1» ga aylantiradi
va uni bekor qilib bo'lmaydi.

Uch bosqichli zaxira: vektor → `pg_trgm` → oddiy so'z qidiruvi. Kalit
berilmasa yoki xizmat javob bermasa, qidiruv eski usulda ishlayveradi —
bu qo'shimcha imkoniyat, majburiy bog'liqlik emas.

`pgvector` ishlatilmaydi: pilot hajmida barcha vektorlarni o'qib,
kosinusni Node ichida hisoblash bir necha millisekund. Bu bazani
O'zbekistondagi serverga ko'chirishni osonlashtiradi. O'n mingdan
oshganda `pgvector` ga o'tish kerak bo'ladi — interfeys o'zgarmaydi.

So'rov OpenAI ning `/v1/embeddings` shakliga yuboriladi. Ollama, vLLM va
llama.cpp ham shu shaklni beradi, ya'ni o'z serveringizga ko'chganda kod
emas, faqat `EMBEDDING_URL` o'zgaradi.

**Chegarani taxmin bilan tanlab bo'lmaydi.** Kosinus balli mutlaq
ma'noga ega emas. `npm run embedding -- --kalibrlash` bazadagi barcha
juftliklarni ball bo'yicha tartiblab ko'rsatadi — haqiqiy dublikatlar
bilan begona juftliklar orasidagi uzilish qayerda bo'lsa, chegara o'sha
yerda.

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
