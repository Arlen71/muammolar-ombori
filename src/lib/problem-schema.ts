import { z } from "zod";

import {
  AccessLocation,
  Consequence,
  DataSensitivity,
  DataVolume,
  FrequencyUnit,
  IntegrationTarget,
  PainType,
  ToolUsed,
  Urgency,
  UsersCount,
} from "@/generated/prisma/enums";
import { telefonSxemasi } from "@/lib/validation";

/**
 * Sehrgarning har bir qadami uchun validatsiya.
 *
 * Ikki xil qat'iylik ishlatiladi:
 *   - `qadamSxemalari`   — keyingi qadamga o'tishda, to'liq talab bilan;
 *   - `qoralamaSxemasi`  — avtosaqlashda, hamma narsa ixtiyoriy.
 * Shu tufayli rahbar yarim to'ldirilgan formani ham yo'qotmaydi.
 */

const bosMatnNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

/** Bo'sh matnni null'ga aylantiradigan ixtiyoriy matn maydoni. */
const ixtiyoriyMatn = z.preprocess(bosMatnNull, z.string().trim().nullable().optional());

/** FormData'dan kelgan bo'sh qatorni null qiladigan ixtiyoriy son. */
const ixtiyoriySon = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().int().positive("Musbat son kiriting").nullable().optional()
);

// ─── 1-qadam: Muammo nima? ───────────────────────────────────────────

export const qadam1Sxemasi = z.object({
  title: z
    .string()
    .trim()
    .min(10, "Sarlavha kamida 10 belgidan iborat bo'lsin")
    .max(120, "Sarlavha 120 belgidan oshmasin"),
  description: z
    .string()
    .trim()
    .min(100, "Muammoni batafsilroq yozing — kamida 100 belgi. Dasturchi buni o'qib tushunishi kerak."),
  categoryId: z.string().min(1, "Sohani tanlang"),
  painTypes: z.array(z.enum(PainType)).min(1, "Kamida bitta variantni belgilang"),
});

// ─── 2-qadam: Hozir bu ish qanday bajariladi? ────────────────────────

export const qadam2Sxemasi = z.object({
  currentProcess: z
    .string()
    .trim()
    .min(40, "Jarayonni bosqichma-bosqich yozing — bu dasturchi uchun eng muhim ma'lumot"),
  toolsUsed: z.array(z.enum(ToolUsed)).min(1, "Hozir nimadan foydalanishingizni belgilang"),
  toolsNote: ixtiyoriyMatn,
  rolesInvolved: z
    .array(z.string().trim().min(1))
    .min(1, "Jarayonda qatnashadigan kamida bitta lavozimni kiriting"),
});

// ─── 3-qadam: Ko'lam va yo'qotish ────────────────────────────────────

export const qadam3Sxemasi = z.object({
  frequency: z.coerce.number().int().positive("Musbat son kiriting"),
  frequencyUnit: z.enum(FrequencyUnit),
  minutesPerCase: z.coerce
    .number()
    .int()
    .positive("Musbat son kiriting")
    .max(10_000, "Daqiqa juda katta — soatni daqiqaga aylantirganingizni tekshiring"),
  peopleAffected: z.coerce.number().int().positive("Kamida 1 kishi"),
  citizensAffected: ixtiyoriySon,
  consequence: z.enum(Consequence),
  urgency: z.enum(Urgency),
  deadline: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : new Date(String(v))),
    z.date().nullable().optional()
  ),
  deadlineReason: ixtiyoriyMatn,
});

// ─── 4-qadam: Ma'lumot va cheklovlar ─────────────────────────────────

export const qadam4Sxemasi = z.object({
  dataVolume: z.enum(DataVolume),
  usersCount: z.enum(UsersCount),
  dataSensitivity: z.enum(DataSensitivity),
  integrations: z.array(z.enum(IntegrationTarget)).default([]),
  integrationsNote: ixtiyoriyMatn,
  accessFrom: z.array(z.enum(AccessLocation)).min(1, "Kamida bitta variantni belgilang"),
  previousAttempt: z.coerce.boolean().default(false),
  previousAttemptNote: ixtiyoriyMatn,
});

// ─── 5-qadam: Kutilayotgan natija va aloqa ───────────────────────────

export const qadam5Sxemasi = z.object({
  desiredOutcome: z
    .string()
    .trim()
    .min(30, "Muammo hal bo'lgach ish qanday ketishini tasvirlab bering"),
  successMetric: z
    .string()
    .trim()
    .min(10, "O'lchanadigan natija yozing. Namuna: «ariza 1 soatda tasdiqlanadi»"),
  contactName: z.string().trim().min(3, "Mas'ul shaxsning ism-familiyasini kiriting"),
  contactPosition: ixtiyoriyMatn,
  contactPhone: telefonSxemasi,
});

export const QADAMLAR = [1, 2, 3, 4, 5] as const;
export type QadamRaqami = (typeof QADAMLAR)[number];

export const qadamSxemalari = {
  1: qadam1Sxemasi,
  2: qadam2Sxemasi,
  3: qadam3Sxemasi,
  4: qadam4Sxemasi,
  5: qadam5Sxemasi,
} as const;

export const QADAM_NOMLARI: Record<QadamRaqami, { qisqa: string; toliq: string }> = {
  1: { qisqa: "Muammo", toliq: "Muammo nima?" },
  2: { qisqa: "Hozirgi jarayon", toliq: "Hozir bu ish qanday bajariladi?" },
  3: { qisqa: "Ko'lam", toliq: "Ko'lam va yo'qotish" },
  4: { qisqa: "Cheklovlar", toliq: "Ma'lumot va cheklovlar" },
  5: { qisqa: "Natija", toliq: "Kutilayotgan natija va aloqa" },
};

/** Avtosaqlash uchun: barcha maydonlar ixtiyoriy, hech qanday talab yo'q. */
export const qoralamaSxemasi = z
  .object({
    title: z.string().trim().max(120).optional(),
    description: z.string().trim().optional(),
    categoryId: z.string().optional(),
    painTypes: z.array(z.enum(PainType)).optional(),

    currentProcess: z.string().trim().optional(),
    toolsUsed: z.array(z.enum(ToolUsed)).optional(),
    toolsNote: ixtiyoriyMatn,
    rolesInvolved: z.array(z.string().trim()).optional(),

    frequency: ixtiyoriySon,
    frequencyUnit: z.enum(FrequencyUnit).nullable().optional(),
    minutesPerCase: ixtiyoriySon,
    peopleAffected: ixtiyoriySon,
    citizensAffected: ixtiyoriySon,
    consequence: z.enum(Consequence).nullable().optional(),
    urgency: z.enum(Urgency).optional(),
    deadline: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? null : new Date(String(v))),
        z.date().nullable().optional()
      ),
    deadlineReason: ixtiyoriyMatn,

    dataVolume: z.enum(DataVolume).nullable().optional(),
    usersCount: z.enum(UsersCount).nullable().optional(),
    dataSensitivity: z.enum(DataSensitivity).nullable().optional(),
    integrations: z.array(z.enum(IntegrationTarget)).optional(),
    integrationsNote: ixtiyoriyMatn,
    accessFrom: z.array(z.enum(AccessLocation)).optional(),
    previousAttempt: z.coerce.boolean().optional(),
    previousAttemptNote: ixtiyoriyMatn,

    desiredOutcome: z.string().trim().optional(),
    successMetric: z.string().trim().optional(),
    contactName: z.string().trim().optional(),
    contactPosition: ixtiyoriyMatn,
    contactPhone: z.string().trim().optional(),
  })
  .partial();

export type QoralamaMalumoti = z.infer<typeof qoralamaSxemasi>;
