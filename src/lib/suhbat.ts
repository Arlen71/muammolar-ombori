import "server-only";

import { db } from "@/lib/db";
import type { JoriyFoydalanuvchi } from "@/lib/auth";

/**
 * Suhbat ruxsatlari.
 *
 * Butun mantiq shu faylda: kim qaysi suhbatni ko'radi, kim yoza oladi.
 * Tarqalib ketsa, yangi sahifa qo'shilganda tekshiruvni unutish oson
 * bo'lardi — bu esa yopiq tizimda yozishmaning sizib chiqishi demakdir.
 *
 * QATNASHCHILAR
 *
 *   Dasturchi — aniq bitta odam (`Suhbat.developerId`). Boshqa dasturchi
 *               bu yozishmani ko'rmaydi.
 *   Rahbar    — muammo egasi bo'lgan tashkilotning ISTALGAN rahbari.
 *               Muallifning o'zi emas: u ta'tilda bo'lsa yozishma
 *               to'xtab qolmasligi kerak, va tizimning qolgan qismi ham
 *               tashkilot darajasida ishlaydi.
 *   Admin     — faqat O'QIYDI, yozmaydi. Bu rasmiy ish yozishmasi va
 *               nizo chiqqanda platforma egasi ko'ra olishi kerak;
 *               lekin u suhbatning tarafi emas, shuning uchun yoza
 *               olmaydi.
 */

export type SuhbatRoli = "rahbar" | "dasturchi" | "kuzatuvchi";

/**
 * Foydalanuvchining suhbatdagi o'rni. Ruxsat bo'lmasa `null`.
 *
 * `kuzatuvchi` — o'qiy oladi, yoza olmaydi.
 */
export function suhbatRoli(
  foydalanuvchi: JoriyFoydalanuvchi,
  suhbat: { developerId: string; problem: { organizationId: string } }
): SuhbatRoli | null {
  if (foydalanuvchi.role === "ADMIN") return "kuzatuvchi";

  if (
    foydalanuvchi.role === "DEVELOPER" &&
    foydalanuvchi.status === "ACTIVE" &&
    foydalanuvchi.id === suhbat.developerId
  ) {
    return "dasturchi";
  }

  if (
    foydalanuvchi.role === "LEADER" &&
    foydalanuvchi.organizationId === suhbat.problem.organizationId
  ) {
    return "rahbar";
  }

  return null;
}

/** Yoza oladigan rollar. */
export function yozaOladimi(rol: SuhbatRoli | null): boolean {
  return rol === "rahbar" || rol === "dasturchi";
}

/**
 * Suhbatni ochadi yoki mavjudini qaytaradi.
 *
 * Faqat dasturchi boshlay oladi va faqat ombordagi muammo bo'yicha:
 * qoralama hali hech kimga ko'rinmaydi, ya'ni u haqda savol ham
 * tug'ilmaydi.
 *
 * `upsert` ishlatiladi — `@@unique([problemId, developerId])` tufayli
 * ikki marta bosilganda ikkinchi suhbat yaratilmaydi.
 */
export async function suhbatniOchYokiTop(muammoId: string, dasturchiId: string) {
  return db.suhbat.upsert({
    where: { problemId_developerId: { problemId: muammoId, developerId: dasturchiId } },
    create: {
      problemId: muammoId,
      developerId: dasturchiId,
      boshlovchiId: dasturchiId,
    },
    update: {},
    select: { id: true },
  });
}

/**
 * Suhbatdagi o'qilmagan xabarlar soni.
 *
 * "Men yozmagan va men oxirgi ochganimdan keyin kelgan" xabarlar.
 * Har bir xabarga `readAt` qo'yish o'rniga suhbatda ikkita vaqt belgisi
 * turadi — suhbat ochilganda bitta qator yangilanadi, N ta emas.
 */
export async function oqilmaganSoni(
  suhbatId: string,
  rol: SuhbatRoli,
  foydalanuvchiId: string,
  oqilganVaqt: Date | null
): Promise<number> {
  if (rol === "kuzatuvchi") return 0;

  return db.suhbatXabari.count({
    where: {
      suhbatId,
      yuboruvchiId: { not: foydalanuvchiId },
      // Hech qachon ochilmagan bo'lsa — hammasi o'qilmagan
      createdAt: { gt: oqilganVaqt ?? new Date(0) },
    },
  });
}

/** Suhbat ochilganda "o'qidim" belgisini yangilaydi. */
export async function oqildiDeb(suhbatId: string, rol: SuhbatRoli): Promise<void> {
  // Kuzatuvchi (admin) o'qigani hisobga olinmaydi — u suhbatning tarafi emas
  if (rol === "kuzatuvchi") return;

  await db.suhbat.update({
    where: { id: suhbatId },
    data: rol === "rahbar" ? { rahbarOqidi: new Date() } : { dasturchiOqidi: new Date() },
  });
}

/**
 * Foydalanuvchining BARCHA suhbatlaridagi o'qilmagan xabarlar soni.
 *
 * Yon paneldagi belgi uchun. Har bir suhbatni alohida sanash o'rniga
 * bitta so'rov: suhbatlar ro'yxati olinadi va `OR` sharti bilan
 * hammasi birdaniga sanaladi.
 *
 * Administrator uchun har doim 0 — u suhbatning tarafi emas, kuzatuvchi.
 */
export async function jamiOqilmagan(
  foydalanuvchi: JoriyFoydalanuvchi
): Promise<number> {
  if (foydalanuvchi.role === "ADMIN") return 0;

  const suhbatlar = await db.suhbat.findMany({
    where:
      foydalanuvchi.role === "DEVELOPER"
        ? { developerId: foydalanuvchi.id }
        : { problem: { organizationId: foydalanuvchi.organizationId ?? "" } },
    select: { id: true, rahbarOqidi: true, dasturchiOqidi: true },
  });

  if (suhbatlar.length === 0) return 0;

  return db.suhbatXabari.count({
    where: {
      yuboruvchiId: { not: foydalanuvchi.id },
      OR: suhbatlar.map((s) => ({
        suhbatId: s.id,
        createdAt: {
          gt:
            (foydalanuvchi.role === "LEADER" ? s.rahbarOqidi : s.dasturchiOqidi) ??
            new Date(0),
        },
      })),
    },
  });
}
