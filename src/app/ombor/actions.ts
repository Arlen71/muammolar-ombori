"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { talabDasturchi } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import type { AmalNatijasi } from "@/lib/validation";

/**
 * Dasturchi muammoni o'z zimmasiga oladi.
 *
 * Bazadagi `activeKey @unique` tufayli ikki dasturchi bir vaqtda bitta muammoni
 * ololmaydi: ikkinchisining yozuvi unique cheklovga urilib xato beradi.
 * Shu sababli tekshiruvni tranzaksiyada qo'lda qulflashning hojati yo'q.
 */
export async function muammoniOl(_oldingi: AmalNatijasi, fd: FormData): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const dasturchi = await talabDasturchi();
  if (dasturchi.role !== "DEVELOPER") {
    return { xato: "Muammoni faqat dasturchi olishi mumkin." };
  }

  const muammo = await db.problem.findUnique({
    where: { id: muammoId },
    select: { id: true, status: true },
  });
  if (!muammo) return { xato: "Muammo topilmadi." };
  if (muammo.status !== "APPROVED") {
    return { xato: "Bu muammoni allaqachon boshqa dasturchi olgan yoki u omborda emas." };
  }

  try {
    await db.$transaction([
      db.problemAssignment.create({
        data: { problemId: muammoId, developerId: dasturchi.id, activeKey: muammoId },
      }),
      db.problem.update({ where: { id: muammoId }, data: { status: "TAKEN" } }),
      db.problemStatusHistory.create({
        data: {
          problemId: muammoId,
          fromStatus: "APPROVED",
          toStatus: "TAKEN",
          actorId: dasturchi.id,
          comment: "Dasturchi muammoni o'z zimmasiga oldi",
        },
      }),
    ]);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { xato: "Bu muammoni hozirgina boshqa dasturchi oldi." };
    }
    throw e;
  }

  await auditYoz({
    actorId: dasturchi.id,
    action: "muammo.olindi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath(`/ombor/${muammoId}`);
  revalidatePath("/ombor");
  return { muvaffaqiyat: "Muammo sizga biriktirildi. Aloqa ma'lumotlari ochildi." };
}

/** Dasturchi muammoni qo'yib yuboradi — u omborga qaytadi. */
export async function muammoniQoyibYubor(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const sabab = String(fd.get("sabab") ?? "").trim();
  const dasturchi = await talabDasturchi();

  const topshiriq = await db.problemAssignment.findFirst({
    where: { problemId: muammoId, developerId: dasturchi.id, releasedAt: null },
  });
  if (!topshiriq) return { xato: "Bu muammo sizga biriktirilmagan." };

  await db.$transaction([
    db.problemAssignment.update({
      where: { id: topshiriq.id },
      // activeKey null bo'lishi bilan boshqa dasturchi bu muammoni ola oladi
      data: { releasedAt: new Date(), activeKey: null, note: sabab || null },
    }),
    db.problem.update({ where: { id: muammoId }, data: { status: "APPROVED" } }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "TAKEN",
        toStatus: "APPROVED",
        actorId: dasturchi.id,
        comment: sabab ? `Qo'yib yuborildi: ${sabab}` : "Dasturchi muammoni qo'yib yubordi",
      },
    }),
  ]);

  await auditYoz({
    actorId: dasturchi.id,
    action: "muammo.qoyib_yuborildi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath(`/ombor/${muammoId}`);
  revalidatePath("/ombor");
  return { muvaffaqiyat: "Muammo omborga qaytarildi." };
}

/** Telefon suhbatidan keyin: yechim taqdim etildi. */
export async function yechimTaqdimEtildi(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const izoh = String(fd.get("izoh") ?? "").trim();
  if (izoh.length < 10) {
    return { xato: "Qisqacha yozing: nima taklif qildingiz va kim bilan gaplashdingiz." };
  }

  const dasturchi = await talabDasturchi();
  const topshiriq = await db.problemAssignment.findFirst({
    where: { problemId: muammoId, developerId: dasturchi.id, releasedAt: null },
  });
  if (!topshiriq) return { xato: "Bu muammo sizga biriktirilmagan." };

  await db.$transaction([
    db.problem.update({ where: { id: muammoId }, data: { status: "SOLUTION_OFFERED" } }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "TAKEN",
        toStatus: "SOLUTION_OFFERED",
        actorId: dasturchi.id,
        comment: izoh,
      },
    }),
  ]);

  await auditYoz({
    actorId: dasturchi.id,
    action: "muammo.yechim_taqdim_etildi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath(`/ombor/${muammoId}`);
  return {
    muvaffaqiyat:
      "Yozib qo'yildi. Endi tashkilot rahbari yechimni qabul qilib, muammoni yopishi kerak.",
  };
}
