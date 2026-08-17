import { z } from "zod";

/**
 * Telefon raqamini yagona ko'rinishga keltiradi: +998901234567
 *
 * Foydalanuvchilar turlicha yozadi: "90 123 45 67", "+998 90 123-45-67",
 * "998901234567". Login telefon orqali bo'lgani uchun barchasi bitta
 * ko'rinishga keltirilmasa, odam o'z akkauntiga kira olmay qoladi.
 *
 * Noto'g'ri raqamda `null` qaytaradi.
 */
export function telefonNormalla(xom: string): string | null {
  const raqamlar = xom.replace(/\D/g, "");

  // 901234567 → 998901234567
  if (raqamlar.length === 9) return `+998${raqamlar}`;
  // 998901234567
  if (raqamlar.length === 12 && raqamlar.startsWith("998")) return `+${raqamlar}`;
  // 8901234567 (ba'zilar shaharlararo 8 bilan yozadi)
  if (raqamlar.length === 10 && raqamlar.startsWith("8")) return `+998${raqamlar.slice(1)}`;

  return null;
}

/** Zod uchun telefon maydoni: normallashtiradi va tekshiradi. */
export const telefonSxemasi = z
  .string()
  .trim()
  .min(1, "Telefon raqamini kiriting")
  .transform((v, ctx) => {
    const normal = telefonNormalla(v);
    if (!normal) {
      ctx.addIssue({
        code: "custom",
        message: "Telefon raqami noto'g'ri. Namuna: +998 90 123 45 67",
      });
      return z.NEVER;
    }
    return normal;
  });

export const kirishSxemasi = z.object({
  telefon: telefonSxemasi,
  parol: z.string().min(1, "Parolni kiriting"),
});

export const parolSxemasi = z
  .string()
  .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
  .max(200, "Parol juda uzun");

/**
 * Server action'lardan qaytadigan yagona natija shakli.
 * `useActionState` shu shaklni kutadi.
 */
export type AmalNatijasi = {
  xato?: string;
  /** Maydon nomi → xato matni */
  maydonXatolari?: Record<string, string>;
  muvaffaqiyat?: string;
};

/** Zod xatolarini maydon-ma-maydon xabarga aylantiradi. */
export function zodXatolari(xato: z.ZodError): Record<string, string> {
  const natija: Record<string, string> = {};
  for (const muammo of xato.issues) {
    const kalit = muammo.path.join(".") || "_";
    if (!natija[kalit]) natija[kalit] = muammo.message;
  }
  return natija;
}
