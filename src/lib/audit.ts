import "server-only";

import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Audit jurnali — davlat tizimi uchun majburiy.
 * Kim, qachon, nima qilgani yoziladi: kirish, muammo holatini o'zgartirish,
 * foydalanuvchi yaratish, dasturchini tasdiqlash va hokazo.
 */

export async function soragichIp(): Promise<string | null> {
  const h = await headers();
  // Nginx orqasida turganda haqiqiy IP shu sarlavhada bo'ladi
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

export async function auditYoz(yozuv: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: yozuv.actorId ?? null,
        action: yozuv.action,
        entity: yozuv.entity,
        entityId: yozuv.entityId ?? null,
        meta: yozuv.meta,
        ip: await soragichIp(),
      },
    });
  } catch (e) {
    // Audit yozuvi asosiy amalni to'xtatmasligi kerak — faqat log'ga chiqaramiz
    console.error("Audit yozuvida xato:", e);
  }
}
