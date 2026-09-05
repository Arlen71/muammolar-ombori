/**
 * Sinov ma'lumotlari.  Ishga tushirish:  npm run db:seed
 *
 * DIQQAT: bu skript mavjud barcha ma'lumotni o'chirib, qaytadan yozadi.
 * Shu sababli NODE_ENV=production bo'lsa ishlashdan bosh tortadi.
 */
import "dotenv/config";

import { db } from "@/lib/db";
import { PILOT_HUDUDI } from "@/lib/hudud";
import { parolXeshla } from "@/lib/password";
import { oylikYoqotilganSoat, tasirBalli, toliqlikFoizi } from "@/lib/scoring";
import type {
  AccessLocation,
  Consequence,
  DataSensitivity,
  DataVolume,
  FrequencyUnit,
  IntegrationTarget,
  PainType,
  ProblemStatus,
  ToolUsed,
  Urgency,
  UsersCount,
} from "@/generated/prisma/enums";

/**
 * Sinov akkauntlarining paroli.
 *
 * Standart qiymat ochiq repoda turadi, shuning uchun u faqat lokal uchun.
 * Internetdan ochiq muhitga seed qilayotganda albatta o'zingiznikini bering:
 *   SEED_PASSWORD="..." npm run db:seed
 */
const SINOV_PAROLI = process.env.SEED_PASSWORD || "Parol2026!";

const TURKUMLAR = [
  { slug: "hujjat-aylanishi", name: "Hujjat aylanishi", icon: "file-text" },
  { slug: "ichki-hisobot", name: "Ichki hisobot", icon: "bar-chart" },
  { slug: "fuqarolar-murojaati", name: "Fuqarolar murojaatlari", icon: "users" },
  { slug: "kadrlar", name: "Kadrlar boshqaruvi", icon: "user-check" },
  { slug: "moliya", name: "Moliya va buxgalteriya", icon: "wallet" },
  { slug: "mol-mulk", name: "Mol-mulk va inventarizatsiya", icon: "package" },
  { slug: "rejalashtirish", name: "Rejalashtirish va nazorat", icon: "target" },
  { slug: "arxiv", name: "Arxiv", icon: "archive" },
  { slug: "ichki-aloqa", name: "Ichki aloqa", icon: "message-square" },
  { slug: "statistika", name: "Statistika yig'ish", icon: "trending-up" },
  { slug: "boshqa", name: "Boshqa", icon: "circle-help" },
];

type MuammoQolipi = {
  turkum: string;
  title: string;
  description: string;
  painTypes: PainType[];
  currentProcess: string;
  toolsUsed: ToolUsed[];
  toolsNote?: string;
  rolesInvolved: string[];
  frequency: number;
  frequencyUnit: FrequencyUnit;
  minutesPerCase: number;
  peopleAffected: number;
  citizensAffected?: number;
  consequence: Consequence;
  urgency: Urgency;
  dataVolume: DataVolume;
  usersCount: UsersCount;
  dataSensitivity: DataSensitivity;
  integrations?: IntegrationTarget[];
  integrationsNote?: string;
  accessFrom: AccessLocation[];
  previousAttempt?: boolean;
  previousAttemptNote?: string;
  desiredOutcome: string;
  successMetric: string;
  /** Fayl biriktirilgan deb hisoblansinmi (to'liqlik ballida aks etadi) */
  fayllar?: string[];
  status: ProblemStatus;
};

const MUAMMOLAR: MuammoQolipi[] = [
  {
    turkum: "fuqarolar-murojaati",
    title: "Fuqarolar murojaatlari qog'oz jurnalda qayd qilinadi, javob muddati nazoratsiz",
    description:
      "Fuqarolar arizalari qabulxonada qog'oz jurnalga yozib olinadi va tegishli bo'limga qo'lda topshiriladi. Kim qaysi murojaatni olgani, javob muddati yaqinlashgani yoki o'tib ketgani hech qayerda ko'rinmaydi. Natijada qonunda belgilangan 15 kunlik muddat muntazam buziladi va yuqori tashkilotdan so'rov keladi. Murojaat qayerda qolib ketganini aniqlash uchun har bir bo'limga alohida qo'ng'iroq qilishga to'g'ri keladi.",
    painTypes: ["PAPERWORK", "NO_CONTROL", "DELAYS_WAITING", "DATA_LOSS_ERRORS"],
    currentProcess:
      "1. Fuqaro qabulxonaga keladi, ariza yozadi.\n2. Kotib jurnalga qo'lda raqam beradi va sanani yozadi.\n3. Ariza nusxasi tegishli bo'lim mudiriga qog'ozda beriladi.\n4. Bo'lim javob tayyorlab, qabulxonaga qaytaradi.\n5. Kotib javobni jurnalga belgilaydi va fuqaroga telefon qiladi.\n6. Muddat nazorati faqat kotibning yodida.",
    toolsUsed: ["PAPER", "EXCEL", "TELEGRAM"],
    rolesInvolved: ["Qabulxona kotibi", "Bo'lim mudiri", "Hokim o'rinbosari", "Ijrochi xodim"],
    // Har bir xodim kuniga ~4 ta murojaat bilan ishlaydi (jami kuniga ~25 ta)
    frequency: 4,
    frequencyUnit: "DAY",
    minutesPerCase: 12,
    peopleAffected: 6,
    citizensAffected: 6500,
    consequence: "LEGAL_NONCOMPLIANCE",
    urgency: "CRITICAL",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "PERSONAL",
    integrations: ["SMS", "MY_GOV"],
    accessFrom: ["OFFICE_ONLY", "INTERNET", "MOBILE"],
    previousAttempt: true,
    previousAttemptNote:
      "2024-yilda Excel jadval yuritishga urinilgan, lekin bir vaqtda bir necha kishi ishlay olmagani uchun tashlab yuborilgan.",
    desiredOutcome:
      "Har bir murojaat tizimga kiritilsin, mas'ul xodimga biriktirilsin, muddat yaqinlashganda avtomatik ogohlantirish kelsin. Fuqaro SMS orqali holatni bilib tursin.",
    successMetric: "Muddati o'tib ketgan murojaatlar ulushi 0 ga tushsin",
    fayllar: ["murojaatlar-jurnali.xlsx", "ariza-blankasi.pdf"],
    status: "APPROVED",
  },
  {
    turkum: "ichki-hisobot",
    title: "Tuman bo'yicha oylik hisobot 12 ta bo'limdan Excel orqali qo'lda yig'iladi",
    description:
      "Har oyning oxirida 12 ta bo'lim o'z hisobotini alohida Excel faylda tayyorlab, Telegram orqali yuboradi. Iqtisod bo'limi ularni bitta faylga qo'lda ko'chirib, umumiy hisobot tuzadi. Fayllarning ustun tartibi har xil, ba'zilar eski shablonni ishlatadi, formulalar buziladi. Bitta hisobotni yig'ishga ikki xodimning uch kuni ketadi va har oyda albatta hisoblash xatosi topiladi.",
    painTypes: ["MANUAL_REPETITIVE", "HARD_REPORTING", "DATA_LOSS_ERRORS", "DATA_SCATTERED"],
    currentProcess:
      "1. Iqtisod bo'limi shablon faylni Telegram guruhga tashlaydi.\n2. 12 ta bo'lim to'ldirib qaytaradi (ba'zilari kechikadi, eslatish kerak).\n3. Xodim har bir faylni ochib, ma'lumotni umumiy jadvalga ko'chiradi.\n4. Yig'indilar qo'lda tekshiriladi.\n5. Tayyor hisobot viloyatga yuboriladi.",
    toolsUsed: ["EXCEL", "TELEGRAM", "EMAIL"],
    rolesInvolved: ["Iqtisod bo'limi mutaxassisi", "Bo'lim mudirlari", "Hokim o'rinbosari"],
    frequency: 1,
    frequencyUnit: "MONTH",
    minutesPerCase: 720,
    peopleAffected: 14,
    consequence: "REPORT_DELAYS",
    urgency: "HIGH",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_5_TO_20",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY", "INTERNET"],
    desiredOutcome:
      "Har bir bo'lim o'z ma'lumotini to'g'ridan-to'g'ri tizimga kiritsin, umumiy hisobot avtomatik shakllansin va bir tugma bilan yuklab olinsin.",
    successMetric: "Hisobot yig'ish vaqti 3 kundan 1 soatga tushsin",
    fayllar: ["oylik-hisobot-shablon.xlsx"],
    status: "APPROVED",
  },
  {
    turkum: "rejalashtirish",
    title: "Topshiriqlar Telegram guruhda beriladi, bajarilishi kuzatilmaydi",
    description:
      "Yig'ilishlarda berilgan topshiriqlar Telegram guruhga yoziladi yoki og'zaki aytiladi. Bir hafta o'tgach kim nima qilgani, qaysi topshiriq bajarilmay qolgani noma'lum. Keyingi yig'ilishda yana o'sha savollar takrorlanadi. Rahbar ijro intizomini baholay olmaydi, chunki hech qanday yozma nazorat yo'q.",
    painTypes: ["NO_CONTROL", "DATA_LOSS_ERRORS", "DATA_SCATTERED"],
    currentProcess:
      "1. Yig'ilishda topshiriq beriladi.\n2. Kotib bayonnomaga yozadi (ba'zan yozilmaydi).\n3. Topshiriq Telegram guruhga tashlanadi.\n4. Bajarilgani haqida xabar ham o'sha guruhda keladi, xabarlar orasida yo'qoladi.\n5. Keyingi yig'ilishda holat og'zaki so'raladi.",
    toolsUsed: ["TELEGRAM", "PAPER", "WORD"],
    rolesInvolved: ["Hokim", "Hokim o'rinbosarlari", "Bo'lim mudirlari", "Kotib"],
    // Har bir mas'ul haftasiga ~1 ta topshiriq bo'yicha hisobot beradi
    frequency: 1,
    frequencyUnit: "WEEK",
    minutesPerCase: 20,
    peopleAffected: 18,
    consequence: "TIME_LOST",
    urgency: "HIGH",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    integrations: ["OTHER"],
    integrationsNote: "Telegram bot orqali topshiriq va eslatma yuborish",
    accessFrom: ["OFFICE_ONLY", "MOBILE", "INTERNET"],
    desiredOutcome:
      "Har bir topshiriq mas'ul shaxs va muddat bilan tizimga kiritilsin, bajarilish foizi rahbar ekranida ko'rinsin.",
    successMetric: "Muddatida bajarilgan topshiriqlar ulushi 90% dan oshsin",
    status: "APPROVED",
  },
  {
    turkum: "kadrlar",
    title: "Ta'til arizalari va grafigi qog'ozda yuritiladi",
    description:
      "Xodim ta'tilga chiqish uchun qo'lda ariza yozadi, uni bo'lim mudiri, kadrlar bo'limi va rahbar imzolaydi. Ariza yo'lda bir necha kun yuradi, ba'zan yo'qoladi. Kimning qancha ta'til kuni qolganini bilish uchun kadrlar bo'limi qog'oz papkani varaqlaydi. Ta'til grafigi Excel'da, lekin real ta'tillar bilan mos kelmaydi.",
    painTypes: ["PAPERWORK", "MANUAL_REPETITIVE", "DELAYS_WAITING", "DATA_LOSS_ERRORS"],
    currentProcess:
      "1. Xodim qo'lda ariza yozadi.\n2. Bo'lim mudiri imzolaydi.\n3. Kadrlar bo'limi qolgan ta'til kunlarini papkadan tekshiradi.\n4. Rahbar imzolaydi.\n5. Buyruq chiqariladi, nusxasi buxgalteriyaga beriladi.",
    toolsUsed: ["PAPER", "EXCEL"],
    rolesInvolved: ["Xodim", "Bo'lim mudiri", "Kadrlar bo'limi mudiri", "Rahbar", "Buxgalter"],
    frequency: 20,
    frequencyUnit: "MONTH",
    minutesPerCase: 45,
    peopleAffected: 5,
    consequence: "TIME_LOST",
    urgency: "MEDIUM",
    dataVolume: "UNDER_100",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "PERSONAL",
    accessFrom: ["OFFICE_ONLY", "MOBILE"],
    desiredOutcome:
      "Xodim ta'tilni tizimda so'rasin, tasdiqlash zanjiri elektron o'tsin, qolgan ta'til kunlari avtomatik hisoblansin.",
    successMetric: "Ariza tasdiqlanishi 5 kundan 1 kunga tushsin",
    fayllar: ["tatil-grafigi-2026.xlsx"],
    status: "APPROVED",
  },
  {
    turkum: "kadrlar",
    title: "Xodimlarning shaxsiy ishlari qog'oz papkalarda, kerakli ma'lumotni topish qiyin",
    description:
      "400 dan ortiq xodimning shaxsiy ishi metall shkaflarda saqlanadi. Ma'lumotnoma tayyorlash yoki xodimning ma'lumoti, staji, malaka oshirishini tekshirish uchun papka qo'lda qidiriladi. Yuqori tashkilotdan 'shu toifadagi xodimlar ro'yxatini bering' degan so'rov kelsa, butun bo'lim bir necha kun papka varaqlaydi.",
    painTypes: ["PAPERWORK", "DATA_SCATTERED", "HARD_REPORTING"],
    currentProcess:
      "1. So'rov keladi.\n2. Kadrlar xodimi shkafdan papkalarni oladi.\n3. Har bir papkadan kerakli ma'lumot qo'lda qog'ozga ko'chiriladi.\n4. Ro'yxat Excel'da teriladi.\n5. Papkalar joyiga qaytariladi.",
    toolsUsed: ["PAPER", "EXCEL", "WORD"],
    rolesInvolved: ["Kadrlar bo'limi mudiri", "Kadrlar inspektori"],
    frequency: 8,
    frequencyUnit: "MONTH",
    minutesPerCase: 180,
    peopleAffected: 3,
    consequence: "TIME_LOST",
    urgency: "MEDIUM",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_1_TO_5",
    dataSensitivity: "PERSONAL",
    accessFrom: ["OFFICE_ONLY"],
    desiredOutcome:
      "Xodimlar ma'lumotlari bazada saqlansin, istalgan kesimda (yosh, staj, ma'lumot, lavozim) bir necha soniyada ro'yxat olinsin.",
    successMetric: "Ma'lumotnoma tayyorlash 2 kundan 10 daqiqaga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "hujjat-aylanishi",
    title: "Kiruvchi va chiquvchi xatlar qo'lda jurnalga yoziladi",
    description:
      "Har bir kiruvchi xat qabulxonada qog'oz jurnalga raqamlanadi, keyin rezolyutsiya bilan bo'limga beriladi. Chiquvchi xatlar ham alohida jurnalda. Bir xatning taqdirini bilish uchun ikkala jurnalni varaqlash kerak. Yil oxirida jurnallar arxivga topshiriladi va keyingi yil izlash yanada qiyinlashadi.",
    painTypes: ["PAPERWORK", "MANUAL_REPETITIVE", "DATA_SCATTERED", "NO_CONTROL"],
    currentProcess:
      "1. Xat keladi (pochta, kuryer yoki elektron).\n2. Kotib qog'oz jurnalga raqam, sana, kimdan kelganini yozadi.\n3. Rahbar rezolyutsiya qo'yadi.\n4. Xat nusxasi bo'limga beriladi.\n5. Javob tayyor bo'lgach chiquvchi jurnalga yoziladi.",
    toolsUsed: ["PAPER", "EMAIL", "WORD"],
    rolesInvolved: ["Kotib", "Rahbar", "Bo'lim mudiri"],
    // Har bir xodim kuniga ~10 ta xat bilan ishlaydi (jami kuniga ~40 ta)
    frequency: 10,
    frequencyUnit: "DAY",
    minutesPerCase: 8,
    peopleAffected: 4,
    consequence: "TIME_LOST",
    urgency: "HIGH",
    dataVolume: "OVER_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    integrations: ["E_IJRO"],
    accessFrom: ["OFFICE_ONLY", "INTERNET"],
    desiredOutcome:
      "Kiruvchi va chiquvchi hujjatlar yagona elektron jurnalda bo'lsin, qidiruv matn bo'yicha ishlasin, rezolyutsiya elektron qo'yilsin.",
    successMetric: "Xatni topish vaqti 15 daqiqadan 10 soniyaga tushsin",
    fayllar: ["kiruvchi-jurnal-namuna.jpg"],
    status: "APPROVED",
  },
  {
    turkum: "mol-mulk",
    title: "Inventarizatsiya yiliga bir marta qo'lda o'tkaziladi va uch hafta davom etadi",
    description:
      "Yil oxirida komissiya har bir xonaga kirib, mol-mulkni qo'lda ro'yxatga oladi. Inventar raqamlari eskirgan, ba'zilari o'chib ketgan. Ro'yxat qog'ozda to'ldirilib, keyin Excel'ga teriladi va buxgalteriya ma'lumotlari bilan solishtiriladi. Har yili o'nlab nomuvofiqlik chiqadi va ularni tushuntirish uchun yana vaqt ketadi.",
    painTypes: ["MANUAL_REPETITIVE", "PAPERWORK", "DATA_LOSS_ERRORS"],
    currentProcess:
      "1. Buyruq bilan komissiya tuziladi.\n2. Buxgalteriyadan mol-mulk ro'yxati chop etiladi.\n3. Komissiya xonama-xona yurib, qog'ozda belgilaydi.\n4. Natija Excel'ga teriladi.\n5. Nomuvofiqliklar bo'yicha dalolatnoma tuziladi.",
    toolsUsed: ["PAPER", "EXCEL", "ONE_C"],
    toolsNote: "Buxgalteriya 1C dan foydalanadi, lekin komissiya unga kira olmaydi",
    rolesInvolved: ["Komissiya raisi", "Buxgalter", "Mas'ul xodimlar", "Xo'jalik mudiri"],
    frequency: 1,
    frequencyUnit: "YEAR",
    minutesPerCase: 6600,
    peopleAffected: 7,
    consequence: "ERRORS_FINES",
    urgency: "MEDIUM",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_5_TO_20",
    dataSensitivity: "INTERNAL",
    integrations: ["ONE_C"],
    accessFrom: ["OFFICE_ONLY", "MOBILE"],
    desiredOutcome:
      "Har bir buyumga QR-kod yopishtirilsin, komissiya telefon bilan skanerlab o'tsin, natija 1C bilan avtomatik solishtirilsin.",
    successMetric: "Inventarizatsiya 3 haftadan 3 kunga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "statistika",
    title: "Yuqori tashkilotga har hafta bir xil ma'lumot qayta-qayta yuboriladi",
    description:
      "Viloyatdan har hafta bir nechta so'rov keladi va ularning ko'pi bir xil ma'lumotni turli shaklda so'raydi. Xodim har safar boshidan yig'adi, chunki oldingi javob qayerda saqlangani esdan chiqadi. Bir xil raqam turli so'rovlarda turlicha chiqib qolgan hollar ham bo'lgan.",
    painTypes: ["MANUAL_REPETITIVE", "HARD_REPORTING", "DATA_SCATTERED", "DATA_LOSS_ERRORS"],
    currentProcess:
      "1. Viloyatdan Telegram yoki xat orqali so'rov keladi.\n2. Xodim tegishli bo'limlardan ma'lumot so'raydi.\n3. Javoblar Excel'ga yig'iladi.\n4. Shaklga moslab qayta teriladi va yuboriladi.",
    toolsUsed: ["EXCEL", "TELEGRAM", "EMAIL"],
    rolesInvolved: ["Statistika mutaxassisi", "Bo'lim mudirlari"],
    frequency: 4,
    frequencyUnit: "WEEK",
    minutesPerCase: 150,
    peopleAffected: 5,
    consequence: "REPORT_DELAYS",
    urgency: "HIGH",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_5_TO_20",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY", "INTERNET"],
    desiredOutcome:
      "Asosiy ko'rsatkichlar bir marta kiritilsin va turli shakllardagi hisobotlar shu bazadan avtomatik shakllansin.",
    successMetric: "Bitta so'rovga javob 2,5 soatdan 15 daqiqaga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "arxiv",
    title: "Arxivdagi hujjatni topish uchun javonlar jismonan qidiriladi",
    description:
      "Arxivda 15 yillik hujjatlar saqlanadi. Qaysi ish qaysi javonda ekani faqat qog'oz ro'yxatda, u ham to'liq emas. Sud yoki tekshiruv organi hujjat so'rasa, uni topishga bir necha soatdan bir kungacha vaqt ketadi. Ba'zi hujjatlar umuman topilmaydi.",
    painTypes: ["PAPERWORK", "DATA_SCATTERED", "DELAYS_WAITING"],
    currentProcess:
      "1. So'rov keladi.\n2. Arxiv mudiri qog'oz ro'yxatdan taxminiy joyni topadi.\n3. Javonlar qo'lda ko'rib chiqiladi.\n4. Topilgan hujjat nusxalanadi va qaytariladi.",
    toolsUsed: ["PAPER"],
    rolesInvolved: ["Arxiv mudiri", "Kotib"],
    frequency: 12,
    frequencyUnit: "MONTH",
    minutesPerCase: 240,
    peopleAffected: 2,
    consequence: "LEGAL_NONCOMPLIANCE",
    urgency: "MEDIUM",
    dataVolume: "OVER_10000",
    usersCount: "FROM_1_TO_5",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY"],
    desiredOutcome:
      "Arxiv hujjatlarining elektron katalogi bo'lsin: yil, tur, nom va kalit so'z bo'yicha qidirilsin, javon raqami darhol chiqsin.",
    successMetric: "Hujjatni topish 4 soatdan 5 daqiqaga tushsin",
    status: "SUBMITTED",
  },
  {
    turkum: "moliya",
    title: "Smeta bajarilishi oyda bir marta qo'lda solishtiriladi",
    description:
      "Byudjet smetasi Excel'da, real xarajatlar esa 1C da. Ularni solishtirish uchun buxgalter har oy ikkala manbadan ma'lumot chiqarib, qo'lda taqqoslaydi. Oy o'rtasida qaysi moddadan qancha mablag' qolganini bilish imkonsiz, shuning uchun ba'zan smeta oshib ketadi.",
    painTypes: ["MANUAL_REPETITIVE", "DATA_SCATTERED", "NO_CONTROL"],
    currentProcess:
      "1. 1C dan xarajatlar hisoboti chiqariladi.\n2. Excel'dagi smeta ochiladi.\n3. Modda bo'yicha qo'lda solishtiriladi.\n4. Farq bo'lsa sabab qidiriladi.\n5. Rahbarga qog'oz ma'lumotnoma beriladi.",
    toolsUsed: ["EXCEL", "ONE_C"],
    rolesInvolved: ["Bosh buxgalter", "Buxgalter", "Iqtisodchi", "Rahbar"],
    frequency: 1,
    frequencyUnit: "MONTH",
    minutesPerCase: 480,
    peopleAffected: 3,
    consequence: "ERRORS_FINES",
    urgency: "HIGH",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_1_TO_5",
    dataSensitivity: "CONFIDENTIAL",
    integrations: ["ONE_C", "BANK"],
    accessFrom: ["OFFICE_ONLY"],
    desiredOutcome:
      "Smeta va real xarajatlar bitta ekranda ko'rinsin, har bir modda bo'yicha qoldiq real vaqtda yangilansin, chegara yaqinlashganda ogohlantirsin.",
    successMetric: "Smetadan oshib ketish holatlari yiliga 0 ga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "kadrlar",
    title: "O'qituvchilar tarifikatsiyasi har yili qo'lda hisoblanadi",
    description:
      "Har o'quv yili boshida 2 400 dan ortiq o'qituvchining dars soati, toifasi, staji va qo'shimcha to'lovlari asosida tarifikatsiya tuziladi. Hammasi Excel'da, formulalar har yili qo'lda tuzatiladi. Bitta xato butun maktab bo'yicha oylikni buzadi va keyin oylab tushuntirish yoziladi.",
    painTypes: ["MANUAL_REPETITIVE", "DATA_LOSS_ERRORS", "HARD_REPORTING"],
    currentProcess:
      "1. Maktablar dars yuklamasini Excel'da yuboradi.\n2. Metodist soatlarni tekshiradi.\n3. Buxgalteriya toifa va staj bo'yicha koeffitsiyentlarni qo'lda qo'llaydi.\n4. Tarifikatsiya ro'yxati chop etilib imzolanadi.",
    toolsUsed: ["EXCEL", "TELEGRAM", "PAPER"],
    rolesInvolved: ["Metodist", "Buxgalter", "Maktab direktori", "Kadrlar inspektori"],
    frequency: 2,
    frequencyUnit: "YEAR",
    minutesPerCase: 9600,
    peopleAffected: 12,
    citizensAffected: 2400,
    consequence: "ERRORS_FINES",
    urgency: "CRITICAL",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "PERSONAL",
    integrations: ["ONE_C"],
    accessFrom: ["OFFICE_ONLY", "INTERNET", "BRANCHES"],
    previousAttempt: true,
    previousAttemptNote:
      "Tayyor dastur sotib olingan, lekin bizning toifa koeffitsiyentlarimizga moslashmagani uchun ishlatilmayapti.",
    desiredOutcome:
      "Maktablar yuklamani tizimga kiritsin, tarifikatsiya avtomatik hisoblansin, o'zgarish bo'lsa qayta hisoblash bir tugma bilan bo'lsin.",
    successMetric: "Tarifikatsiya xatolari soni yiliga 0 ga tushsin",
    fayllar: ["tarifikatsiya-2025.xlsx", "koeffitsiyentlar.pdf"],
    status: "TAKEN",
  },
  {
    turkum: "statistika",
    title: "Maktablardan haftalik davomat hisoboti Telegram orqali yig'iladi",
    description:
      "Tumandagi 68 ta maktab har dushanba o'quvchilar davomatini Telegram guruhga rasm yoki matn ko'rinishida tashlaydi. Metodist ularni qo'lda Excel'ga ko'chiradi. Ba'zi maktablar kechikadi, ba'zilari umuman yubormaydi, eslatish uchun alohida qo'ng'iroq qilinadi.",
    painTypes: ["MANUAL_REPETITIVE", "DATA_SCATTERED", "HARD_REPORTING", "DELAYS_WAITING"],
    currentProcess:
      "1. Metodist guruhga eslatma yozadi.\n2. Maktablar rasm yoki matn yuboradi.\n3. Metodist har birini Excel'ga qo'lda kiritadi.\n4. Yubormaganlarga qo'ng'iroq qilinadi.\n5. Umumiy hisobot viloyatga jo'natiladi.",
    toolsUsed: ["TELEGRAM", "EXCEL"],
    rolesInvolved: ["Metodist", "Maktab direktorlari", "Boshqarma boshlig'i"],
    frequency: 1,
    frequencyUnit: "WEEK",
    minutesPerCase: 300,
    peopleAffected: 3,
    citizensAffected: 41000,
    consequence: "REPORT_DELAYS",
    urgency: "HIGH",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    accessFrom: ["INTERNET", "MOBILE", "BRANCHES"],
    desiredOutcome:
      "Har bir maktab davomatni o'zi tizimga kiritsin, yubormaganlar ro'yxati avtomatik ko'rinsin, umumiy hisobot o'zi shakllansin.",
    successMetric: "Hisobot dushanba soat 10:00 ga tayyor bo'lsin",
    fayllar: ["davomat-shablon.xlsx"],
    status: "APPROVED",
  },
  {
    turkum: "mol-mulk",
    title: "Darsliklar taqsimoti va zaxirasi hisobi yuritilmaydi",
    description:
      "Darsliklar maktablarga taqsimlanadi, lekin qaysi maktabda qaysi darslikdan qancha borligi hech qayerda yagona ko'rinishda emas. Yil o'rtasida bir maktabda darslik yetishmasa, boshqasida ortiqcha turgani bilinmaydi. Natijada ortiqcha xarid qilinadi.",
    painTypes: ["DATA_SCATTERED", "NO_CONTROL", "HARD_REPORTING"],
    currentProcess:
      "1. Maktablar ehtiyoj ro'yxatini qog'ozda yuboradi.\n2. Boshqarma umumiy raqamni chiqaradi.\n3. Darsliklar yetkazib beriladi.\n4. Real qoldiq faqat yil oxirida ma'lum bo'ladi.",
    toolsUsed: ["PAPER", "EXCEL"],
    rolesInvolved: ["Boshqarma mutaxassisi", "Maktab kutubxonachilari", "Direktorlar"],
    frequency: 3,
    frequencyUnit: "YEAR",
    minutesPerCase: 2400,
    peopleAffected: 6,
    consequence: "ERRORS_FINES",
    urgency: "MEDIUM",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    accessFrom: ["INTERNET", "BRANCHES"],
    desiredOutcome:
      "Har bir maktabdagi darslik qoldig'i tizimda ko'rinsin, ortiqcha va yetishmovchilik avtomatik aniqlansin.",
    successMetric: "Ortiqcha xarid 0 ga tushsin",
    status: "SUBMITTED",
  },
  {
    turkum: "ichki-hisobot",
    title: "Shifokorlar navbatchilik jadvali qo'lda tuziladi va tez-tez o'zgaradi",
    description:
      "Oylik navbatchilik jadvali qog'ozda tuziladi va devorga osiladi. Kimdir kasal bo'lsa yoki ta'tilga chiqsa, almashtirish og'zaki kelishiladi, jadval yangilanmaydi. Natijada ba'zi smenalarda ikki shifokor, ba'zilarida hech kim bo'lmay qoladi.",
    painTypes: ["PAPERWORK", "DATA_LOSS_ERRORS", "NO_CONTROL"],
    currentProcess:
      "1. Bo'lim mudiri jadvalni qog'ozda tuzadi.\n2. Jadval devorga osiladi va Telegram guruhga rasm tashlanadi.\n3. Almashtirishlar og'zaki kelishiladi.\n4. Oy oxirida buxgalteriya uchun jadval qayta tiklanadi.",
    toolsUsed: ["PAPER", "TELEGRAM", "EXCEL"],
    rolesInvolved: ["Bo'lim mudiri", "Shifokorlar", "Hamshiralar", "Buxgalter"],
    frequency: 1,
    frequencyUnit: "MONTH",
    minutesPerCase: 420,
    peopleAffected: 9,
    citizensAffected: 15000,
    consequence: "CITIZEN_COMPLAINTS",
    urgency: "HIGH",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY", "MOBILE"],
    desiredOutcome:
      "Navbatchilik jadvali tizimda tuzilsin, almashtirish so'rovi elektron tasdiqlansin, har kim o'z jadvalini telefonda ko'rsin.",
    successMetric: "Qoplanmagan smenalar oyiga 0 ga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "mol-mulk",
    title: "Dori-darmon zaxirasi har bir muassasada alohida Excel faylda yuritiladi",
    description:
      "Viloyatdagi har bir tibbiyot muassasasi dori zaxirasini o'z Excel faylida yuritadi. Boshqarma umumiy holatni bilish uchun har oy fayllarni yig'adi. Muddati o'tayotgan dorilar o'z vaqtida aniqlanmaydi, bir joyda tanqis bo'lgan dori boshqa joyda ortiqcha turadi.",
    painTypes: ["DATA_SCATTERED", "NO_CONTROL", "HARD_REPORTING"],
    currentProcess:
      "1. Muassasalar Excel faylini oy oxirida yuboradi.\n2. Boshqarma fayllarni bitta jadvalga ko'chiradi.\n3. Tanqislik va ortiqchalik qo'lda solishtiriladi.\n4. Qayta taqsimlash og'zaki kelishiladi.",
    toolsUsed: ["EXCEL", "EMAIL", "TELEGRAM"],
    rolesInvolved: ["Bosh farmatsevt", "Muassasa mas'ullari", "Boshqarma mutaxassisi"],
    frequency: 1,
    frequencyUnit: "MONTH",
    minutesPerCase: 900,
    peopleAffected: 11,
    citizensAffected: 320000,
    consequence: "CITIZEN_COMPLAINTS",
    urgency: "CRITICAL",
    dataVolume: "OVER_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    integrations: ["ONE_C"],
    accessFrom: ["INTERNET", "BRANCHES"],
    desiredOutcome:
      "Barcha muassasalar zaxirasi yagona tizimda ko'rinsin, muddati yaqinlashgan dorilar avtomatik ogohlantirilsin, qayta taqsimlash tizim orqali rasmiylashtirilsin.",
    successMetric: "Muddati o'tib yaroqsiz bo'lgan dori miqdori 90% ga kamaysin",
    fayllar: ["dori-zaxirasi-namuna.xlsx"],
    status: "APPROVED",
  },
  {
    turkum: "fuqarolar-murojaati",
    title: "Bemorlar murojaati va shikoyatlari statistikasi qo'lda sanaladi",
    description:
      "Bemorlarning yozma va og'zaki murojaatlari daftarga yoziladi. Oy oxirida ular qo'lda sanab chiqiladi va turlarga ajratiladi. Qaysi bo'limga shikoyat ko'pligini tahlil qilish deyarli imkonsiz, chunki ma'lumot faqat qog'ozda.",
    painTypes: ["PAPERWORK", "HARD_REPORTING", "NO_CONTROL"],
    currentProcess:
      "1. Murojaat daftarga yoziladi.\n2. Oy oxirida qo'lda sanaladi.\n3. Turlar bo'yicha guruhlanadi.\n4. Hisobot Word'da teriladi.",
    toolsUsed: ["PAPER", "WORD"],
    rolesInvolved: ["Qabulxona hamshirasi", "Bosh shifokor o'rinbosari"],
    frequency: 1,
    frequencyUnit: "MONTH",
    minutesPerCase: 360,
    peopleAffected: 2,
    citizensAffected: 4800,
    consequence: "CITIZEN_COMPLAINTS",
    urgency: "MEDIUM",
    dataVolume: "FROM_100_TO_1000",
    usersCount: "FROM_1_TO_5",
    dataSensitivity: "PERSONAL",
    accessFrom: ["OFFICE_ONLY"],
    desiredOutcome:
      "Murojaat tizimga kiritilsin, turi va bo'lim bo'yicha avtomatik guruhlansin, oylik tahlil o'zi shakllansin.",
    successMetric: "Oylik tahlil 6 soatdan 5 daqiqaga tushsin",
    status: "SOLUTION_OFFERED",
  },
  {
    turkum: "ichki-aloqa",
    title: "Bo'limlar orasida hujjat qo'ldan qo'lga beriladi, kim ushlab turgani noma'lum",
    description:
      "Ichki hujjatlar (ma'lumotnoma, xizmat xati, dalolatnoma) qo'lda imzolanib, bo'limdan bo'limga jismonan olib boriladi. Hujjat qayerda qolgani noma'lum bo'lsa, xodim uni izlab yuradi. Ba'zan hujjat butunlay yo'qoladi va qaytadan tayyorlanadi.",
    painTypes: ["PAPERWORK", "DELAYS_WAITING", "DATA_LOSS_ERRORS", "NO_CONTROL"],
    currentProcess:
      "1. Xodim hujjatni tayyorlaydi va chop etadi.\n2. Bo'lim mudiriga imzoga olib boradi.\n3. Keyingi bo'limga olib boradi.\n4. Har bir bosqichda kutish bo'ladi.\n5. Imzolangan hujjat kotibga topshiriladi.",
    toolsUsed: ["PAPER", "WORD"],
    rolesInvolved: ["Xodim", "Bo'lim mudirlari", "Kotib", "Rahbar"],
    // Har bir xodim kuniga ~2 ta hujjatni imzoga olib yuradi
    frequency: 2,
    frequencyUnit: "DAY",
    minutesPerCase: 25,
    peopleAffected: 8,
    consequence: "TIME_LOST",
    urgency: "HIGH",
    dataVolume: "FROM_1000_TO_10000",
    usersCount: "FROM_20_TO_100",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY", "INTERNET"],
    desiredOutcome:
      "Ichki hujjatlar elektron imzolansin, hujjatning hozir kimda turgani real vaqtda ko'rinsin.",
    successMetric: "Hujjatning to'liq imzolanishi 3 kundan 4 soatga tushsin",
    status: "APPROVED",
  },
  {
    turkum: "rejalashtirish",
    title: "Yillik reja bajarilishi choraklik yig'ilishdan boshqa vaqtda kuzatilmaydi",
    description:
      "Yillik ish rejasi Word hujjatida tasdiqlanadi va papkaga qo'yiladi. Bajarilish holati faqat chorak yakunida yig'ilishda muhokama qilinadi. Oraliqda qaysi tadbir kechikayotgani ko'rinmaydi, shuning uchun chorak oxirida shoshilinch ish boshlanadi.",
    painTypes: ["NO_CONTROL", "HARD_REPORTING", "DATA_SCATTERED"],
    currentProcess:
      "1. Yillik reja Word'da tuziladi va tasdiqlanadi.\n2. Chorak oxirida bo'limlardan hisobot so'raladi.\n3. Hisobotlar qo'lda umumlashtiriladi.\n4. Yig'ilishda muhokama qilinadi.",
    toolsUsed: ["WORD", "EXCEL", "PAPER"],
    rolesInvolved: ["Rahbar", "Bo'lim mudirlari", "Kotib"],
    frequency: 4,
    frequencyUnit: "YEAR",
    minutesPerCase: 1800,
    peopleAffected: 10,
    consequence: "REPORT_DELAYS",
    urgency: "MEDIUM",
    dataVolume: "UNDER_100",
    usersCount: "FROM_5_TO_20",
    dataSensitivity: "INTERNAL",
    accessFrom: ["OFFICE_ONLY", "INTERNET"],
    desiredOutcome:
      "Reja bandlari mas'ul va muddat bilan tizimga kiritilsin, bajarilish foizi doimo ko'rinib tursin.",
    successMetric: "Kechikkan tadbirlar chorak oxirida emas, kechikkan kuniyoq ko'rinsin",
    status: "APPROVED",
  },
];

/** Qaysi muammoni qaysi tashkilot ham qo'llab-quvvatlaydi (dublikat signali). */
const QOLLAB_QUVVATLASH: Record<number, number[]> = {
  // muammo indeksi → uni qo'llab-quvvatlovchi tashkilot indekslari
  0: [1, 2, 3], // fuqarolar murojaati — hamma tashkilotda bor
  3: [1, 2, 3], // ta'til arizalari
  5: [1, 3], // kiruvchi-chiquvchi xatlar
  7: [1, 2], // takroriy so'rovlar
  17: [1, 2, 3], // ichki hujjat aylanishi
  2: [3], // topshiriqlar nazorati
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed skripti ishlab chiqarish muhitida ishlamaydi.");
  }

  console.log("Eski ma'lumotlar tozalanmoqda…");
  // Bog'liqlik tartibida o'chiramiz
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.problemStatusHistory.deleteMany();
  await db.problemAssignment.deleteMany();
  await db.problemAttachment.deleteMany();
  await db.problemSupporter.deleteMany();
  await db.problem.deleteMany();
  await db.developerProfile.deleteMany();
  await db.user.deleteMany();
  await db.organization.deleteMany();
  await db.category.deleteMany();

  console.log("Turkumlar…");
  const turkumlar = new Map<string, string>();
  for (const [i, t] of TURKUMLAR.entries()) {
    const yaratilgan = await db.category.create({
      data: { slug: t.slug, name: t.name, icon: t.icon, order: i },
    });
    turkumlar.set(t.slug, yaratilgan.id);
  }

  console.log("Tashkilotlar…");
  const tashkilotlar = await Promise.all(
    [
      {
        name: "Qarshi shahar hokimligi",
        type: "KHOKIMIYAT" as const,
        region: PILOT_HUDUDI,
        district: "Qarshi shahri",
        stir: "201234567",
      },
      {
        name: "Qashqadaryo viloyati sog'liqni saqlash boshqarmasi",
        type: "HEALTHCARE" as const,
        region: PILOT_HUDUDI,
        district: "Qarshi shahri",
        stir: "202345678",
      },
      {
        name: "Qashqadaryo viloyati xalq ta'limi boshqarmasi",
        type: "EDUCATION" as const,
        region: PILOT_HUDUDI,
        district: "Qarshi shahri",
        stir: "203456789",
      },
      {
        name: "Shahrisabz tumani hokimligi",
        type: "KHOKIMIYAT" as const,
        region: PILOT_HUDUDI,
        district: "Shahrisabz tumani",
        stir: "204567890",
      },
    ].map((t) => db.organization.create({ data: t }))
  );

  console.log("Foydalanuvchilar…");
  const xesh = await parolXeshla(SINOV_PAROLI);

  const admin = await db.user.create({
    data: {
      fullName: "Sardor Rahimov",
      position: "Tizim administratori",
      phone: "+998901112233",
      email: "admin@ombor.uz",
      passwordHash: xesh,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const rahbarlar = await Promise.all(
    [
      { ism: "Bekzod Tursunov", lavozim: "Hokim o'rinbosari", tel: "+998901112201" },
      { ism: "Nodira Yusupova", lavozim: "Boshqarma boshlig'i", tel: "+998901112202" },
      { ism: "Jasur Ergashev", lavozim: "Boshqarma boshlig'i", tel: "+998901112203" },
      { ism: "Dilnoza Qodirova", lavozim: "Hokim o'rinbosari", tel: "+998901112204" },
    ].map((r, i) =>
      db.user.create({
        data: {
          fullName: r.ism,
          position: r.lavozim,
          phone: r.tel,
          passwordHash: xesh,
          role: "LEADER",
          status: "ACTIVE",
          organizationId: tashkilotlar[i].id,
        },
      })
    )
  );

  const dasturchilar = await Promise.all(
    [
      {
        ism: "Aziz Karimov",
        tel: "+998901113301",
        skills: ["Next.js", "PostgreSQL", "TypeScript"],
        tasdiqlangan: true,
      },
      {
        ism: "Malika Sobirova",
        tel: "+998901113302",
        skills: ["Laravel", "MySQL", "1C integratsiya"],
        tasdiqlangan: true,
      },
      {
        ism: "Otabek Nazarov",
        tel: "+998901113303",
        skills: ["Flutter", "Node.js"],
        tasdiqlangan: false,
      },
    ].map((d) =>
      db.user.create({
        data: {
          fullName: d.ism,
          position: "Dasturchi",
          phone: d.tel,
          passwordHash: xesh,
          role: "DEVELOPER",
          status: d.tasdiqlangan ? "ACTIVE" : "PENDING",
          developerProfile: {
            create: {
              skills: d.skills,
              about: "Davlat sektori uchun axborot tizimlarini ishlab chiqaman.",
              verifiedAt: d.tasdiqlangan ? new Date() : null,
              verifiedById: d.tasdiqlangan ? admin.id : null,
            },
          },
        },
      })
    )
  );

  console.log("Muammolar…");
  const yaratilganMuammolar: string[] = [];

  for (const [i, m] of MUAMMOLAR.entries()) {
    // Muammolarni tashkilotlar orasida taqsimlaymiz
    const tashkilotIndeksi =
      i < 8 ? 0 : i < 11 ? 1 : i < 14 ? 2 : i % 4;
    const tashkilot = tashkilotlar[tashkilotIndeksi];
    const rahbar = rahbarlar[tashkilotIndeksi];

    const soat = oylikYoqotilganSoat({
      frequency: m.frequency,
      frequencyUnit: m.frequencyUnit,
      minutesPerCase: m.minutesPerCase,
      peopleAffected: m.peopleAffected,
    });

    const toliqlik = toliqlikFoizi({
      title: m.title,
      description: m.description,
      categoryId: turkumlar.get(m.turkum),
      painTypes: m.painTypes,
      currentProcess: m.currentProcess,
      toolsUsed: m.toolsUsed,
      rolesInvolved: m.rolesInvolved,
      attachmentsCount: m.fayllar?.length ?? 0,
      frequency: m.frequency,
      frequencyUnit: m.frequencyUnit,
      minutesPerCase: m.minutesPerCase,
      peopleAffected: m.peopleAffected,
      consequence: m.consequence,
      dataVolume: m.dataVolume,
      usersCount: m.usersCount,
      dataSensitivity: m.dataSensitivity,
      accessFrom: m.accessFrom,
      desiredOutcome: m.desiredOutcome,
      successMetric: m.successMetric,
      contactName: rahbar.fullName,
      contactPhone: rahbar.phone,
    });

    const qollabSoni = QOLLAB_QUVVATLASH[i]?.length ?? 0;

    const muammo = await db.problem.create({
      data: {
        refCode: `M-2026-${String(i + 1).padStart(4, "0")}`,
        organizationId: tashkilot.id,
        authorId: rahbar.id,
        title: m.title,
        description: m.description,
        categoryId: turkumlar.get(m.turkum)!,
        painTypes: m.painTypes,
        currentProcess: m.currentProcess,
        toolsUsed: m.toolsUsed,
        toolsNote: m.toolsNote,
        rolesInvolved: m.rolesInvolved,
        frequency: m.frequency,
        frequencyUnit: m.frequencyUnit,
        minutesPerCase: m.minutesPerCase,
        peopleAffected: m.peopleAffected,
        citizensAffected: m.citizensAffected,
        consequence: m.consequence,
        urgency: m.urgency,
        dataVolume: m.dataVolume,
        usersCount: m.usersCount,
        dataSensitivity: m.dataSensitivity,
        integrations: m.integrations ?? [],
        integrationsNote: m.integrationsNote,
        accessFrom: m.accessFrom,
        previousAttempt: m.previousAttempt ?? false,
        previousAttemptNote: m.previousAttemptNote,
        desiredOutcome: m.desiredOutcome,
        successMetric: m.successMetric,
        contactName: rahbar.fullName,
        contactPosition: rahbar.position,
        contactPhone: rahbar.phone,
        monthlyHoursLost: soat,
        completeness: toliqlik,
        impactScore: tasirBalli({
          monthlyHoursLost: soat,
          peopleAffected: m.peopleAffected,
          citizensAffected: m.citizensAffected,
          urgency: m.urgency,
          supporterCount: qollabSoni,
          completeness: toliqlik,
        }),
        status: m.status,
        submittedAt: m.status === "DRAFT" ? null : new Date(),
        approvedAt: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"].includes(m.status)
          ? new Date()
          : null,
        attachments: m.fayllar?.length
          ? {
              create: m.fayllar.map((nom, j) => ({
                fileName: nom,
                storedName: `seed-${i}-${j}-${nom}`,
                mimeType: nom.endsWith(".pdf")
                  ? "application/pdf"
                  : nom.endsWith(".jpg")
                    ? "image/jpeg"
                    : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 120_000 + j * 45_000,
              })),
            }
          : undefined,
        history: {
          create: [
            {
              fromStatus: "DRAFT",
              toStatus: "SUBMITTED",
              actorId: rahbar.id,
              comment: "Muammo omborga yuborildi",
            },
          ],
        },
      },
    });

    yaratilganMuammolar.push(muammo.id);
  }

  console.log("Qo'llab-quvvatlashlar…");
  for (const [muammoIndeksi, tashkilotIndekslari] of Object.entries(QOLLAB_QUVVATLASH)) {
    const muammoId = yaratilganMuammolar[Number(muammoIndeksi)];
    for (const ti of tashkilotIndekslari) {
      await db.problemSupporter.create({
        data: {
          problemId: muammoId,
          organizationId: tashkilotlar[ti].id,
          userId: rahbarlar[ti].id,
          note: "Bizda ham aynan shu muammo bor.",
        },
      });
    }
  }

  console.log("Dasturchi topshiriqlari…");
  // "TAKEN" holatidagi muammoni birinchi dasturchi olgan
  const olinganIndeks = MUAMMOLAR.findIndex((m) => m.status === "TAKEN");
  if (olinganIndeks >= 0) {
    const muammoId = yaratilganMuammolar[olinganIndeks];
    await db.problemAssignment.create({
      data: {
        problemId: muammoId,
        developerId: dasturchilar[0].id,
        activeKey: muammoId,
        note: "Tarifikatsiya qoidalarini o'rganib chiqyapman.",
      },
    });
    await db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "APPROVED",
        toStatus: "TAKEN",
        actorId: dasturchilar[0].id,
        comment: "Muammoni o'z zimmamga oldim",
      },
    });
  }

  const yechimIndeks = MUAMMOLAR.findIndex((m) => m.status === "SOLUTION_OFFERED");
  if (yechimIndeks >= 0) {
    const muammoId = yaratilganMuammolar[yechimIndeks];
    await db.problemAssignment.create({
      data: {
        problemId: muammoId,
        developerId: dasturchilar[1].id,
        activeKey: muammoId,
      },
    });
    await db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "TAKEN",
        toStatus: "SOLUTION_OFFERED",
        actorId: dasturchilar[1].id,
        comment: "Telefon orqali bog'landim, demo tayyorladim",
      },
    });
  }

  const hisob = {
    turkumlar: TURKUMLAR.length,
    tashkilotlar: tashkilotlar.length,
    foydalanuvchilar: 1 + rahbarlar.length + dasturchilar.length,
    muammolar: yaratilganMuammolar.length,
  };

  console.log("\n✔ Seed tayyor:", hisob);
  console.log("\n  Sinov akkauntlari (parol hammasida bir xil):");
  console.log(`  Parol:      ${SINOV_PAROLI}`);
  console.log(`  Admin:      +998 90 111 22 33`);
  console.log(`  Rahbar:     +998 90 111 22 01  (Qarshi shahar hokimligi)`);
  console.log(`  Dasturchi:  +998 90 111 33 01  (tasdiqlangan)`);
  console.log(`  Dasturchi:  +998 90 111 33 03  (tasdiqlanmagan — kutish ekrani)\n`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
