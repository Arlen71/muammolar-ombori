import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/enums";

/**
 * Sessiya — imzolangan JWT cookie ichida.
 *
 * Nega tayyor kutubxona (next-auth) emas: bizda OAuth yo'q, akkauntlarni admin
 * yaratadi. Butun kerakli mantiq shu faylda — davlat tizimi uchun auditi oson va
 * tashqi bog'liqlik kam.
 *
 * Sessiyani bekor qilish: `User.sessionVersion` ni oshirish kifoya —
 * shu foydalanuvchining barcha eski cookie'lari darhol yaroqsiz bo'ladi.
 */

export const SESSIYA_COOKIE = "takliflar_sessiya";

export type SessiyaMalumoti = {
  /** Foydalanuvchi id'si */
  sub: string;
  role: Role;
  /** User.sessionVersion — bekor qilish uchun */
  ver: number;
  /** Tashkilot id'si (rahbarlar uchun) */
  org?: string | null;
};

function maxfiyKalit(): Uint8Array {
  const kalit = process.env.SESSION_SECRET;
  if (!kalit || kalit.length < 32) {
    throw new Error(
      "SESSION_SECRET o'rnatilmagan yoki 32 belgidan qisqa. .env faylini tekshiring."
    );
  }
  return new TextEncoder().encode(kalit);
}

function amalQilishMuddatiSoat(): number {
  const soat = Number(process.env.SESSION_TTL_HOURS ?? 12);
  return Number.isFinite(soat) && soat > 0 ? soat : 12;
}

export async function sessiyaTokeniYarat(m: SessiyaMalumoti): Promise<string> {
  const hozir = Math.floor(Date.now() / 1000);
  const muddat = hozir + amalQilishMuddatiSoat() * 3600;

  return new SignJWT({ role: m.role, ver: m.ver, org: m.org ?? null })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(m.sub)
    .setIssuedAt(hozir)
    .setExpirationTime(muddat)
    .sign(maxfiyKalit());
}

/**
 * Tokenni tekshiradi. Imzo noto'g'ri, muddati o'tgan yoki buzilgan bo'lsa `null`.
 * DIQQAT: bu faqat imzoni tekshiradi. Foydalanuvchi hali ham bloklangan yoki
 * o'chirilgan bo'lishi mumkin — buni `getJoriyFoydalanuvchi()` bazadan tekshiradi.
 */
export async function sessiyaTokeniniOqi(
  token: string | undefined | null
): Promise<SessiyaMalumoti | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, maxfiyKalit(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    if (typeof payload.role !== "string") return null;
    if (typeof payload.ver !== "number") return null;

    return {
      sub: payload.sub,
      role: payload.role as Role,
      ver: payload.ver,
      org: typeof payload.org === "string" ? payload.org : null,
    };
  } catch {
    return null;
  }
}

/** Cookie sozlamalari — bir joyda, chunki o'rnatish va o'chirish mos bo'lishi shart. */
export function cookieSozlamalari() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: amalQilishMuddatiSoat() * 3600,
  };
}
