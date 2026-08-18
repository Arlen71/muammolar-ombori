import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { hajmMatni } from "@/lib/uploads-client";

/**
 * Biriktirilgan fayllarni saqlash — Cloudflare R2 da.
 *
 * Nega fayl tizimi emas: Cloudflare Workers'da har bir so'rov alohida,
 * qisqa umrli muhitda bajariladi. Diskka yozish "ishlagandek" ko'rinadi,
 * lekin fayl keyingi so'rovda yo'q bo'ladi — bu xatolikdan ham yomonroq,
 * chunki jimgina ma'lumot yo'qotadi.
 *
 * Bucket ochiq EMAS. Fayllar faqat `/api/fayl/[id]` marshruti orqali,
 * foydalanuvchi ruxsati tekshirilgandan keyin beriladi.
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
 * Fayl ombori ulanganmi.
 *
 * R2 Cloudflare hisobida alohida yoqiladi. Yoqilmagan bo'lsa ilova qulab
 * tushmasligi, balki tushunarli xabar ko'rsatishi kerak — shuning uchun
 * interfeys yuklash blokini ko'rsatishdan oldin shuni so'raydi.
 */
export async function omborUlanganmi(): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return Boolean(env.BIRIKTIRMALAR);
  } catch {
    return false;
  }
}

async function ombor() {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.BIRIKTIRMALAR;
  if (!bucket) {
    throw new Error(
      "BIRIKTIRMALAR R2 bindingi topilmadi. wrangler.jsonc dagi r2_buckets " +
        "sozlamasini va bucket yaratilganini tekshiring."
    );
  }
  return bucket;
}

/** Fayl nomidan kengaytmani ajratadi (`path` moduli Workers'da ishlatilmaydi). */
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
 * Faylni tekshirib R2 ga yozadi.
 *
 * Xavfsizlik: saqlanadigan kalit butunlay tizim tomonidan yaratiladi
 * (`randomUUID` + ruxsat etilgan kengaytma). Foydalanuvchi bergan nom faqat
 * ko'rsatish uchun bazada saqlanadi va hech qachon kalit sifatida
 * ishlatilmaydi — shu tufayli "../" kabi hujum imkonsiz.
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

  // Brauzer ba'zan MIME'ni bo'sh yuboradi — kengaytma bo'yicha to'ldiramiz
  const mime = ruxsatEtilganTurlar.includes(fayl.type) ? fayl.type : ruxsatEtilganTurlar[0];
  const kalit = `${crypto.randomUUID()}${keng}`;

  await (await ombor()).put(kalit, await fayl.arrayBuffer(), {
    httpMetadata: { contentType: mime },
  });

  return {
    fileName: tozaNom(fayl.name),
    storedName: kalit,
    mimeType: mime,
    size: fayl.size,
  };
}

/** Saqlangan kalit tizim yaratgan ko'rinishga mos keladimi. */
function kalitTogrimi(kalit: string): boolean {
  return /^[a-f0-9-]{36}\.[a-z0-9]{2,5}$/i.test(kalit);
}

/** Faylni R2 dan o'qiydi. Topilmasa yoki kalit noto'g'ri bo'lsa `null`. */
export async function faylniOlish(
  saqlanadiganNom: string
): Promise<{ oqim: ReadableStream; hajm: number } | null> {
  if (!kalitTogrimi(saqlanadiganNom)) return null;

  const obyekt = await (await ombor()).get(saqlanadiganNom);
  if (!obyekt) return null;

  return { oqim: obyekt.body, hajm: obyekt.size };
}

export async function faylniOchir(saqlanadiganNom: string): Promise<void> {
  if (!kalitTogrimi(saqlanadiganNom)) return;
  await (await ombor()).delete(saqlanadiganNom);
}
