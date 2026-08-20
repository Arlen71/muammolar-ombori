/**
 * Barcha enum qiymatlarining o'zbekcha nomlari.
 *
 * Butun interfeys shu yerdan o'qiydi — matnni bir joyda o'zgartirsangiz,
 * u hamma ekranda o'zgaradi. Keyinchalik rus tilini qo'shish kerak bo'lsa,
 * shu fayl tarjima kalitlarining asosi bo'ladi.
 */

import type {
  AccessLocation,
  Consequence,
  DataSensitivity,
  DataVolume,
  FrequencyUnit,
  IntegrationTarget,
  OrgType,
  PainType,
  ProblemStatus,
  Region,
  Role,
  ToolUsed,
  Urgency,
  UsersCount,
  UserStatus,
} from "@/generated/prisma/enums";

export const ROL: Record<Role, string> = {
  ADMIN: "Administrator",
  LEADER: "Tashkilot rahbari",
  DEVELOPER: "Dasturchi",
};

export const FOYDALANUVCHI_HOLATI: Record<UserStatus, string> = {
  ACTIVE: "Faol",
  PENDING: "Tasdiqlanishi kutilmoqda",
  BLOCKED: "Bloklangan",
};

export const TASHKILOT_TURI: Record<OrgType, string> = {
  MINISTRY: "Vazirlik",
  STATE_COMMITTEE: "Davlat qo'mitasi",
  AGENCY: "Agentlik",
  KHOKIMIYAT: "Hokimlik",
  EDUCATION: "Ta'lim muassasasi",
  HEALTHCARE: "Tibbiyot muassasasi",
  STATE_ENTERPRISE: "Davlat korxonasi",
  OTHER: "Boshqa",
};

export const HUDUD: Record<Region, string> = {
  KARAKALPAKSTAN: "Qoraqalpog'iston Respublikasi",
  ANDIJAN: "Andijon viloyati",
  BUKHARA: "Buxoro viloyati",
  FERGANA: "Farg'ona viloyati",
  JIZZAKH: "Jizzax viloyati",
  KHOREZM: "Xorazm viloyati",
  NAMANGAN: "Namangan viloyati",
  NAVOIY: "Navoiy viloyati",
  QASHQADARYO: "Qashqadaryo viloyati",
  SAMARKAND: "Samarqand viloyati",
  SIRDARYO: "Sirdaryo viloyati",
  SURKHANDARYO: "Surxondaryo viloyati",
  TASHKENT_REGION: "Toshkent viloyati",
  TASHKENT_CITY: "Toshkent shahri",
};

export const MUAMMO_HOLATI: Record<ProblemStatus, string> = {
  DRAFT: "Qoralama",
  SUBMITTED: "Ko'rib chiqilmoqda",
  APPROVED: "Omborda",
  REJECTED: "Rad etilgan",
  TAKEN: "Dasturchi oldi",
  SOLUTION_OFFERED: "Yechim taqdim etildi",
  RESOLVED: "Hal qilindi",
  ARCHIVED: "Arxivlangan",
};

/**
 * Holat nishonchasining Tailwind sinflari.
 *
 * Faqat semantik tokenlar ishlatiladi (`globals.css` ga qarang) — shu tufayli
 * qorong'i mavzuga o'tganda bu jadvalga umuman tegilmaydi.
 *
 * Sakkizta holatga sakkizta rang berilmadi: ko'z sakkiz rangni ajrata olmaydi.
 * Ular ma'nosiga qarab guruhlangan — kutilmoqda (sariq), omborda (ko'k),
 * dasturchi ishlamoqda (binafsha), tugadi (yashil), rad etildi (qizil).
 * `TAKEN` va `SOLUTION_OFFERED` bitta oiladan, ikkinchisi to'ldirilgan fon
 * bilan kuchliroq ko'rsatilgan — u zanjirning oxiriga yaqinroq.
 */
export const MUAMMO_HOLATI_RANGI: Record<ProblemStatus, string> = {
  DRAFT: "bg-yuza-2 text-matn-ikkilamchi ring-chegara",
  SUBMITTED: "bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara",
  APPROVED: "bg-malumot-yuza text-malumot ring-malumot-chegara",
  REJECTED: "bg-xato-yuza text-xato ring-xato-chegara",
  TAKEN: "bg-jarayon-yuza text-jarayon ring-jarayon-chegara",
  // To'ldirilgan fon: `text-yuza` — kartochka foni matn rangi sifatida.
  // Ikkala mavzuda ham teskari juftlik hosil bo'ladi, kontrast saqlanadi.
  SOLUTION_OFFERED: "bg-jarayon text-yuza ring-jarayon",
  RESOLVED: "bg-muvaffaqiyat-yuza text-muvaffaqiyat ring-muvaffaqiyat-chegara",
  ARCHIVED: "bg-transparent text-matn-uchinchi ring-chegara",
};

export const MUAMMO_TURI: Record<PainType, string> = {
  MANUAL_REPETITIVE: "Qo'lda takrorlanadigan ish",
  PAPERWORK: "Qog'ozbozlik",
  DATA_LOSS_ERRORS: "Ma'lumot yo'qoladi yoki xato bo'ladi",
  DATA_SCATTERED: "Ma'lumot tarqoq, bir joyda emas",
  DELAYS_WAITING: "Kutish va kechikish",
  NO_CONTROL: "Nazorat qilib bo'lmaydi",
  HARD_REPORTING: "Hisobot tayyorlash og'ir",
  BAD_EXISTING_SOFTWARE: "Mavjud dastur qoniqtirmaydi",
};

export const VOSITA: Record<ToolUsed, string> = {
  PAPER: "Qog'oz, jurnal, daftar",
  EXCEL: "Excel jadvali",
  WORD: "Word hujjati",
  TELEGRAM: "Telegram",
  EMAIL: "Elektron pochta",
  ONE_C: "1C",
  INTERNAL_APP: "Ichki dastur",
  GOV_SYSTEM: "Davlat axborot tizimi",
  NONE: "Hech qanday vosita ishlatilmaydi",
};

export const TAKRORLANISH: Record<FrequencyUnit, string> = {
  DAY: "kuniga",
  WEEK: "haftasiga",
  MONTH: "oyiga",
  YEAR: "yiliga",
};

export const OQIBAT: Record<Consequence, string> = {
  TIME_LOST: "Xodimlarning vaqti behuda ketadi",
  ERRORS_FINES: "Xatolar va jarimalar kelib chiqadi",
  CITIZEN_COMPLAINTS: "Fuqarolar norozi bo'ladi",
  REPORT_DELAYS: "Yuqori tashkilotga hisobot kechikadi",
  LEGAL_NONCOMPLIANCE: "Qonun talabi bajarilmay qoladi",
};

export const SHOSHILINCHLIK: Record<Urgency, string> = {
  LOW: "Past",
  MEDIUM: "O'rta",
  HIGH: "Yuqori",
  CRITICAL: "Juda shoshilinch",
};

/** Shoshilinchlik nishonchasi — sovuqdan issiqqa qarab kuchayadi. */
export const SHOSHILINCHLIK_RANGI: Record<Urgency, string> = {
  LOW: "bg-yuza-2 text-matn-ikkilamchi ring-chegara",
  MEDIUM: "bg-malumot-yuza text-malumot ring-malumot-chegara",
  HIGH: "bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara",
  CRITICAL: "bg-xato-yuza text-xato ring-xato-chegara",
};

export const MALUMOT_HAJMI: Record<DataVolume, string> = {
  UNDER_100: "100 tagacha",
  FROM_100_TO_1000: "100 – 1 000",
  FROM_1000_TO_10000: "1 000 – 10 000",
  OVER_10000: "10 000 dan ko'p",
};

export const FOYDALANUVCHILAR_SONI: Record<UsersCount, string> = {
  FROM_1_TO_5: "1 – 5 kishi",
  FROM_5_TO_20: "5 – 20 kishi",
  FROM_20_TO_100: "20 – 100 kishi",
  OVER_100: "100 dan ortiq kishi",
};

export const MAXFIYLIK: Record<DataSensitivity, string> = {
  PUBLIC: "Ochiq ma'lumot",
  INTERNAL: "Xizmat uchun",
  PERSONAL: "Fuqarolarning shaxsiy ma'lumotlari bor",
  CONFIDENTIAL: "Maxfiy",
};

/** Dasturchiga xavfsizlik talabini tushuntiruvchi izoh. */
export const MAXFIYLIK_IZOHI: Record<DataSensitivity, string> = {
  PUBLIC: "Alohida cheklov talab qilinmaydi.",
  INTERNAL: "Tizimga faqat tashkilot xodimlari kira olishi kerak.",
  PERSONAL:
    "Shaxsiy ma'lumotlar to'g'risidagi qonun talablari amal qiladi: ma'lumot O'zbekiston hududidagi serverda saqlanishi va shifrlanishi shart.",
  CONFIDENTIAL:
    "Maxfiy ma'lumot. Tashqi tarmoqqa chiqarilmaydi, alohida ruxsat va kirish jurnali talab qilinadi.",
};

export const INTEGRATSIYA: Record<IntegrationTarget, string> = {
  ONE_C: "1C",
  E_IJRO: "E-ijro",
  MY_GOV: "my.gov.uz",
  TAX: "Soliq qo'mitasi tizimi",
  BANK: "Bank tizimi",
  SMS: "SMS xabarnoma",
  OTHER: "Boshqa tizim",
};

export const KIRISH_JOYI: Record<AccessLocation, string> = {
  OFFICE_ONLY: "Faqat ofis ichidan",
  INTERNET: "Internet orqali istalgan joydan",
  MOBILE: "Telefondan",
  BRANCHES: "Filial va bo'limlardan",
};

// ─────────────────────────────────────────────────────────────────────
//  Yordamchilar
// ─────────────────────────────────────────────────────────────────────

/** `Record`'ni <select> uchun {value,label} ro'yxatiga aylantiradi. */
export function variantlar<T extends string>(
  manba: Record<T, string>
): { value: T; label: string }[] {
  return (Object.keys(manba) as T[]).map((value) => ({ value, label: manba[value] }));
}

/**
 * Katta sonni o'zbekcha ko'rinishda yozadi: 1 584, 320 000.
 *
 * `toLocaleString("uz-UZ")` ishlatilmaydi: u minglikni vergul bilan ajratadi
 * ("1,584"), o'zbek tilida esa vergul — o'nlik ajratgich. Ya'ni "1,584" ni
 * o'quvchi "bir butun 584" deb tushunadi. Minglik uchun bo'sh joy to'g'ri.
 */
export function sonMatni(son: number | null | undefined): string {
  if (son === null || son === undefined || !Number.isFinite(son)) return "—";
  // Uzilmaydigan bo'sh joy — raqam satr oxirida bo'linib ketmasligi uchun
  return Math.round(son).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Telefon raqamini o'qishga qulay ko'rinishga keltiradi: +998 90 123 45 67 */
export function telefonMatni(raqam: string): string {
  const t = raqam.replace(/\D/g, "");
  if (t.length !== 12 || !t.startsWith("998")) return raqam;
  return `+${t.slice(0, 3)} ${t.slice(3, 5)} ${t.slice(5, 8)} ${t.slice(8, 10)} ${t.slice(10)}`;
}

const OYLAR = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

/** Sanani o'zbekcha ko'rsatadi: 17-avgust, 2026 */
export function sanaMatni(sana: Date | string | null | undefined): string {
  if (!sana) return "—";
  const d = typeof sana === "string" ? new Date(sana) : sana;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()}-${OYLAR[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Sana va vaqt: 17-avgust, 2026, 14:30 */
export function sanaVaqtMatni(sana: Date | string | null | undefined): string {
  if (!sana) return "—";
  const d = typeof sana === "string" ? new Date(sana) : sana;
  if (Number.isNaN(d.getTime())) return "—";
  const soat = String(d.getHours()).padStart(2, "0");
  const daqiqa = String(d.getMinutes()).padStart(2, "0");
  return `${sanaMatni(d)}, ${soat}:${daqiqa}`;
}
