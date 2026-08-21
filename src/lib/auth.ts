import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { SESSIYA_COOKIE, sessiyaTokeniniOqi } from "@/lib/session";
import { boshSahifa, KIRISH_SAHIFASI, KUTISH_SAHIFASI } from "@/lib/routes";
import type { Role, UserStatus } from "@/generated/prisma/enums";

export { boshSahifa };

export type JoriyFoydalanuvchi = {
  id: string;
  fullName: string;
  position: string | null;
  phone: string;
  role: Role;
  status: UserStatus;
  organizationId: string | null;
  organizationName: string | null;
  /** Profil rasmi yuklanganmi. Yo'lning o'zi kerak emas — rasm
      `/api/rasm/[id]` orqali olinadi, bu yerda faqat bor-yo'qligi. */
  rasmBormi: boolean;
};

/**
 * Joriy foydalanuvchi yoki `null`.
 *
 * Cookie imzosi tekshirilgandan keyin bazadan ham o'qiydi, chunki:
 *   - foydalanuvchi bloklangan yoki o'chirilgan bo'lishi mumkin;
 *   - admin `sessionVersion` ni oshirib barcha sessiyalarni bekor qilgan bo'lishi mumkin;
 *   - dasturchi tasdiqdan o'tgan yoki o'tmagan bo'lishi mumkin.
 *
 * `cache()` bitta so'rov ichida takroriy baza murojaatlarini oldini oladi —
 * layout, sahifa va bir nechta komponent chaqirsa ham baza bir marta o'qiladi.
 */
export const getJoriyFoydalanuvchi = cache(
  async (): Promise<JoriyFoydalanuvchi | null> => {
    const cookieStore = await cookies();
    const sessiya = await sessiyaTokeniniOqi(cookieStore.get(SESSIYA_COOKIE)?.value);
    if (!sessiya) return null;

    const foydalanuvchi = await db.user.findUnique({
      where: { id: sessiya.sub },
      select: {
        id: true,
        fullName: true,
        position: true,
        phone: true,
        role: true,
        status: true,
        sessionVersion: true,
        avatarPath: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    });

    if (!foydalanuvchi) return null;
    // Admin sessiyalarni bekor qilgan bo'lsa, eski cookie ishlamaydi
    if (foydalanuvchi.sessionVersion !== sessiya.ver) return null;
    if (foydalanuvchi.status === "BLOCKED") return null;

    return {
      id: foydalanuvchi.id,
      fullName: foydalanuvchi.fullName,
      position: foydalanuvchi.position,
      phone: foydalanuvchi.phone,
      role: foydalanuvchi.role,
      status: foydalanuvchi.status,
      organizationId: foydalanuvchi.organizationId,
      organizationName: foydalanuvchi.organization?.name ?? null,
      rasmBormi: Boolean(foydalanuvchi.avatarPath),
    };
  }
);

/** Sahifa yoki server action uchun: foydalanuvchi kirgan bo'lishi shart. */
export async function talabKirish(): Promise<JoriyFoydalanuvchi> {
  const f = await getJoriyFoydalanuvchi();
  if (!f) redirect(KIRISH_SAHIFASI);
  return f;
}

/**
 * Ruxsat etilgan rollardan biri bo'lishi shart.
 * Rol mos kelmasa — o'z bosh sahifasiga qaytaradi (xato sahifasi emas,
 * chunki bu odatda noto'g'ri havola, hujum emas).
 */
export async function talabRol(...ruxsatEtilgan: Role[]): Promise<JoriyFoydalanuvchi> {
  const f = await talabKirish();
  if (!ruxsatEtilgan.includes(f.role)) redirect(boshSahifa(f.role));
  return f;
}

/** Rahbar uchun: tashkiloti biriktirilganiga ham ishonch hosil qiladi. */
export async function talabRahbar(): Promise<
  JoriyFoydalanuvchi & { organizationId: string }
> {
  const f = await talabRol("LEADER");
  if (!f.organizationId) {
    throw new Error(
      `Rahbar ${f.id} hech qaysi tashkilotga biriktirilmagan. Buni admin tuzatishi kerak.`
    );
  }
  return f as JoriyFoydalanuvchi & { organizationId: string };
}

/**
 * Omborga kirish uchun: tasdiqlangan dasturchi (yoki nazorat qiluvchi admin).
 *
 * Bu `proxy.ts` dagi tekshiruvni takrorlaydi — ataylab. Proxy faqat cookie'dagi
 * rolni ko'radi va bazani bilmaydi; tasdiqlash holati esa faqat bazada.
 * Admin dasturchini bloklasa yoki tasdiqni bekor qilsa, u shu yerda to'xtatiladi.
 */
export async function talabDasturchi(): Promise<JoriyFoydalanuvchi> {
  const f = await talabRol("DEVELOPER", "ADMIN");
  if (f.role === "DEVELOPER" && f.status !== "ACTIVE") redirect(KUTISH_SAHIFASI);
  return f;
}
