/**
 * Muammo kartochkasining raqamli "aqli".
 *
 * Uchta hisob-kitob:
 *   1. monthlyHoursLost — oyiga yo'qotilayotgan soat. Rahbar kiritgan raqamlardan
 *      chiqadi va kartochkada eng ko'zga tashlanadigan ko'rsatkich bo'ladi.
 *   2. completeness    — kartochka to'liqligi (0–100). Rahbarni to'liq to'ldirishga
 *      undaydi, moderatorga esa sifat signalini beradi.
 *   3. impactScore     — ombordagi saralash uchun umumiy ball.
 *
 * Bu modul faqat sof funksiyalardan iborat: baza ham, Next.js ham import qilinmaydi,
 * shuning uchun testlash oson va klient tomonda ham ishlaydi.
 */

import type { FrequencyUnit, Urgency } from "@/generated/prisma/enums";

/** Oyiga necha marta takrorlanishi. Davlat idorasi uchun oyiga ~22 ish kuni. */
const OYIGA_TAKRORLANISH: Record<FrequencyUnit, number> = {
  DAY: 22,
  WEEK: 4.33,
  MONTH: 1,
  YEAR: 1 / 12,
};

const SHOSHILINCHLIK_KOEF: Record<Urgency, number> = {
  LOW: 0.8,
  MEDIUM: 1,
  HIGH: 1.3,
  CRITICAL: 1.6,
};

export type YoqotishKirish = {
  frequency?: number | null;
  frequencyUnit?: FrequencyUnit | null;
  minutesPerCase?: number | null;
  peopleAffected?: number | null;
};

/**
 * Oyiga yo'qotilayotgan soat.
 *
 * Formula:  xodimlar soni × oyiga takrorlanish × bir martalik daqiqa ÷ 60
 *
 * Formadagi savollar shu formulaga aniq mos qilib yozilgan:
 *   - "Bitta xodim buni bir marta bajarishga qancha vaqt sarflaydi?" → minutesPerCase
 *   - "Har bir xodim buni qanchalik tez-tez bajaradi?"               → frequency + unit
 *   - "Necha xodim shu ishni bajaradi?"                               → peopleAffected
 * Shu tarzda ikki xil talqin (bir kishiga yoki hammaga) ehtimoli yo'q qilingan.
 */
export function oylikYoqotilganSoat(k: YoqotishKirish): number {
  const { frequency, frequencyUnit, minutesPerCase, peopleAffected } = k;
  if (!frequency || !frequencyUnit || !minutesPerCase) return 0;

  const xodimlar = peopleAffected && peopleAffected > 0 ? peopleAffected : 1;
  const oyiga = frequency * OYIGA_TAKRORLANISH[frequencyUnit];
  const soat = (xodimlar * oyiga * minutesPerCase) / 60;

  return Math.round(soat * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────
//  To'liqlik
// ─────────────────────────────────────────────────────────────────────

/**
 * Maydonlarning og'irliklari. Yig'indisi = 100.
 *
 * Eng katta og'irlik "hozir bu ish qanday bajariladi" (12) va biriktirilgan
 * fayllarga (10) berilgan: dasturchi uchun aynan shu ikkisi eng qimmatli.
 */
export const TOLIQLIK_OGIRLIGI = {
  title: 4,
  description: 8,
  category: 3,
  painTypes: 3,
  currentProcess: 12,
  toolsUsed: 5,
  rolesInvolved: 4,
  attachments: 10,
  frequency: 6,
  minutesPerCase: 6,
  peopleAffected: 5,
  consequence: 3,
  dataVolume: 4,
  usersCount: 4,
  dataSensitivity: 5,
  accessFrom: 3,
  desiredOutcome: 8,
  successMetric: 4,
  contact: 3,
} as const;

export type ToliqlikMaydoni = keyof typeof TOLIQLIK_OGIRLIGI;

export type ToliqlikKirish = {
  title?: string | null;
  description?: string | null;
  categoryId?: string | null;
  painTypes?: unknown[] | null;
  currentProcess?: string | null;
  toolsUsed?: unknown[] | null;
  rolesInvolved?: unknown[] | null;
  attachmentsCount?: number | null;
  frequency?: number | null;
  frequencyUnit?: FrequencyUnit | null;
  minutesPerCase?: number | null;
  peopleAffected?: number | null;
  consequence?: string | null;
  dataVolume?: string | null;
  usersCount?: string | null;
  dataSensitivity?: string | null;
  accessFrom?: unknown[] | null;
  desiredOutcome?: string | null;
  successMetric?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
};

function matnBor(v: string | null | undefined, minUzunlik = 1): boolean {
  return typeof v === "string" && v.trim().length >= minUzunlik;
}

function royxatBor(v: unknown[] | null | undefined): boolean {
  return Array.isArray(v) && v.length > 0;
}

/** Qaysi maydonlar to'ldirilganini maydon-ma-maydon qaytaradi. */
export function toliqlikHolati(k: ToliqlikKirish): Record<ToliqlikMaydoni, boolean> {
  return {
    title: matnBor(k.title, 10),
    description: matnBor(k.description, 100),
    category: matnBor(k.categoryId),
    painTypes: royxatBor(k.painTypes),
    currentProcess: matnBor(k.currentProcess, 40),
    toolsUsed: royxatBor(k.toolsUsed),
    rolesInvolved: royxatBor(k.rolesInvolved),
    attachments: (k.attachmentsCount ?? 0) > 0,
    frequency: !!k.frequency && !!k.frequencyUnit,
    minutesPerCase: !!k.minutesPerCase,
    peopleAffected: !!k.peopleAffected,
    consequence: matnBor(k.consequence),
    dataVolume: matnBor(k.dataVolume),
    usersCount: matnBor(k.usersCount),
    dataSensitivity: matnBor(k.dataSensitivity),
    accessFrom: royxatBor(k.accessFrom),
    desiredOutcome: matnBor(k.desiredOutcome, 30),
    successMetric: matnBor(k.successMetric, 10),
    contact: matnBor(k.contactName) && matnBor(k.contactPhone),
  };
}

/** Kartochka to'liqligi: 0–100. */
export function toliqlikFoizi(k: ToliqlikKirish): number {
  const holat = toliqlikHolati(k);
  let ball = 0;
  for (const [maydon, ogirlik] of Object.entries(TOLIQLIK_OGIRLIGI)) {
    if (holat[maydon as ToliqlikMaydoni]) ball += ogirlik;
  }
  return Math.round(ball);
}

// ─────────────────────────────────────────────────────────────────────
//  Ta'sir balli
// ─────────────────────────────────────────────────────────────────────

export type TasirKirish = {
  monthlyHoursLost?: number | null;
  peopleAffected?: number | null;
  citizensAffected?: number | null;
  urgency?: Urgency | null;
  supporterCount?: number | null;
  completeness?: number | null;
};

/**
 * Ombordagi standart saralash balli.
 *
 * Logarifm ishlatilgan: bitta ulkan raqam (masalan 1 000 000 fuqaro) butun
 * ro'yxatni egallab olmasligi uchun. Qo'llab-quvvatlovchi tashkilotlar soni esa
 * chiziqli va katta og'irlik bilan qo'shiladi — "37 ta tashkilotda shu muammo bor"
 * dasturchi uchun eng kuchli signal.
 *
 * Oxirgi ko'paytuvchi to'liqlikka bog'liq (0.6–1.0): yaxshi tasvirlangan muammo
 * yuqoriroq turadi, bu rahbarlarni kartochkani to'liq to'ldirishga undaydi.
 */
export function tasirBalli(k: TasirKirish): number {
  const soat = Math.max(0, k.monthlyHoursLost ?? 0);
  const xodim = Math.max(0, k.peopleAffected ?? 0);
  const fuqaro = Math.max(0, k.citizensAffected ?? 0);
  const qollab = Math.max(0, k.supporterCount ?? 0);
  const toliqlik = Math.min(100, Math.max(0, k.completeness ?? 0));

  const asos =
    Math.log1p(soat) * 10 +
    Math.log1p(fuqaro) * 4 +
    Math.log1p(xodim) * 3 +
    qollab * 8;

  const koef = SHOSHILINCHLIK_KOEF[k.urgency ?? "MEDIUM"];
  const sifat = 0.6 + 0.4 * (toliqlik / 100);

  return Math.round(asos * koef * sifat * 100) / 100;
}

/** Soatni odam o'qiy oladigan ko'rinishga keltiradi: "12,5 soat" yoki "3 kun 4 soat". */
export function soatMatni(soat: number): string {
  if (soat <= 0) return "—";
  if (soat < 1) return `${Math.round(soat * 60)} daqiqa`;
  if (soat < 8) return `${soat.toFixed(1).replace(".", ",")} soat`;

  const ishKuni = Math.floor(soat / 8);
  const qoldiq = Math.round(soat % 8);
  if (ishKuni < 1) return `${Math.round(soat)} soat`;
  return qoldiq > 0 ? `${ishKuni} ish kuni ${qoldiq} soat` : `${ishKuni} ish kuni`;
}
