import "server-only";

/**
 * Oddiy xotiradagi urinishlar cheklovi — parolni brute-force qilishga qarshi.
 *
 * Cheklovlari (ataylab qabul qilingan):
 *   - Xotirada saqlanadi, server qayta ishga tushsa nolga qaytadi.
 *   - Bir nechta server nusxasi bo'lsa, har biri alohida hisoblaydi.
 * Bitta serverli pilot uchun bu yetarli. Yuklama oshsa Redis'ga o'tkaziladi.
 */

type Yozuv = { urinishlar: number; birinchiUrinish: number; blokTa: number };

const yozuvlar = new Map<string, Yozuv>();

const OYNA_MS = 15 * 60 * 1000; // 15 daqiqa
const MAKS_URINISH = 5;
const BLOK_MS = 15 * 60 * 1000;

/** Eskirgan yozuvlarni tozalaydi — xotira cheksiz o'smasligi uchun. */
function tozala(hozir: number) {
  if (yozuvlar.size < 1000) return;
  for (const [kalit, y] of yozuvlar) {
    if (hozir > y.blokTa && hozir - y.birinchiUrinish > OYNA_MS) yozuvlar.delete(kalit);
  }
}

export type CheklovHolati = { ruxsat: boolean; qolganSoniya: number };

/** Urinishga ruxsat bormi? Hisoblagichni oshirmaydi. */
export function chekla(kalit: string): CheklovHolati {
  const hozir = Date.now();
  const y = yozuvlar.get(kalit);
  if (!y) return { ruxsat: true, qolganSoniya: 0 };

  if (hozir < y.blokTa) {
    return { ruxsat: false, qolganSoniya: Math.ceil((y.blokTa - hozir) / 1000) };
  }
  return { ruxsat: true, qolganSoniya: 0 };
}

/** Muvaffaqiyatsiz urinishni qayd etadi va kerak bo'lsa bloklaydi. */
export function muvaffaqiyatsizUrinish(kalit: string): CheklovHolati {
  const hozir = Date.now();
  tozala(hozir);

  const y = yozuvlar.get(kalit);
  if (!y || hozir - y.birinchiUrinish > OYNA_MS) {
    yozuvlar.set(kalit, { urinishlar: 1, birinchiUrinish: hozir, blokTa: 0 });
    return { ruxsat: true, qolganSoniya: 0 };
  }

  y.urinishlar += 1;
  if (y.urinishlar >= MAKS_URINISH) {
    y.blokTa = hozir + BLOK_MS;
    y.urinishlar = 0;
    y.birinchiUrinish = hozir;
    return { ruxsat: false, qolganSoniya: Math.ceil(BLOK_MS / 1000) };
  }
  return { ruxsat: true, qolganSoniya: 0 };
}

/** Muvaffaqiyatli kirishdan keyin hisoblagichni tozalaydi. */
export function tiklash(kalit: string) {
  yozuvlar.delete(kalit);
}
