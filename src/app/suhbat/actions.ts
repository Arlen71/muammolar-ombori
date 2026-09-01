"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { talabKirish } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { suhbatRoli, suhbatniOchYokiTop, yozaOladimi } from "@/lib/suhbat";
import { zodXatolari, type AmalNatijasi } from "@/lib/validation";

/** Ombordagi holatlar — faqat shular bo'yicha suhbat boshlanadi. */
const OMBORDAGI = ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"];

/**
 * Dasturchi muammo bo'yicha suhbat boshlaydi.
 *
 * Muammoni OLISH shart emas — aynan shu maqsad: dasturchi kartochkadagi
 * kamchilikni ko'rsa, olishdan oldin so'ray oladi. Ilgari bunday savol
 * tizimdan tashqarida, telefonda so'ralardi va javob hech qayerda
 * qolmasdi.
 */
export async function suhbatBoshla(muammoId: string): Promise<
  AmalNatijasi & { suhbatId?: string }
> {
  const foydalanuvchi = await talabKirish();

  if (foydalanuvchi.role !== "DEVELOPER" || foydalanuvchi.status !== "ACTIVE") {
    return { xato: "Suhbatni faqat tasdiqlangan dasturchi boshlaydi." };
  }

  const muammo = await db.problem.findUnique({
    where: { id: muammoId },
    select: { status: true, canonicalId: true },
  });
  if (!muammo || !OMBORDAGI.includes(muammo.status)) {
    return { xato: "Muammo topilmadi." };
  }

  const suhbat = await suhbatniOchYokiTop(muammoId, foydalanuvchi.id);

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "suhbat.boshlandi",
    entity: "Suhbat",
    entityId: suhbat.id,
    meta: { problemId: muammoId },
  });

  return { suhbatId: suhbat.id };
}

const xabarSxemasi = z.object({
  matn: z.string().trim().max(4000, "Xabar juda uzun — 4000 belgidan oshmasin"),
});

/** Mijoz omborga yuklab bo'lgan fayl haqidagi ma'lumot. */
export type YuklanganSuhbatFayli = {
  yol: string;
  nomi: string;
  hajm: number;
  turi: string;
};

/**
 * Suhbatga xabar yuboradi.
 *
 * Fayl baytlari bu amalga KELMAYDI — brauzer ularni omborga bevosita
 * yuborgan (`/api/yuklash` tokeni bilan). Bu yerga faqat yo'l keladi va
 * u ishonchsiz deb qaraladi: prefiks shu suhbatga mos kelishi
 * tekshiriladi.
 */
export async function xabarYubor(
  suhbatId: string,
  matn: string,
  fayllar: YuklanganSuhbatFayli[] = []
): Promise<AmalNatijasi> {
  const foydalanuvchi = await talabKirish();

  const suhbat = await db.suhbat.findUnique({
    where: { id: suhbatId },
    select: {
      id: true,
      developerId: true,
      problem: { select: { id: true, organizationId: true } },
    },
  });
  if (!suhbat) return { xato: "Suhbat topilmadi." };

  const rol = suhbatRoli(foydalanuvchi, suhbat);
  if (!yozaOladimi(rol)) {
    return { xato: "Bu suhbatga yozish huquqingiz yo'q." };
  }

  const natija = xabarSxemasi.safeParse({ matn });
  if (!natija.success) return { maydonXatolari: zodXatolari(natija.error) };

  const toza = natija.data.matn;
  if (!toza && fayllar.length === 0) {
    return { xato: "Xabar bo'sh — matn yozing yoki fayl biriktiring." };
  }

  const kutilganPrefiks = `suhbat/${suhbatId}/`;
  if (fayllar.some((f) => !f.yol.startsWith(kutilganPrefiks))) {
    return { xato: "Fayl yo'li noto'g'ri." };
  }

  const hozir = new Date();

  await db.$transaction([
    db.suhbatXabari.create({
      data: {
        suhbatId,
        yuboruvchiId: foydalanuvchi.id,
        matn: toza || null,
        fayllar: {
          create: fayllar.map((f) => ({
            fileName: f.nomi,
            storedName: f.yol,
            mimeType: f.turi,
            size: f.hajm,
          })),
        },
      },
    }),
    /*
      Yuboruvchining o'qilgan belgisi ham yangilanadi: o'z xabaringiz
      sizga o'qilmagan bo'lib ko'rinmasligi kerak. Ro'yxat saralanishi
      uchun `oxirgiXabarAt` ham shu yerda.
    */
    db.suhbat.update({
      where: { id: suhbatId },
      data:
        rol === "rahbar"
          ? { oxirgiXabarAt: hozir, rahbarOqidi: hozir }
          : { oxirgiXabarAt: hozir, dasturchiOqidi: hozir },
    }),
  ]);

  revalidatePath(`/suhbat/${suhbatId}`);
  revalidatePath("/suhbat");
  return { muvaffaqiyat: "" };
}
