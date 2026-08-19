# Texnik topshiriq — Muammolar ombori

**Versiya:** 1.0 · **Sana:** 2026-08-17 · **Holat:** MVP bajarildi

---

## 0. Bu hujjatdan qanday foydalanish kerak

Bu hujjat loyihaning **yagona haqiqat manbasi**. Har qanday yangi ish
boshlanishidan oldin shu yerdagi talab topiladi; talab yo'q bo'lsa — avval
hujjatga qo'shiladi, keyin kod yoziladi.

**Qoidalar:**

1. Kod TZ'dan chetga chiqmasligi kerak. Yangi g'oya paydo bo'lsa — u avval
   6-bo'limga (qamrovdan tashqari) yoki tegishli talab sifatida qo'shiladi.
2. Har bir talabning **holati** belgilanadi. Ish tugagach holat yangilanadi.
3. Har bir o'zgarishdan keyin GitHub'ga yuklanadi (`git push`).
4. Talab raqamlari (`T-2.3` kabi) hech qachon qayta ishlatilmaydi. Talab kerak
   bo'lmay qolsa, o'chirilmaydi — holati `bekor qilingan` deb belgilanadi.

**Holat belgilari:** ✅ bajarilgan · ⏳ rejada · ⛔ qamrovdan tashqarida

---

## 1. Loyiha haqida

### 1.1 Muammo

Davlat tashkilotlarida ko'plab ish jarayonlari qo'lda, qog'ozda va Excel'da
bajariladi. Bu jarayonlar xodimlarning vaqtini yeydi, xatolarga olib keladi va
fuqarolarga xizmat ko'rsatishni sekinlashtiradi. Ayni paytda davlat
moliyalashtiradigan dasturchilar jamoasi bor, lekin ular **qaysi muammo
haqiqatan dolzarb ekanini bilmaydi**. Tashkilot rahbarlari esa o'z
muammolarini texnik tilda tushuntira olmaydi.

### 1.2 Yechim

Tizim rahbarni **intervyu shaklidagi savollar** orqali olib o'tadi va uning
javoblaridan dasturchiga kerak bo'ladigan texnik ma'lumotni o'zi yig'ib
chiqadi. Yig'ilgan muammolar yagona omborga tushadi; dasturchi ombordan
o'ziga mos muammoni tanlaydi va **telefon orqali bog'lanib** yechim taqdim
etadi.

### 1.3 Loyiha nima EMAS

| Nima emas | Sabab |
|---|---|
| Marketplace | Dasturchilar davlat maoshida ishlaydi, pul o'tkazmasi yo'q |
| Tender platformasi | Konkurs, taklif baholash, g'olib tanlash moduli yo'q |
| Loyiha boshqaruvi tizimi | Ish bosqichlari, vazifalar, muddat nazorati yo'q |
| Ochiq platforma | Ombor yopiq, o'z-o'zidan ro'yxatdan o'tish yo'q |

### 1.4 Muvaffaqiyat mezoni

Pilot bosqichi (5–10 tashkilot, 3 oy) muvaffaqiyatli hisoblanadi, agar:

- kamida 30 ta to'liq (to'liqlik ≥ 80%) muammo kartochkasi yig'ilsa;
- kamida 5 ta muammo bir nechta tashkilotda takrorlangani aniqlansa;
- kamida 3 ta muammo `RESOLVED` holatiga yetsa.

---

## 2. Foydalanuvchilar va rollar

| Rol | Kim | Asosiy vazifasi |
|---|---|---|
| **Administrator** | Tizim mas'uli | Akkauntlar, moderatsiya, dublikatlar |
| **Tashkilot rahbari** (`LEADER`) | Hokim o'rinbosari, boshqarma boshlig'i | Muammo kiritish, yechimni qabul qilish |
| **Dasturchi** (`DEVELOPER`) | Davlat jamoasi dasturchisi | Muammo tanlash, yechim taqdim etish |
| **Mehmon** | Kirmagan foydalanuvchi | Faqat anonim statistika |

**Muhim cheklov:** rahbarlarning dasturlashdan xabari yo'q. Interfeys hech
qanday texnik atama ishlatmasligi kerak.

---

## 3. Funksional talablar

### 3.1 Umumiy (T-1)

| № | Talab | Holat |
|---|---|---|
| T-1.1 | Interfeys to'liq o'zbek (lotin) tilida | ✅ |
| T-1.2 | Barcha matnlar bitta modulda (`src/lib/labels.ts`) — kelajakda tarjima uchun | ✅ |
| T-1.3 | Mobil qurilmada to'liq ishlaydi (responsive) | ✅ |
| T-1.4 | Kirish faqat telefon raqami + parol orqali | ✅ |
| T-1.5 | O'z-o'zidan ro'yxatdan o'tish YO'Q — akkauntni admin yaratadi | ✅ |
| T-1.6 | Ochiq sahifada faqat anonim statistika; muammo sarlavhalari ko'rinmaydi | ✅ |
| T-1.7 | Rus tili | ⏳ |
| T-1.8 | Telegram bot orqali muammo kiritish | ⏳ |
| T-1.9 | OneID / E-IMZO orqali kirish | ⏳ |

### 3.2 Tashkilot rahbari (T-2)

| № | Talab | Holat |
|---|---|---|
| T-2.1 | 5 qadamli sehrgar orqali muammo kiritish | ✅ |
| T-2.2 | Har bir maydonda namuna javob ko'rsatiladi | ✅ |
| T-2.3 | Qoralama avtomatik saqlanadi (o'zgarishdan 1,5 s keyin) | ✅ |
| T-2.4 | Sahifa yopilib qayta ochilsa, yozilganlar joyida turadi | ✅ |
| T-2.5 | Fayl biriktirish (Excel, PDF, rasm, Word) — 10 tagacha, har biri ≤10 MB | ✅ |
| T-2.15 | Biriktirmalar yopiq omborda; ochiq havola bilan ochib bo'lmaydi | ✅ |
| T-2.6 | Kartochka to'liqligi foizda ko'rsatiladi | ✅ |
| T-2.7 | Yuborishdan oldin «dasturchi buni shunday ko'radi» oldindan ko'rish | ✅ |
| T-2.8 | Sarlavha yozilayotganda o'xshash muammolar haqida ogohlantirish | ✅ |
| T-2.9 | Boshqa tashkilotlar muammolarini ko'rish va «Bizda ham bor» belgilash | ✅ |
| T-2.10 | O'z muammolari holatini kuzatish | ✅ |
| T-2.11 | Rad etilgan muammoni tuzatib qayta yuborish | ✅ |
| T-2.12 | Yechimni qabul qilib muammoni yopish | ✅ |
| T-2.13 | Qoralamani o'chirish | ✅ |
| T-2.14 | Rahbar faqat O'Z tashkiloti muammosini ko'radi va tahrirlaydi | ✅ |

### 3.3 Dasturchi (T-3)

| № | Talab | Holat |
|---|---|---|
| T-3.1 | Faqat administrator tasdiqlagan dasturchi omborga kiradi | ✅ |
| T-3.2 | Tasdiqlanmagan dasturchi «kutish» ekranini ko'radi | ✅ |
| T-3.3 | Ombor ro'yxati: qidiruv, filtr (soha, hudud, shoshilinchlik), saralash | ✅ |
| T-3.4 | «Faqat hali hech kim olmagan» filtri | ✅ |
| T-3.5 | Saralash: ta'sir balli / talab hajmi / vaqt yo'qotish / yangilik | ✅ |
| T-3.6 | Muammo kartochkasini to'liq ko'rish | ✅ |
| T-3.7 | «Men olaman» — muammo band bo'ladi va aloqa raqami ochiladi | ✅ |
| T-3.8 | Bitta muammoni ayni paytda faqat bitta dasturchi oladi | ✅ |
| T-3.9 | Muammoni qo'yib yuborish — u omborga qaytadi | ✅ |
| T-3.10 | «Yechim taqdim etildi» deb belgilash (izoh bilan) | ✅ |
| T-3.11 | «Men olgan muammolar» ro'yxati | ✅ |
| T-3.12 | Biriktirilgan fayllarni yuklab olish | ✅ |
| T-3.13 | Rahbarga tizim orqali aniqlashtiruvchi savol berish | ⏳ |

### 3.4 Administrator (T-4)

| № | Talab | Holat |
|---|---|---|
| T-4.1 | Tashkilot yaratish (nom, tur, hudud, tuman, STIR) | ✅ |
| T-4.2 | Foydalanuvchi akkaunti yaratish, parol avtomatik generatsiya | ✅ |
| T-4.3 | Parolni tiklash (eski sessiyalar uziladi) | ✅ |
| T-4.4 | Moderatsiya navbati: tasdiqlash yoki sabab bilan qaytarish | ✅ |
| T-4.5 | Moderatsiyada o'xshash muammolar haqida ogohlantirish | ✅ |
| T-4.6 | Dasturchini tasdiqlash yoki bloklash | ✅ |
| T-4.7 | Dublikatlarni birlashtirish | ✅ |
| T-4.8 | Boshqaruv paneli: kutayotgan ishlar va so'nggi harakatlar | ✅ |
| T-4.9 | Birinchi adminni skript orqali yaratish (`npm run admin:create`) | ✅ |
| T-4.10 | Excel eksport | ⏳ |
| T-4.11 | Audit jurnalini interfeysda ko'rish (hozir faqat bazada) | ⏳ |

### 3.5 Dublikatlar (T-5)

| № | Talab | Holat |
|---|---|---|
| T-5.1 | Sarlavha bo'yicha o'xshashlik qidiruvi (`pg_trgm`) | ✅ |
| T-5.2 | Kengaytma bo'lmasa — zaxira qidiruvga o'tish, dastur yiqilmasligi | ✅ |
| T-5.3 | «Bizda ham shu muammo bor» tugmasi | ✅ |
| T-5.4 | Bitta tashkilot bitta muammoni faqat bir marta qo'llab-quvvatlaydi | ✅ |
| T-5.5 | Admin ikki muammoni birlashtiradi; takrori arxivlanadi | ✅ |
| T-5.6 | Birlashtirilganda takror tashkiloti asosiy muammoga qo'shiladi | ✅ |
| T-5.7 | Qo'llab-quvvatlovchilar soni ta'sir balliga ta'sir qiladi | ✅ |
| T-5.8 | Omborda takrorlar alohida chiqmaydi (faqat asosiysi) | ✅ |

---

## 4. Muammo kartochkasi — spetsifikatsiya

Bu loyihaning yuragi. Savollar **atayin oddiy tilda** yoziladi; texnik xulosa
javoblardan chiqariladi.

### 4.1 Qadam 1 — Muammo nima?

| Maydon | Turi | Talab | Validatsiya |
|---|---|---|---|
| `title` | matn | majburiy | 10–120 belgi |
| `description` | uzun matn | majburiy | ≥100 belgi |
| `categoryId` | tanlov | majburiy | 11 ta turkumdan biri |
| `painTypes` | ko'p tanlov | majburiy | ≥1 ta |

### 4.2 Qadam 2 — Hozir bu ish qanday bajariladi? (as-is)

Dasturchi uchun eng qimmatli qadam.

| Maydon | Turi | Talab | Validatsiya |
|---|---|---|---|
| `currentProcess` | bosqichli matn | majburiy | ≥40 belgi |
| `toolsUsed` | ko'p tanlov | majburiy | ≥1 ta |
| `toolsNote` | matn | ixtiyoriy | — |
| `rolesInvolved` | teg ro'yxati | majburiy | ≥1 ta |
| `attachments` | fayl | ixtiyoriy, lekin qattiq tavsiya | ≤10 ta, ≤10 MB |

### 4.3 Qadam 3 — Ko'lam va yo'qotish

Savollar formulaga **aniq mos** qilib yozilgan, ikki xil talqin bo'lmasligi uchun.

| Maydon | Savol matni | Talab |
|---|---|---|
| `peopleAffected` | «Necha xodim shu ishni bajaradi?» | majburiy, >0 |
| `frequency` + `frequencyUnit` | «Har bir xodim buni qanchalik tez-tez bajaradi?» | majburiy |
| `minutesPerCase` | «Bitta xodim buni bir marta bajarishga qancha vaqt sarflaydi?» | majburiy, ≤10 000 |
| `citizensAffected` | fuqarolar soni | ixtiyoriy |
| `consequence` | hal qilinmasa nima bo'ladi | majburiy |
| `urgency` | shoshilinchlik | majburiy |
| `deadline`, `deadlineReason` | muddat | ixtiyoriy |

Uchta majburiy raqam kiritilishi bilan **oylik yo'qotish jonli hisoblanadi va
ekranda ko'rsatiladi**.

### 4.4 Qadam 4 — Ma'lumot va cheklovlar

Oddiy savollar, texnik xulosa.

| Maydon | Dasturchi shundan nimani biladi |
|---|---|
| `dataVolume` | Ma'lumotlar bazasi hajmi |
| `usersCount` | Yuklama va rol tizimi |
| `dataSensitivity` | **Xavfsizlik talablari va hosting cheklovi** |
| `integrations` + `integrationsNote` | Integratsiya hajmi |
| `accessFrom` | Arxitektura va autentifikatsiya |
| `previousAttempt` + izoh | Oldingi urinish nega muvaffaqiyatsiz bo'lgan |

### 4.5 Qadam 5 — Natija va aloqa

| Maydon | Talab |
|---|---|
| `desiredOutcome` | majburiy, ≥30 belgi |
| `successMetric` | majburiy, ≥10 belgi, o'lchanadigan |
| `contactName` | majburiy |
| `contactPosition` | ixtiyoriy |
| `contactPhone` | majburiy, normallashtiriladi |

### 4.6 Kartochka UX qoidalari

| № | Qoida | Holat |
|---|---|---|
| T-6.1 | Har bir textarea uchun to'ldirilgan namuna javob | ✅ |
| T-6.2 | Erkin matn minimal — imkon qadar tayyor variantlar | ✅ |
| T-6.3 | Qadam ko'rsatkichida to'ldirilgan qadamlar yashil | ✅ |
| T-6.4 | Ogohlantirish: fuqarolarning shaxsiy ma'lumotlarini yozmaslik | ✅ |

---

## 5. Biznes qoidalari

### 5.1 Holatlar zanjiri

```
DRAFT → SUBMITTED → APPROVED → TAKEN → SOLUTION_OFFERED → RESOLVED
            ↓                    ↓
        REJECTED             APPROVED (qo'yib yuborilsa)
                                 
        ARCHIVED (dublikat sifatida birlashtirilganda)
```

| O'tish | Kim bajaradi | Qoida |
|---|---|---|
| `DRAFT → SUBMITTED` | Rahbar | Barcha 5 qadam to'liq bo'lishi shart |
| `SUBMITTED → APPROVED` | Admin | — |
| `SUBMITTED → REJECTED` | Admin | Sabab ≥15 belgi bo'lishi shart |
| `REJECTED → SUBMITTED` | Rahbar | Tuzatib qayta yuboradi |
| `APPROVED → TAKEN` | Dasturchi | Faqat bo'sh muammoni |
| `TAKEN → APPROVED` | Dasturchi | Qo'yib yuborish |
| `TAKEN → SOLUTION_OFFERED` | Dasturchi | Izoh ≥10 belgi |
| `SOLUTION_OFFERED → RESOLVED` | **Rahbar** | Faqat rahbar yopadi |

**Muhim:** siklni **rahbar** yopadi, dasturchi emas. Aks holda muammo «hal
qilindi» deb belgilanib, tashkilotda aslida hech narsa o'zgarmagan bo'lishi
mumkin edi.

Har bir o'tish `ProblemStatusHistory` ga yoziladi.

### 5.2 Hisob-kitoblar

**Oylik yo'qotilgan soat:**

```
xodimlar × oyiga takrorlanish × bir martalik daqiqa ÷ 60
```

Oyiga takrorlanish: kuniga ×22 (ish kuni), haftasiga ×4,33, oyiga ×1, yiliga ÷12.

**To'liqlik (0–100):** maydonlar og'irliklari yig'indisi. Eng katta og'irlik —
`currentProcess` (12) va `attachments` (10).

**Ta'sir balli:**

```
(ln(1+soat)×10 + ln(1+fuqaro)×4 + ln(1+xodim)×3 + qo'llab×8)
  × shoshilinchlik_koef × (0,6 + 0,4 × to'liqlik/100)
```

Logarifm — bitta ulkan raqam ro'yxatni egallab olmasligi uchun.
Qo'llab-quvvatlash chiziqli va katta og'irlik bilan — bu eng kuchli signal.

Barcha uchta hisob-kitob **testlar bilan qoplangan** (`src/lib/scoring.test.ts`).

---

## 6. Xavfsizlik talablari

| № | Talab | Holat |
|---|---|---|
| T-7.1 | Parol `scrypt` bilan xeshlanadi (tuz + parametrlar xesh ichida) | ✅ |
| T-7.2 | Sessiya — imzolangan JWT cookie (`httpOnly`, `sameSite=lax`) | ✅ |
| T-7.3 | `sessionVersion` orqali sessiyalarni bekor qilish | ✅ |
| T-7.4 | Bloklash va parol tiklash sessiyalarni avtomatik uzadi | ✅ |
| T-7.5 | Kirishda urinishlar cheklovi (5 marta / 15 daqiqa) | ✅ |
| T-7.6 | Foydalanuvchi topilmasa ham parol tekshirilgandek vaqt ketadi | ✅ |
| T-7.7 | Ruxsat ikki qatlamda: `proxy.ts` (rol) + sahifa (baza) | ✅ |
| T-7.8 | Biriktirmalar `private` omborda; faqat token bilan o'qiladi va ruxsat tekshirilgandan keyin beriladi | ✅ |
| T-7.9 | Fayl nomi tizim tomonidan yaratiladi (UUID), yo'l sifatida ishlatilmaydi | ✅ |
| T-7.10 | Fayllar `Content-Disposition: attachment` bilan beriladi (XSS oldini olish) | ✅ |
| T-7.11 | Aloqa raqami faqat muammoni olgan dasturchiga ko'rinadi | ✅ |
| T-7.12 | Rahbar boshqa tashkilot muammosiga kira olmaydi (404) | ✅ |
| T-7.13 | Ochiq yo'naltirish (open redirect) himoyasi | ✅ |
| T-7.14 | Audit jurnali: kirish, holat o'zgarishi, fayl yuklab olish | ✅ |
| T-7.15 | `npm audit` toza bo'lishi shart | ✅ |
| T-7.16 | Ikki bosqichli autentifikatsiya (2FA) | ⏳ |

---

## 7. Nofunksional talablar

| № | Talab | Holat |
|---|---|---|
| T-8.1 | PostgreSQL 14+ | ✅ |
| T-8.2 | Ma'lumot O'zbekiston hududidagi serverda saqlanadi | ⏳ (pilotda Frankfurt — qarang 7.1) |
| T-8.3 | Kod TypeScript, `strict` rejimda, xatosiz kompilyatsiya | ✅ |
| T-8.4 | ESLint ogohlantirishsiz | ✅ |
| T-8.5 | Build ogohlantirishsiz | ✅ |
| T-8.6 | Hisob-kitob mantiqi testlar bilan qoplangan | ✅ |
| T-8.7 | Ruxsatlar avtomatik tekshiriladi (`npm run e2e`) | ✅ |
| T-8.8 | Baza ulanishi uzilsa jarayon yiqilmaydi | ✅ |
| T-8.9 | Bir sahifa ≤5 ta baza so'rovi | ✅ |
| T-8.10 | Klaviatura bilan to'liq boshqarish, fokus halqasi | ✅ |
| T-8.11 | WCAG AA kontrast darajasi | ✅ |

---

### 7.1 Ma'lumot rezidentligi haqida ogohlantirish

Pilot bosqichida ilova Vercel'da, baza esa Prisma Postgres'ning Frankfurt
mintaqasida joylashgan. Bu `T-8.2` talabini **bajarmaydi**.

Sinov uchun bu maqbul: bazada faqat namunaviy ma'lumot bor, real fuqaro
ma'lumotlari yo'q. Ammo tizim haqiqiy foydalanishga o'tishdan oldin baza
O'zbekiston hududidagi serverga ko'chirilishi shart. Ilova bunga tayyor —
`DATABASE_URL` ni o'zgartirish kifoya, kodda o'zgarish kerak emas.

## 8. Ma'lumotlar modeli

11 ta jadval. To'liq ta'rif: `prisma/schema.prisma`.

| Jadval | Vazifasi |
|---|---|
| `Organization` | Tashkilotlar, ierarxiya bilan |
| `User` | Barcha rollar, `sessionVersion` bilan |
| `DeveloperProfile` | Dasturchi ma'lumoti va tasdiqlash holati |
| `Category` | Muammo turkumlari (seed) |
| `Problem` | Muammo kartochkasi — 5 qadamning barcha maydonlari |
| `ProblemSupporter` | «Bizda ham bor» — `@@unique([problemId, organizationId])` |
| `ProblemAttachment` | Biriktirilgan fayllar |
| `ProblemStatusHistory` | Har bir holat o'zgarishi |
| `ProblemAssignment` | Dasturchi topshirig'i, `activeKey @unique` |
| `Notification` | Bildirishnomalar (jadval tayyor, interfeys ⏳) |
| `AuditLog` | Audit jurnali |

**Baza darajasidagi kafolatlar:**

- `ProblemAssignment.activeKey @unique` — bitta muammo, bitta faol dasturchi
- `ProblemSupporter @@unique([problemId, organizationId])` — takroriy qo'llab-quvvatlash yo'q
- `User.phone @unique` — login noyob
- `Problem.refCode @unique` — inson o'qiy oladigan raqam

---

## 9. Qabul qilish mezonlari

Quyidagi stsenariy to'liq ishlashi shart:

1. Admin tashkilot va rahbar akkauntini yaratadi
2. Rahbar kiradi, sehrgarni to'ldiradi
3. Yarim yo'lda sahifani yopadi — qaytganda ma'lumot joyida
4. Excel fayl biriktiradi
5. Oldindan ko'rishda kartochkani tekshiradi va yuboradi
6. Admin moderatsiyada tasdiqlaydi
7. Dasturchi omborda ko'radi, filtrlaydi, «Men olaman» bosadi
8. Telefon raqami ochiladi (bungacha yashirin edi)
9. Dasturchi «Yechim taqdim etildi» deb belgilaydi
10. Rahbar «Hal qilindi» deb yopadi

**Ruxsat tekshiruvlari** (`npm run e2e` — 31 ta tekshiruv):

- Kirmagan foydalanuvchi hech qaysi ichki sahifaga kira olmaydi
- Rahbar `/admin` va `/ombor` ga kira olmaydi
- Tasdiqlanmagan dasturchi omborga kira olmaydi
- Rahbar boshqa tashkilot muammosini ko'ra olmaydi
- Qoralama omborda ko'rinmaydi
- Aloqa raqami muammoni olmagan dasturchiga ko'rinmaydi
- Bekor qilingan sessiya qabul qilinmaydi va yo'naltirish halqasi hosil bo'lmaydi

---

## 10. Qamrovdan tashqari (keyingi bosqichlar)

| Nima | Nega hozir emas |
|---|---|
| Telegram bot | MVP hajmini ~40% oshiradi |
| Rus tili | Pilot tashkilotlar o'zbek tilida ishlaydi |
| OneID / E-IMZO | Ruxsat olish oylab cho'zilishi mumkin |
| Tashkilotlarning o'zi ro'yxatdan o'tishi | Pilotda admin qo'lda yaratadi |
| Yechimlar katalogi (bir yechim → ko'p tashkilot) | Avval yechimlar to'planishi kerak |
| Vazirlik darajasidagi kuzatuvchi rol | Talab hali aniqlanmagan |
| Dasturchi ↔ rahbar savol-javob | Telefon aloqasi pilot uchun yetarli |
| Excel eksport | Admin hozircha `db:studio` dan foydalanadi |
| Bildirishnomalar interfeysi | Jadval tayyor, xabar yuborish kanali aniqlanmagan |
| Ikki bosqichli autentifikatsiya | Pilotdan keyin |

---

## 11. Texnologiyalar

| Qatlam | Tanlov | Sabab |
|---|---|---|
| Framework | Next.js 16 (App Router) | Frontend va backend bitta kod bazasida |
| Til | TypeScript (strict) | Xatolarni kompilyatsiya vaqtida ushlash |
| Baza | PostgreSQL 17 + Prisma 7 | Tipli so'rovlar, migratsiyalar |
| Hosting | Vercel | Next.js uchun mo'ljallangan, moslashtirish kerak emas |
| Fayl ombori | Vercel Blob | Serverless muhitda disk vaqtinchalik |
| Uslub | Tailwind CSS 4 | Tez, konfiguratsiya CSS ichida |
| Autentifikatsiya | O'z yechimimiz (`jose` + `scrypt`) | Kam bog'liqlik, audit oson |
| Testlar | Node ichki test runneri | Qo'shimcha kutubxonasiz |

**Tashqi kutubxonalar ataylab minimal.** Bu davlat tizimi — har bir bog'liqlik
audit qilinishi va yillar davomida qo'llab-quvvatlanishi kerak.

---

## 12. O'zgarishlar tarixi

| Versiya | Sana | O'zgarish |
|---|---|---|
| 1.0 | 2026-08-17 | Birinchi versiya. MVP bajarildi: T-1…T-8 bo'yicha ✅ belgilangan barcha talablar |
