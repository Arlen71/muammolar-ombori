import type { Region } from "@/generated/prisma/enums";

/**
 * Pilot hududi sozlamasi.
 *
 * Tizim bitta viloyatda ishga tushirilmoqda. Shuning uchun interfeysda
 * viloyat tanlanmaydi — u shu yerda qotirilgan, tashkilotlar esa TUMAN
 * bo'yicha ajratiladi. Pilotda odamlar aynan tumanni izlaydi: "Qarshi
 * shahrida qanday muammolar bor?" degan savol mazmunli, "Qashqadaryoda
 * qanday muammolar bor?" degani esa butun bazani qaytaradi.
 *
 * `Region` enum'i sxemada 14 ta viloyat bilan qolyapti — kod boshqa
 * viloyatlarga tayyor. Kengaytirish uchun shu fayldagi ikki qiymatni
 * o'zgartirish yoki hududlar ro'yxatiga aylantirish kifoya; ma'lumotlar
 * bazasiga tegilmaydi.
 */
export const PILOT_HUDUDI: Region = "QASHQADARYO";

/**
 * Qashqadaryo viloyatining ma'muriy birliklari: 2 ta shahar va 14 ta tuman.
 *
 * DIQQAT: ma'muriy bo'linish vaqt o'tishi bilan o'zgaradi (masalan
 * Ko'kdala tumani 2018-yilda tashkil etilgan). Ro'yxatni rasmiy manba
 * bilan solishtirib turing — u faqat shu yerda, bitta joyda.
 *
 * Tartib: shaharlar avval, keyin tumanlar alifbo bo'yicha. Ochiladigan
 * ro'yxatda eng ko'p ishlatiladigan qiymat tepada turgani qulay.
 */
export const TUMANLAR = [
  "Qarshi shahri",
  "Shahrisabz shahri",
  "Chiroqchi tumani",
  "Dehqonobod tumani",
  "G'uzor tumani",
  "Kasbi tumani",
  "Kitob tumani",
  "Ko'kdala tumani",
  "Koson tumani",
  "Mirishkor tumani",
  "Muborak tumani",
  "Nishon tumani",
  "Qamashi tumani",
  "Qarshi tumani",
  "Shahrisabz tumani",
  "Yakkabog' tumani",
] as const;

export type Tuman = (typeof TUMANLAR)[number];

/**
 * Tuman nomi ro'yxatdagi qiymatmi?
 *
 * Bazada `district` oddiy matn bo'lib qolyapti (enum emas): tuman
 * qo'shilganda migratsiya talab qilinmasin va boshqa viloyatga
 * kengaytirish oson bo'lsin. Cheklov shu tekshiruv orqali qo'yiladi.
 */
export function tumanTogrimi(qiymat: unknown): qiymat is Tuman {
  return typeof qiymat === "string" && (TUMANLAR as readonly string[]).includes(qiymat);
}
