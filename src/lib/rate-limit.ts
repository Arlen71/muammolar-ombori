import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Kirishga urinishlar cheklovi — parolni brute-force qilishga qarshi.
 *
 * Ikki amalga oshirish:
 *
 *   1. **Cloudflare Rate Limiting bindingi** (ishlab chiqarish). Butun tarmoq
 *      bo'ylab hisoblaydi. Cheklov: 60 soniyada 5 ta urinish — binding faqat
 *      10 yoki 60 soniyalik oynani qo'llab-quvvatlaydi.
 *
 *   2. **Xotiradagi hisoblagich** (lokal ishlab chiqish). Binding topilmasa
 *      ishlatiladi. 15 daqiqada 5 ta muvaffaqiyatsiz urinish, keyin 15 daqiqa blok.
 *
 * Nega ikkitasi: Workers'da har bir so'rov alohida, qisqa umrli muhitda
 * bajariladi va isolate'lar bir-birining xotirasini ko'rmaydi — oddiy `Map`
 * u yerda hech narsani cheklamaydi.
 */

type Yozuv = { urinishlar: number; birinchiUrinish: number; blokTa: number };

const yozuvlar = new Map<string, Yozuv>();

const OYNA_MS = 15 * 60 * 1000;
const MAKS_URINISH = 5;
const BLOK_MS = 15 * 60 * 1000;

export type CheklovHolati = { ruxsat: boolean; qolganSoniya: number };

/** Eskirgan yozuvlarni tozalaydi — xotira cheksiz o'smasligi uchun. */
function tozala(hozir: number) {
  if (yozuvlar.size < 1000) return;
  for (const [kalit, y] of yozuvlar) {
    if (hozir > y.blokTa && hozir - y.birinchiUrinish > OYNA_MS) yozuvlar.delete(kalit);
  }
}

async function cloudflareBindingi() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env.KIRISH_CHEKLOVI ?? null;
  } catch {
    // Cloudflare muhitidan tashqarida (masalan testlar) — zaxira usul ishlaydi
    return null;
  }
}

/**
 * Urinishga ruxsat bormi?
 *
 * Cloudflare bindingi bilan: **har bir chaqiruv hisoblanadi**, shuning uchun
 * bu funksiya bitta kirish urinishida faqat bir marta chaqirilishi kerak.
 */
export async function kirishChekla(kalit: string): Promise<CheklovHolati> {
  const binding = await cloudflareBindingi();
  if (binding) {
    const { success } = await binding.limit({ key: kalit });
    return success ? { ruxsat: true, qolganSoniya: 0 } : { ruxsat: false, qolganSoniya: 60 };
  }

  const hozir = Date.now();
  const y = yozuvlar.get(kalit);
  if (!y) return { ruxsat: true, qolganSoniya: 0 };
  if (hozir < y.blokTa) {
    return { ruxsat: false, qolganSoniya: Math.ceil((y.blokTa - hozir) / 1000) };
  }
  return { ruxsat: true, qolganSoniya: 0 };
}

/**
 * Muvaffaqiyatsiz urinishni qayd etadi.
 * Cloudflare bindingi ishlatilganda hisob allaqachon `kirishChekla` da
 * yuritilgani uchun bu funksiya faqat lokal hisoblagichga ta'sir qiladi.
 */
export function muvaffaqiyatsizUrinish(kalit: string): void {
  const hozir = Date.now();
  tozala(hozir);

  const y = yozuvlar.get(kalit);
  if (!y || hozir - y.birinchiUrinish > OYNA_MS) {
    yozuvlar.set(kalit, { urinishlar: 1, birinchiUrinish: hozir, blokTa: 0 });
    return;
  }

  y.urinishlar += 1;
  if (y.urinishlar >= MAKS_URINISH) {
    y.blokTa = hozir + BLOK_MS;
    y.urinishlar = 0;
    y.birinchiUrinish = hozir;
  }
}

/** Muvaffaqiyatli kirishdan keyin lokal hisoblagichni tozalaydi. */
export function tiklash(kalit: string): void {
  yozuvlar.delete(kalit);
}
