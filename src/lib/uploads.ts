import "server-only";

import { del, get, put } from "@vercel/blob";

import { hajmMatni } from "@/lib/uploads-client";

/**
 * Biriktirilgan fayllarni saqlash — Vercel Blob orqali.
 *
 * Nega fayl tizimi emas: serverless muhitda disk vaqtinchalik va nusxalar
 * orasida bo'linmaydi. Diskka yozish "ishlagandek" ko'rinadi, lekin fayl
 * keyingi so'rovda yo'q bo'ladi — bu xatolikdan ham yomonroq, chunki
 * jimgina ma'lumot yo'qotadi.
 *
 * MAXFIYLIK: ombor `private` rejimda. Fayllarni internetdan URL bilan
 * ochib bo'lmaydi — ularni faqat `BLOB_READ_WRITE_TOKEN` bilan server
 * o'qiy oladi. Bazada ochiq manzil emas, ichki yo'l saqlanadi.
 *
 * Bu ikki qavatli himoya: foydalanuvchi faylni `/api/fayl/[id]` orqali
 * oladi va u yerda avval ruxsat tekshiriladi. Bazadagi yozuv sizib chiqsa
 * ham fayl ochilmaydi — chunki yo'lning o'zi hech narsa bermaydi.
 */

export { hajmMatni };

/** Ruxsat etilgan turlar: kengaytma → MIME. */
const RUXSAT_ETILGAN: Record<string, string[]> = {
  ".pdf": ["application/pdf"],
  ".png": ["image/png"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".webp": ["image/webp"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".xls": ["application/vnd.ms-excel"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".doc": ["application/msword"],
  ".csv": ["text/csv", "application/csv"],
  ".txt": ["text/plain"],
};

export const RUXSAT_ETILGAN_KENGAYTMALAR = Object.keys(RUXSAT_ETILGAN);

export function maksimalHajm(): number {
  const n = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
}

/**
 * Fayl ombori sozlanganmi.
 *
 * Vercel Blob store yaratilganda `BLOB_READ_WRITE_TOKEN` avtomatik qo'shiladi.
 * Sozlanmagan bo'lsa ilova qulab tushmasligi, balki tushunarli xabar
 * ko'rsatishi kerak — interfeys yuklash blokini ko'rsatishdan oldin shuni so'raydi.
 */
export async function omborUlanganmi(): Promise<boolean> {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function kengaytma(nom: string): string {
  const nuqta = nom.lastIndexOf(".");
  return nuqta > 0 ? nom.slice(nuqta).toLowerCase() : "";
}

/** Yo'l qismlarini olib tashlaydi — faqat ko'rsatish uchun nom qoladi. */
function tozaNom(nom: string): string {
  return nom.split(/[/\\]/).pop()!.slice(0, 180);
}

export type FaylXatosi = { xato: string };
export type FaylNatijasi = {
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

/**
 * Faylni tekshirib omborga yozadi.
 *
 * Xavfsizlik: saqlanadigan yo'l butunlay tizim tomonidan yaratiladi
 * (`randomUUID` + ruxsat etilgan kengaytma). Foydalanuvchi bergan nom faqat
 * ko'rsatish uchun bazada saqlanadi va hech qachon yo'l sifatida ishlatilmaydi.
 */
export async function faylniSaqla(fayl: File): Promise<FaylNatijasi | FaylXatosi> {
  if (fayl.size === 0) return { xato: "Fayl bo'sh" };
  if (fayl.size > maksimalHajm()) {
    return {
      xato: `Fayl juda katta. Ruxsat etilgan eng katta hajm: ${hajmMatni(maksimalHajm())}`,
    };
  }

  const keng = kengaytma(fayl.name);
  const ruxsatEtilganTurlar = RUXSAT_ETILGAN[keng];
  if (!ruxsatEtilganTurlar) {
    return {
      xato: `Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: ${RUXSAT_ETILGAN_KENGAYTMALAR.join(", ")}`,
    };
  }
  if (!(await omborUlanganmi())) {
    return { xato: "Fayl ombori sozlanmagan. Administratorga murojaat qiling." };
  }

  // Brauzer ba'zan MIME'ni bo'sh yuboradi — kengaytma bo'yicha to'ldiramiz
  const mime = ruxsatEtilganTurlar.includes(fayl.type) ? fayl.type : ruxsatEtilganTurlar[0];

  const natija = await put(`biriktirmalar/${crypto.randomUUID()}${keng}`, fayl, {
    access: "private",
    contentType: mime,
    // Yo'lni o'zimiz to'liq belgilaymiz — tasodifiy qo'shimcha kerak emas
    addRandomSuffix: false,
  });

  return {
    fileName: tozaNom(fayl.name),
    // Ichki yo'l saqlanadi (ochiq URL emas) va brauzerga hech qachon berilmaydi
    storedName: natija.pathname,
    mimeType: mime,
    size: fayl.size,
  };
}

/**
 * Saqlangan qiymat biz yaratgan yo'l ko'rinishidami.
 *
 * Bazadagi yozuv buzilgan yoki qo'lda o'zgartirilgan bo'lsa ham, ombordan
 * faqat o'zimiz yozgan naqshdagi fayllar so'raladi.
 */
function yolIshonchlimi(qiymat: string): boolean {
  return /^biriktirmalar\/[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(qiymat);
}

/**
 * Faylni ombordan o'qiydi. Topilmasa yoki yo'l ishonchsiz bo'lsa `null`.
 *
 * Oddiy `fetch` emas, SDK ning `get()` funksiyasi ishlatiladi: ombor private
 * bo'lgani uchun faylni faqat token bilan o'qish mumkin.
 */
export async function faylniOlish(
  saqlanadiganNom: string
): Promise<{ oqim: ReadableStream; hajm: number } | null> {
  if (!yolIshonchlimi(saqlanadiganNom)) return null;

  const natija = await get(saqlanadiganNom, { access: "private" });
  if (!natija || !natija.stream) return null;

  // `get()` hajmni qaytarmaydi; marshrut hajmsiz ham to'g'ri ishlaydi
  return { oqim: natija.stream, hajm: 0 };
}

export async function faylniOchir(saqlanadiganNom: string): Promise<void> {
  if (!yolIshonchlimi(saqlanadiganNom)) return;
  await del(saqlanadiganNom).catch(() => {
    // Fayl allaqachon o'chirilgan bo'lsa muammo emas
  });
}
