"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { faylniOchir as diskdanOchir } from "@/lib/uploads";
import { oylikYoqotilganSoat, tasirBalli, toliqlikFoizi } from "@/lib/scoring";
import {
  QADAM_NOMLARI,
  qadamSxemalari,
  qoralamaSxemasi,
  type QadamRaqami,
} from "@/lib/problem-schema";
import { qadamMalumoti } from "@/lib/problem-form";
import { muammoMatni } from "@/lib/vektor";
import {
  muammoVektoriniYangila,
  oxshashMuammolar,
  type OxshashMuammo,
} from "@/lib/similar";
import { zodXatolari, type AmalNatijasi } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

/** Rahbar faqat qoralama va rad etilgan muammoni tahrirlashi mumkin. */
const TAHRIRLANADIGAN = ["DRAFT", "REJECTED"] as const;

/**
 * Muammoni yuklaydi va rahbarning unga huquqi borligini tekshiradi.
 * Boshqa tashkilot muammosi so'ralsa — topilmadi deb javob beramiz
 * (mavjudligini ham oshkor qilmaymiz).
 */
async function rahbarMuammosi(muammoId: string) {
  const rahbar = await talabRahbar();
  const muammo = await db.problem.findFirst({
    where: { id: muammoId, organizationId: rahbar.organizationId },
    include: { _count: { select: { attachments: true, supporters: true } } },
  });
  if (!muammo) throw new Error("Muammo topilmadi yoki sizda unga ruxsat yo'q.");
  return { rahbar, muammo };
}

/** Har qanday saqlashdan keyin hisob-kitoblarni qayta hisoblaydi. */
async function hisoblarniYangila(muammoId: string) {
  const m = await db.problem.findUnique({
    where: { id: muammoId },
    include: { _count: { select: { attachments: true, supporters: true } } },
  });
  if (!m) return;

  const soat = oylikYoqotilganSoat(m);
  const toliqlik = toliqlikFoizi({
    ...m,
    attachmentsCount: m._count.attachments,
  });

  await db.problem.update({
    where: { id: muammoId },
    data: {
      monthlyHoursLost: soat,
      completeness: toliqlik,
      impactScore: tasirBalli({
        monthlyHoursLost: soat,
        peopleAffected: m.peopleAffected,
        citizensAffected: m.citizensAffected,
        urgency: m.urgency,
        supporterCount: m._count.supporters,
        completeness: toliqlik,
      }),
    },
  });
}

/** `M-2026-0007` ko'rinishidagi raqam. Poyga holatida qayta uriniladi. */
async function keyingiRefCode(): Promise<string> {
  const yil = new Date().getFullYear();
  const oxirgi = await db.problem.findFirst({
    where: { refCode: { startsWith: `M-${yil}-` } },
    orderBy: { refCode: "desc" },
    select: { refCode: true },
  });
  const oxirgiRaqam = oxirgi ? Number(oxirgi.refCode.split("-")[2]) : 0;
  return `M-${yil}-${String(oxirgiRaqam + 1).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────
//  Yaratish
// ─────────────────────────────────────────────────────────────────────

export async function yangiMuammoYarat() {
  const rahbar = await talabRahbar();

  const birinchiTurkum = await db.category.findFirst({ orderBy: { order: "asc" } });
  if (!birinchiTurkum) throw new Error("Turkumlar yaratilmagan. Administratorga murojaat qiling.");

  let muammo;
  // Bir vaqtda ikki rahbar yaratsa refCode to'qnashishi mumkin — qayta uriniladi
  for (let urinish = 0; urinish < 5; urinish++) {
    try {
      muammo = await db.problem.create({
        data: {
          refCode: await keyingiRefCode(),
          organizationId: rahbar.organizationId,
          authorId: rahbar.id,
          title: "",
          description: "",
          categoryId: birinchiTurkum.id,
          status: "DRAFT",
          // Aloqa maydonlarini rahbarning o'z ma'lumoti bilan oldindan to'ldiramiz
          contactName: rahbar.fullName,
          contactPosition: rahbar.position,
          contactPhone: rahbar.phone,
        },
      });
      break;
    } catch (e) {
      const kod = (e as { code?: string }).code;
      if (kod !== "P2002" || urinish === 4) throw e;
    }
  }
  if (!muammo) throw new Error("Muammo yaratilmadi. Qaytadan urinib ko'ring.");

  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.yaratildi",
    entity: "Problem",
    entityId: muammo.id,
  });

  redirect(`/rahbar/muammo/${muammo.id}/1`);
}

// ─────────────────────────────────────────────────────────────────────
//  Saqlash
// ─────────────────────────────────────────────────────────────────────

/**
 * Qadamni to'liq tekshirib saqlaydi va keyingi qadamga o'tadi.
 * "Keyingi" tugmasi shu amalni chaqiradi.
 */
export async function qadamniSaqla(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const qadam = Number(fd.get("qadam")) as QadamRaqami;
  if (!muammoId || !qadamSxemalari[qadam]) return { xato: "Noto'g'ri so'rov." };

  const { rahbar, muammo } = await rahbarMuammosi(muammoId);
  if (!TAHRIRLANADIGAN.includes(muammo.status as (typeof TAHRIRLANADIGAN)[number])) {
    return { xato: "Bu muammo allaqachon yuborilgan, uni tahrirlab bo'lmaydi." };
  }

  const natija = qadamSxemalari[qadam].safeParse(qadamMalumoti(qadam, fd));
  if (!natija.success) {
    return {
      maydonXatolari: zodXatolari(natija.error),
      xato: `${QADAM_NOMLARI[qadam].toliq} — to'ldirilmagan maydonlar bor.`,
    };
  }

  await db.problem.update({
    where: { id: muammoId },
    data: natija.data as Prisma.ProblemUpdateInput,
  });
  await hisoblarniYangila(muammoId);

  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.qadam_saqlandi",
    entity: "Problem",
    entityId: muammoId,
    meta: { qadam },
  });

  revalidatePath(`/rahbar/muammo/${muammoId}`, "layout");

  const keyingi = fd.get("keyingiYol");
  redirect(
    typeof keyingi === "string" && keyingi.startsWith("/rahbar/")
      ? keyingi
      : qadam < 5
        ? `/rahbar/muammo/${muammoId}/${qadam + 1}`
        : `/rahbar/muammo/${muammoId}/korish`
  );
}

/**
 * Avtosaqlash: hech narsani talab qilmaydi, faqat kelgan maydonlarni yozadi.
 * Rahbar formani yarim to'ldirib sahifani yopsa ham ma'lumot yo'qolmaydi.
 */
export async function avtoSaqla(
  muammoId: string,
  malumot: unknown
): Promise<{ saqlandi: boolean; toliqlik?: number }> {
  const { muammo } = await rahbarMuammosi(muammoId);
  if (!TAHRIRLANADIGAN.includes(muammo.status as (typeof TAHRIRLANADIGAN)[number])) {
    return { saqlandi: false };
  }

  const natija = qoralamaSxemasi.safeParse(malumot);
  if (!natija.success) return { saqlandi: false };

  // undefined maydonlarni yubormaymiz — ular "o'zgarmadi" degani
  const yozish = Object.fromEntries(
    Object.entries(natija.data).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(yozish).length === 0) return { saqlandi: true };

  await db.problem.update({
    where: { id: muammoId },
    data: yozish as Prisma.ProblemUpdateInput,
  });
  await hisoblarniYangila(muammoId);

  const yangilangan = await db.problem.findUnique({
    where: { id: muammoId },
    select: { completeness: true },
  });
  return { saqlandi: true, toliqlik: yangilangan?.completeness };
}

// ─────────────────────────────────────────────────────────────────────
//  Fayllar
// ─────────────────────────────────────────────────────────────────────

/** Mijoz omborga yuklab bo'lgan fayl haqidagi ma'lumot. */
export type YuklanganFayl = {
  yol: string;
  nomi: string;
  hajm: number;
  turi: string;
};

/**
 * Omborga yuklangan fayllarni muammoga biriktiradi.
 *
 * Fayl baytlari bu yerga KELMAYDI — brauzer ularni `/api/yuklash`
 * tokeni bilan omborga bevosita yuborgan. Sabab: Vercel serverless
 * funksiyasiga 4.5 MB dan katta tana o'tmaydi (o'lchangan: 4 MB
 * o'tadi, 4.4 MB da 413). Ilgari kodda 10 MB deb yozilgani holda
 * amalda undan katta Excel fayli umuman biriktirilmasdi — TZ esa
 * aynan real Excel faylini eng qimmatli ma'lumot deb ataydi.
 *
 * Yo'l mijozdan kelgani uchun ishonchsiz: prefiks shu muammoga mos
 * kelishi tekshiriladi. Token berishda ham xuddi shu tekshiruv bor.
 */
export async function fayllarniBiriktir(
  muammoId: string,
  fayllar: YuklanganFayl[]
): Promise<AmalNatijasi> {
  const { rahbar, muammo } = await rahbarMuammosi(muammoId);
  if (!TAHRIRLANADIGAN.includes(muammo.status as (typeof TAHRIRLANADIGAN)[number])) {
    return { xato: "Yuborilgan muammoga fayl qo'shib bo'lmaydi." };
  }
  if (fayllar.length === 0) return { xato: "Fayl tanlanmadi." };
  if (muammo._count.attachments + fayllar.length > 10) {
    return { xato: "Bitta muammoga ko'pi bilan 10 ta fayl biriktirish mumkin." };
  }

  const kutilganPrefiks = `biriktirmalar/${muammoId}/`;
  if (fayllar.some((f) => !f.yol.startsWith(kutilganPrefiks))) {
    return { xato: "Fayl yo'li noto'g'ri." };
  }

  await db.problemAttachment.createMany({
    data: fayllar.map((f) => ({
      problemId: muammoId,
      fileName: f.nomi,
      storedName: f.yol,
      mimeType: f.turi,
      size: f.hajm,
    })),
  });

  await hisoblarniYangila(muammoId);
  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.fayl_yuklandi",
    entity: "Problem",
    entityId: muammoId,
    meta: { soni: fayllar.length },
  });
  revalidatePath(`/rahbar/muammo/${muammoId}`, "layout");

  return { muvaffaqiyat: `${fayllar.length} ta fayl biriktirildi.` };
}

export async function biriktirmaniOchir(biriktirmaId: string) {
  const rahbar = await talabRahbar();
  const biriktirma = await db.problemAttachment.findFirst({
    where: { id: biriktirmaId, problem: { organizationId: rahbar.organizationId } },
    include: { problem: { select: { id: true, status: true } } },
  });
  if (!biriktirma) throw new Error("Fayl topilmadi.");
  if (!TAHRIRLANADIGAN.includes(biriktirma.problem.status as (typeof TAHRIRLANADIGAN)[number])) {
    throw new Error("Yuborilgan muammodan fayl o'chirib bo'lmaydi.");
  }

  await db.problemAttachment.delete({ where: { id: biriktirmaId } });
  await diskdanOchir(biriktirma.storedName);
  await hisoblarniYangila(biriktirma.problem.id);

  revalidatePath(`/rahbar/muammo/${biriktirma.problem.id}`, "layout");
}

// ─────────────────────────────────────────────────────────────────────
//  Yuborish va o'chirish
// ─────────────────────────────────────────────────────────────────────

/** Barcha 5 qadamni tekshirib, muammoni moderatsiyaga yuboradi. */
export async function muammoniYubor(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const { rahbar, muammo } = await rahbarMuammosi(muammoId);
  if (!TAHRIRLANADIGAN.includes(muammo.status as (typeof TAHRIRLANADIGAN)[number])) {
    return { xato: "Bu muammo allaqachon yuborilgan." };
  }

  const kamchiliklar: string[] = [];
  for (const qadam of [1, 2, 3, 4, 5] as QadamRaqami[]) {
    const natija = qadamSxemalari[qadam].safeParse(muammo);
    if (!natija.success) kamchiliklar.push(`${qadam}-qadam: ${QADAM_NOMLARI[qadam].toliq}`);
  }

  if (kamchiliklar.length > 0) {
    return {
      xato: `Quyidagi qadamlar to'liq emas — ${kamchiliklar.join(", ")}. Ularni to'ldirib, qaytadan yuboring.`,
    };
  }

  /*
    Muammo TO'G'RIDAN-TO'G'RI omborga tushadi — administrator tasdig'i
    kutilmaydi.

    Ilgari zanjir `SUBMITTED → (admin) → APPROVED` edi. Amalda bu ikki
    narsani buzardi: rahbar yuborgach kutib qolardi, dasturchi esa
    muammoni umuman ko'rmasdi. Kartochkadagi kamchilikni endi dasturchi
    suhbat orqali to'g'ridan-to'g'ri so'raydi — bu moderatorning taxmin
    qilishidan aniqroq.

    `APPROVED` holati saqlanib qoldi (ombor, filtrlar va statistika
    o'shanga tayanadi), faqat unga o'tish endi yuborish paytida bo'ladi.
    Administratorda keyin aralashish huquqi qoladi: nomaqbul yozuvni
    arxivga oladi.
  */
  const hozir = new Date();
  await db.$transaction([
    db.problem.update({
      where: { id: muammoId },
      data: {
        status: "APPROVED",
        submittedAt: hozir,
        approvedAt: hozir,
        moderationNote: null,
      },
    }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: muammo.status,
        toStatus: "APPROVED",
        actorId: rahbar.id,
        comment: "Muammo omborga yuborildi",
      },
    }),
  ]);

  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.yuborildi",
    entity: "Problem",
    entityId: muammoId,
  });

  /*
    Semantik qidiruv uchun vektor. Ataylab `await` bilan, lekin xatosi
    yutiladi (`muammoVektoriniYangila` hech qachon tashlamaydi): muammo
    allaqachon omborda, embedding xizmati ishlamagani uchun rahbarning
    ishi to'xtab qolishi mumkin emas. Yozilmay qolgan vektorlarni
    keyinroq `npm run embedding` to'ldiradi.
  */
  await muammoVektoriniYangila(muammoId);

  revalidatePath("/rahbar");
  redirect(`/rahbar/muammo/${muammoId}/korish?yuborildi=1`);
}

export async function qoralamaniOchir(fd: FormData) {
  const muammoId = String(fd.get("muammoId") ?? "");
  const { rahbar, muammo } = await rahbarMuammosi(muammoId);
  if (muammo.status !== "DRAFT") {
    throw new Error("Faqat qoralamani o'chirish mumkin.");
  }

  const biriktirmalar = await db.problemAttachment.findMany({
    where: { problemId: muammoId },
    select: { storedName: true },
  });

  await db.problem.delete({ where: { id: muammoId } });
  await Promise.all(biriktirmalar.map((b) => diskdanOchir(b.storedName)));

  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.qoralama_ochirildi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath("/rahbar");
  redirect("/rahbar");
}

// ─────────────────────────────────────────────────────────────────────
//  Dublikat aniqlash
// ─────────────────────────────────────────────────────────────────────

/**
 * Yozilayotgan paytda o'xshash muammolarni qidiradi.
 *
 * Sehrgarning 1-qadami buni chaqiradi va rahbarga «bunga o'xshash muammo
 * bor» deb ko'rsatadi — shu tarzda ombor dublikatlarga to'lib ketmaydi.
 *
 * Sarlavha bilan birga TAVSIF ham yuboriladi. Saqlangan vektorlar
 * `muammoMatni()` — ya'ni sarlavha + tavsif — dan olingan. So'rovga faqat
 * sarlavha berilsa, u vektor fazosining boshqa joyiga tushadi va ballar
 * sun'iy ravishda pasayadi. Trigramga tushib qolganda esa faqat birinchi
 * qator ishlatiladi (`oxshashMuammolar` ichida), chunki `similarity()`
 * uzun matnda cho'kib ketadi.
 */
export async function oxshashlarniTop(
  sarlavha: string,
  joriyMuammoId: string,
  tavsif?: string
): Promise<OxshashMuammo[]> {
  await talabRahbar();
  const matn = muammoMatni({ title: sarlavha, description: tavsif });
  return oxshashMuammolar(matn, { chiqarilsin: [joriyMuammoId], soni: 4 });
}

// ─────────────────────────────────────────────────────────────────────
//  Siklni yopish
// ─────────────────────────────────────────────────────────────────────

/**
 * Rahbar yechimni qabul qiladi va muammoni yopadi.
 *
 * Siklni ataylab RAHBAR yopadi, dasturchi emas: aks holda muammo "hal qilindi"
 * deb belgilanib, aslida hech narsa o'zgarmagan bo'lishi mumkin edi.
 */
export async function muammoniYop(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const muammoId = String(fd.get("muammoId") ?? "");
  const izoh = String(fd.get("izoh") ?? "").trim();
  const { rahbar, muammo } = await rahbarMuammosi(muammoId);

  if (muammo.status !== "SOLUTION_OFFERED") {
    return { xato: "Muammoni faqat yechim taqdim etilgandan keyin yopish mumkin." };
  }

  await db.$transaction([
    db.problem.update({
      where: { id: muammoId },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    }),
    db.problemAssignment.updateMany({
      where: { problemId: muammoId, releasedAt: null },
      data: { releasedAt: new Date(), activeKey: null },
    }),
    db.problemStatusHistory.create({
      data: {
        problemId: muammoId,
        fromStatus: "SOLUTION_OFFERED",
        toStatus: "RESOLVED",
        actorId: rahbar.id,
        comment: izoh || "Rahbar yechimni qabul qildi",
      },
    }),
  ]);

  await auditYoz({
    actorId: rahbar.id,
    action: "muammo.hal_qilindi",
    entity: "Problem",
    entityId: muammoId,
  });

  revalidatePath("/rahbar");
  revalidatePath(`/rahbar/muammo/${muammoId}/korish`);
  return { muvaffaqiyat: "Rahmat! Muammo hal qilingan deb belgilandi." };
}
