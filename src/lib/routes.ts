import type { Role } from "@/generated/prisma/enums";

/**
 * Marshrutlar va rol ruxsatlari.
 *
 * Alohida fayl, chunki buni ikki joy ishlatadi:
 *   - `src/proxy.ts` — bazaga murojaat qila olmaydi, faqat cookie'ni tekshiradi;
 *   - `src/lib/auth.ts` — bazadan to'liq tekshiruv qiladi.
 */

export const KIRISH_SAHIFASI = "/kirish";
export const KUTISH_SAHIFASI = "/kutilmoqda";

/** Login talab qilinmaydigan sahifalar. */
export const OCHIQ_YOLLAR = ["/", KIRISH_SAHIFASI] as const;

/** Har bir bo'limga qaysi rollar kira oladi. */
export const BOLIM_RUXSATI: { prefiks: string; rollar: Role[] }[] = [
  { prefiks: "/admin", rollar: ["ADMIN"] },
  { prefiks: "/rahbar", rollar: ["LEADER"] },
  // Admin omborni nazorat uchun ko'ra oladi
  { prefiks: "/ombor", rollar: ["DEVELOPER", "ADMIN"] },
  // Profil har uch rolda ochiladi — har kim faqat o'zinikini ko'radi
  { prefiks: "/profil", rollar: ["ADMIN", "LEADER", "DEVELOPER"] },
];

/** Rolga qarab bosh sahifa manzili. */
export function boshSahifa(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "LEADER":
      return "/rahbar";
    case "DEVELOPER":
      return "/ombor";
  }
}

/** Yo'l ochiq (login talab qilmaydigan) bo'lsa `true`. */
export function ochiqYolmi(yol: string): boolean {
  return (OCHIQ_YOLLAR as readonly string[]).includes(yol);
}

/** Yo'lga mos bo'lim qoidasini topadi. Qoida topilmasa — himoyalanmagan yo'l. */
export function bolimQoidasi(yol: string) {
  return BOLIM_RUXSATI.find(
    (b) => yol === b.prefiks || yol.startsWith(`${b.prefiks}/`)
  );
}
