import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { hajmMatni } from "@/lib/uploads-client";

/**
 * Biriktirilgan fayllarni saqlash.
 *
 * Fayllar `public/` ichida EMAS — ular tashkilotlarning ichki hujjatlari
 * (jurnal namunalari, Excel jadvallar, skrinshotlar) va faqat tasdiqlangan
 * foydalanuvchilarga ko'rinishi kerak. Shuning uchun ular loyihadan tashqaridagi
 * papkaga yoziladi va `/api/fayl/[id]` marshruti orqali, ruxsat tekshirilgandan
 * keyin beriladi.
 */

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

export function yuklashPapkasi(): string {
  const papka = process.env.UPLOAD_DIR || "./uploads";
  if (path.isAbsolute(papka)) return papka;
  // turbopackIgnore: bu yo'l ish vaqtida sozlamadan olinadi, bundle'ga
  // kiritiladigan fayl emas. Izohsiz Turbopack butun papkani bundle'ga
  // qo'shishga urinadi va build hajmi keraksiz o'sadi.
  return path.join(/* turbopackIgnore: true */ process.cwd(), papka);
}

export function maksimalHajm(): number {
  const n = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
  return Number.isFinite(n) && n > 0 ? n : 10 * 1024 * 1024;
}

export { hajmMatni };

export type FaylXatosi = { xato: string };
export type FaylNatijasi = {
  fileName: string;
  storedName: string;
  mimeType: string;
  size: number;
};

/**
 * Faylni tekshirib diskka yozadi.
 *
 * Xavfsizlik: saqlanadigan nom butunlay tizim tomonidan yaratiladi
 * (`randomUUID` + ruxsat etilgan kengaytma). Foydalanuvchi bergan nom faqat
 * ko'rsatish uchun bazada saqlanadi va hech qachon yo'l sifatida ishlatilmaydi —
 * shu tufayli "../../etc/passwd" kabi hujum imkonsiz.
 */
export async function faylniSaqla(fayl: File): Promise<FaylNatijasi | FaylXatosi> {
  if (fayl.size === 0) return { xato: "Fayl bo'sh" };
  if (fayl.size > maksimalHajm()) {
    return { xato: `Fayl juda katta. Ruxsat etilgan eng katta hajm: ${hajmMatni(maksimalHajm())}` };
  }

  const kengaytma = path.extname(fayl.name).toLowerCase();
  const ruxsatEtilganTurlar = RUXSAT_ETILGAN[kengaytma];
  if (!ruxsatEtilganTurlar) {
    return {
      xato: `Bu turdagi fayl qabul qilinmaydi. Ruxsat etilgan: ${RUXSAT_ETILGAN_KENGAYTMALAR.join(", ")}`,
    };
  }

  // Brauzer ba'zan MIME'ni bo'sh yuboradi — kengaytma bo'yicha to'ldiramiz
  const mime = ruxsatEtilganTurlar.includes(fayl.type) ? fayl.type : ruxsatEtilganTurlar[0];

  const saqlanadiganNom = `${randomUUID()}${kengaytma}`;
  const papka = yuklashPapkasi();
  await mkdir(papka, { recursive: true });
  await writeFile(
    // turbopackIgnore: yuklash papkasi ish vaqtida sozlamadan olinadi va
    // bundle'ga kiradigan fayl emas. Izohsiz build butun loyihani kuzatib chiqadi.
    path.join(/* turbopackIgnore: true */ papka, saqlanadiganNom),
    Buffer.from(await fayl.arrayBuffer())
  );

  return {
    // Ko'rsatish uchun nom: yo'l qismlarini olib tashlaymiz
    fileName: path.basename(fayl.name).slice(0, 180),
    storedName: saqlanadiganNom,
    mimeType: mime,
    size: fayl.size,
  };
}

/** Fayl yo'lini xavfsiz tarzda quradi — papkadan tashqariga chiqishga yo'l qo'ymaydi. */
export function faylYoli(saqlanadiganNom: string): string | null {
  // Saqlanadigan nom har doim tizim yaratgan UUID bo'lishi kerak
  if (!/^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(saqlanadiganNom)) return null;
  const papka = yuklashPapkasi();
  const toliq = path.join(/* turbopackIgnore: true */ papka, saqlanadiganNom);
  // Qo'shimcha himoya: natija baribir papka ichida bo'lsin
  if (!toliq.startsWith(papka + path.sep)) return null;
  return toliq;
}

export async function faylniOchir(saqlanadiganNom: string): Promise<void> {
  const yol = faylYoli(saqlanadiganNom);
  if (!yol) return;
  await unlink(yol).catch(() => {
    // Fayl allaqachon yo'q bo'lsa muammo emas
  });
}
