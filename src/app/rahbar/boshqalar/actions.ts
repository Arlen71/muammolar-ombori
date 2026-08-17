"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { tasirBalli } from "@/lib/scoring";
import type { AmalNatijasi } from "@/lib/validation";

/** Qo'llab-quvvatlovchilar soni o'zgargach ta'sir ballini qayta hisoblaydi. */
async function ballniYangila(muammoId: string) {
  const m = await db.problem.findUnique({
    where: { id: muammoId },
    include: { _count: { select: { supporters: true } } },
  });
  if (!m) return;

  await db.problem.update({
    where: { id: muammoId },
    data: {
      impactScore: tasirBalli({
        monthlyHoursLost: m.monthlyHoursLost,
        peopleAffected: m.peopleAffected,
        citizensAffected: m.citizensAffected,
        urgency: m.urgency,
        supporterCount: m._count.supporters,
        completeness: m.completeness,
      }),
    },
  });
}

/**
 * "Bizda ham shu muammo bor".
 *
 * Platformaning eng qimmatli signali: bitta muammoni 37 ta tashkilot
 * qo'llab-quvvatlasa, dasturchi uchun bu tayyor bozor demakdir.
 */
export async function qollabQuvvatla(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const izoh = String(fd.get("izoh") ?? "").trim();
  const rahbar = await talabRahbar();

  const muammo = await db.problem.findFirst({
    where: {
      id: muammoId,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
    },
    select: { id: true, organizationId: true },
  });
  if (!muammo) return { xato: "Muammo topilmadi." };
  if (muammo.organizationId === rahbar.organizationId) {
    return { xato: "Bu sizning o'z tashkilotingiz muammosi." };
  }

  try {
    await db.problemSupporter.create({
      data: {
        problemId: muammoId,
        organizationId: rahbar.organizationId,
        userId: rahbar.id,
        note: izoh || null,
      },
    });
  } catch (e) {
    // @@unique([problemId, organizationId]) — ikkinchi marta qo'shib bo'lmaydi
    if ((e as { code?: string }).code === "P2002") {
      return { xato: "Siz bu muammoni allaqachon qo'llab-quvvatlagansiz." };
    }
    throw e;
  }

  await ballniYangila(muammoId);
  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.qollab_quvvatlandi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath("/rahbar/boshqalar");
  return { muvaffaqiyat: "Qo'shildingiz. Dasturchilar endi bu muammo sizda ham borligini ko'radi." };
}

export async function qollabQuvvatlashniBekorQil(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const rahbar = await talabRahbar();

  await db.problemSupporter.deleteMany({
    where: { problemId: muammoId, organizationId: rahbar.organizationId },
  });
  await ballniYangila(muammoId);

  revalidatePath("/rahbar/boshqalar");
  return { muvaffaqiyat: "Qo'llab-quvvatlash bekor qilindi." };
}
