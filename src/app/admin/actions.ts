"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { talabRol } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { boshlangichParolYarat, parolXeshla } from "@/lib/password";
import { tasirBalli } from "@/lib/scoring";
import { telefonSxemasi, zodXatolari, type AmalNatijasi } from "@/lib/validation";
import { OrgType, Region, Role } from "@/generated/prisma/enums";

// ─────────────────────────────────────────────────────────────────────
//  Muammolarni moderatsiya qilish
// ─────────────────────────────────────────────────────────────────────

export async function muammoniTasdiqla(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const admin = await talabRol("ADMIN");

  const muammo = await db.problem.findUnique({
    where: { id: muammoId },
    select: { status: true },
  });
  if (!muammo) return { xato: "Muammo topilmadi." };
  if (muammo.status !== "SUBMITTED") return { xato: "Bu muammo moderatsiya navbatida emas." };

  await db.$transaction([
    db.problem.update({
      where: { id: muammoId },
      data: { status: "APPROVED", approvedAt: new Date(), moderationNote: null },
    }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "SUBMITTED",
        toStatus: "APPROVED",
        actorId: admin.id,
        comment: "Moderatsiyadan o'tdi, omborga qo'shildi",
      },
    }),
  ]);

  await auditYoz({
    actorId: admin.id,
    action: "muammo.tasdiqlandi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath("/admin/moderatsiya");
  revalidatePath("/ombor");
  return { muvaffaqiyat: "Muammo omborga qo'shildi." };
}

export async function muammoniRadEt(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const sabab = String(fd.get("sabab") ?? "").trim();
  if (sabab.length < 15) {
    return {
      xato: "Rad etish sababini aniq yozing — rahbar nimani tuzatishi kerakligini bilishi shart.",
    };
  }

  const admin = await talabRol("ADMIN");
  const muammo = await db.problem.findUnique({
    where: { id: muammoId },
    select: { status: true },
  });
  if (!muammo || muammo.status !== "SUBMITTED") {
    return { xato: "Bu muammo moderatsiya navbatida emas." };
  }

  await db.$transaction([
    db.problem.update({
      where: { id: muammoId },
      data: { status: "REJECTED", moderationNote: sabab },
    }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "SUBMITTED",
        toStatus: "REJECTED",
        actorId: admin.id,
        comment: sabab,
      },
    }),
  ]);

  await auditYoz({
    actorId: admin.id,
    action: "muammo.rad_etildi",
    entity: "Problem",
    entityId: muammoId,
    meta: { sabab },
  });

  revalidatePath("/admin/moderatsiya");
  return { muvaffaqiyat: "Muammo rahbarga qaytarildi." };
}

// ─────────────────────────────────────────────────────────────────────
//  Dublikatlarni birlashtirish
// ─────────────────────────────────────────────────────────────────────

/**
 * Ikkita muammoni birlashtiradi: `muammoId` asosiy (`asosiyId`) ning takroriga
 * aylanadi, uning tashkiloti esa asosiy muammoning qo'llab-quvvatlovchisi bo'ladi.
 * Shu tarzda talab hajmi bitta joyda to'planadi.
 */
export async function dublikatniBirlashtir(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const asosiyId = String(fd.get("asosiyId") ?? "");
  if (!muammoId || !asosiyId) return { xato: "Ikkala muammoni ham tanlang." };
  if (muammoId === asosiyId) return { xato: "Muammoni o'ziga birlashtirib bo'lmaydi." };

  const admin = await talabRol("ADMIN");

  const [takror, asosiy] = await Promise.all([
    db.problem.findUnique({
      where: { id: muammoId },
      select: { id: true, organizationId: true, authorId: true, canonicalId: true },
    }),
    db.problem.findUnique({
      where: { id: asosiyId },
      select: { id: true, canonicalId: true },
    }),
  ]);
  if (!takror || !asosiy) return { xato: "Muammo topilmadi." };
  if (asosiy.canonicalId) {
    return { xato: "Asosiy muammo o'zi boshqasining takrori. Avval uni ajrating." };
  }
  if (takror.canonicalId) return { xato: "Bu muammo allaqachon birlashtirilgan." };

  await db.$transaction(async (tx) => {
    await tx.problem.update({
      where: { id: muammoId },
      data: { status: "ARCHIVED", canonicalId: asosiyId },
    });

    // Takror muammoning tashkiloti asosiy muammoni qo'llab-quvvatlaydi
    const bormi = await tx.problemSupporter.findUnique({
      where: {
        problemId_organizationId: {
          problemId: asosiyId,
          organizationId: takror.organizationId,
        },
      },
    });
    if (!bormi) {
      await tx.problemSupporter.create({
        data: {
          problemId: asosiyId,
          organizationId: takror.organizationId,
          userId: takror.authorId,
          note: "Administrator takroriy muammoni birlashtirdi",
        },
      });
    }

    await tx.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        toStatus: "ARCHIVED",
        actorId: admin.id,
        comment: "Takroriy muammo sifatida birlashtirildi",
      },
    });
  });

  // Asosiy muammoning balli qo'llab-quvvatlovchilar soniga qarab oshadi
  const yangilangan = await db.problem.findUnique({
    where: { id: asosiyId },
    include: { _count: { select: { supporters: true } } },
  });
  if (yangilangan) {
    await db.problem.update({
      where: { id: asosiyId },
      data: {
        impactScore: tasirBalli({
          monthlyHoursLost: yangilangan.monthlyHoursLost,
          peopleAffected: yangilangan.peopleAffected,
          citizensAffected: yangilangan.citizensAffected,
          urgency: yangilangan.urgency,
          supporterCount: yangilangan._count.supporters,
          completeness: yangilangan.completeness,
        }),
      },
    });
  }

  await auditYoz({
    actorId: admin.id,
    action: "muammo.birlashtirildi",
    entity: "Problem",
    entityId: muammoId,
    meta: { asosiyId },
  });

  revalidatePath("/admin/dublikatlar");
  revalidatePath("/ombor");
  return { muvaffaqiyat: "Muammolar birlashtirildi." };
}

// ─────────────────────────────────────────────────────────────────────
//  Dasturchilarni tasdiqlash
// ─────────────────────────────────────────────────────────────────────

export async function dasturchiniTasdiqla(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const userId = String(fd.get("userId") ?? "");
  const admin = await talabRol("ADMIN");

  const dasturchi = await db.user.findFirst({
    where: { id: userId, role: "DEVELOPER" },
    select: { id: true },
  });
  if (!dasturchi) return { xato: "Dasturchi topilmadi." };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } }),
    db.developerProfile.updateMany({
      where: { userId },
      data: { verifiedAt: new Date(), verifiedById: admin.id, rejectedNote: null },
    }),
  ]);

  await auditYoz({
    actorId: admin.id,
    action: "dasturchi.tasdiqlandi",
    entity: "User",
    entityId: userId,
  });

  revalidatePath("/admin/dasturchilar");
  return { muvaffaqiyat: "Dasturchi tasdiqlandi — endi u omborni ko'radi." };
}

export async function dasturchiniBlokla(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const userId = String(fd.get("userId") ?? "");
  const sabab = String(fd.get("sabab") ?? "").trim();
  const admin = await talabRol("ADMIN");
  if (userId === admin.id) return { xato: "O'zingizni bloklay olmaysiz." };

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      // sessionVersion oshsa, foydalanuvchining barcha ochiq sessiyalari darhol uziladi
      data: { status: "BLOCKED", sessionVersion: { increment: 1 } },
    }),
    db.developerProfile.updateMany({
      where: { userId },
      data: { rejectedNote: sabab || null },
    }),
  ]);

  await auditYoz({
    actorId: admin.id,
    action: "foydalanuvchi.bloklandi",
    entity: "User",
    entityId: userId,
    meta: { sabab },
  });

  revalidatePath("/admin/dasturchilar");
  revalidatePath("/admin/foydalanuvchilar");
  return { muvaffaqiyat: "Foydalanuvchi bloklandi va sessiyalari uzildi." };
}

// ─────────────────────────────────────────────────────────────────────
//  Tashkilot va foydalanuvchi yaratish
// ─────────────────────────────────────────────────────────────────────

const tashkilotSxemasi = z.object({
  name: z.string().trim().min(5, "Tashkilot nomini to'liq yozing"),
  type: z.enum(OrgType),
  region: z.enum(Region),
  district: z.string().trim().optional(),
  stir: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "STIR 9 ta raqamdan iborat bo'lishi kerak")
    .optional()
    .or(z.literal("")),
});

export async function tashkilotYarat(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const admin = await talabRol("ADMIN");

  const natija = tashkilotSxemasi.safeParse({
    name: fd.get("name"),
    type: fd.get("type"),
    region: fd.get("region"),
    district: fd.get("district"),
    stir: fd.get("stir"),
  });
  if (!natija.success) return { maydonXatolari: zodXatolari(natija.error) };

  const { stir, district, ...qolgan } = natija.data;
  try {
    const tashkilot = await db.organization.create({
      data: { ...qolgan, district: district || null, stir: stir || null },
    });
    await auditYoz({
      actorId: admin.id,
      action: "tashkilot.yaratildi",
      entity: "Organization",
      entityId: tashkilot.id,
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { xato: "Bu STIR bilan tashkilot allaqachon mavjud." };
    }
    throw e;
  }

  revalidatePath("/admin/tashkilotlar");
  return { muvaffaqiyat: "Tashkilot qo'shildi." };
}

const foydalanuvchiSxemasi = z.object({
  fullName: z.string().trim().min(5, "Ism-familiyani to'liq yozing"),
  position: z.string().trim().optional(),
  phone: telefonSxemasi,
  role: z.enum(Role),
  organizationId: z.string().trim().optional(),
});

/**
 * Yangi akkaunt yaratadi va boshlang'ich parolni **bir marta** qaytaradi.
 * Parol xesh holida saqlanadi, shuning uchun uni keyin ko'rib bo'lmaydi —
 * admin uni darhol foydalanuvchiga yetkazishi kerak.
 */
export async function foydalanuvchiYarat(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const admin = await talabRol("ADMIN");

  const natija = foydalanuvchiSxemasi.safeParse({
    fullName: fd.get("fullName"),
    position: fd.get("position"),
    phone: fd.get("phone"),
    role: fd.get("role"),
    organizationId: fd.get("organizationId"),
  });
  if (!natija.success) return { maydonXatolari: zodXatolari(natija.error) };

  const { fullName, position, phone, role, organizationId } = natija.data;
  if (role === "LEADER" && !organizationId) {
    return { maydonXatolari: { organizationId: "Rahbar uchun tashkilot tanlanishi shart" } };
  }

  const parol = boshlangichParolYarat();
  try {
    const foydalanuvchi = await db.user.create({
      data: {
        fullName,
        position: position || null,
        phone,
        role,
        passwordHash: await parolXeshla(parol),
        // Dasturchi alohida tasdiqlanadi; qolganlar darhol faol
        status: role === "DEVELOPER" ? "PENDING" : "ACTIVE",
        organizationId: role === "LEADER" ? organizationId : null,
        ...(role === "DEVELOPER" ? { developerProfile: { create: { skills: [] } } } : {}),
      },
    });

    await auditYoz({
      actorId: admin.id,
      action: "foydalanuvchi.yaratildi",
      entity: "User",
      entityId: foydalanuvchi.id,
      meta: { role },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { xato: "Bu telefon raqami bilan foydalanuvchi allaqachon mavjud." };
    }
    throw e;
  }

  revalidatePath("/admin/foydalanuvchilar");
  return {
    muvaffaqiyat:
      `Akkaunt yaratildi. Login: ${phone} · Boshlang'ich parol: ${parol} — ` +
      `bu parol boshqa ko'rsatilmaydi, uni hozir foydalanuvchiga yetkazing.`,
  };
}

export async function parolniTiklash(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const userId = String(fd.get("userId") ?? "");
  const admin = await talabRol("ADMIN");

  const foydalanuvchi = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  if (!foydalanuvchi) return { xato: "Foydalanuvchi topilmadi." };

  const parol = boshlangichParolYarat();
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash: await parolXeshla(parol),
      // Eski sessiyalar bekor qilinadi
      sessionVersion: { increment: 1 },
    },
  });

  await auditYoz({
    actorId: admin.id,
    action: "foydalanuvchi.parol_tiklandi",
    entity: "User",
    entityId: userId,
  });

  revalidatePath("/admin/foydalanuvchilar");
  return {
    muvaffaqiyat: `Yangi parol: ${parol} — uni hozir ${foydalanuvchi.phone} egasiga yetkazing.`,
  };
}
