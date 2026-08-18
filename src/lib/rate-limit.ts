import "server-only";

/**
 * Kirishga urinishlar cheklovi — parolni brute-force qilishga qarshi.
 *
 * 15 daqiqada 5 ta muvaffaqiyatsiz urinish, keyin 15 daqiqa blok.
 *
 * CHEKLOVI (bilib turib qabul qilingan):
 * Hisoblagich jarayon xotirasida. Serverless muhitda (Vercel) bir nechta
 * nusxa parallel ishlashi mumkin va har biri o'z hisobini yuritadi, ya'ni
 * amaldagi chegara nusxalar soniga ko'payadi. Bu himoyani butunlay yo'q
 * qilmaydi — bitta nusxa bir necha so'rovga xizmat qiladi — lekin qat'iy
 * kafolat ham bermaydi.
 *
 * Qat'iy kafolat kerak bo'lganda hisoblagichni tashqi omborga (Redis yoki
 * bazadagi jadval) ko'chirish kerak. Pilot bosqichi uchun hozirgisi yetarli:
 * parollar `scrypt` bilan xeshlangan va sessiyalar bekor qilinadi.
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

/** Urinishga ruxsat bormi? Hisoblagichni oshirmaydi. */
export function kirishChekla(kalit: string): CheklovHolati {
  const hozir = Date.now();
  const y = yozuvlar.get(kalit);
  if (!y) return { ruxsat: true, qolganSoniya: 0 };
  if (hozir < y.blokTa) {
    return { ruxsat: false, qolganSoniya: Math.ceil((y.blokTa - hozir) / 1000) };
  }
  return { ruxsat: true, qolganSoniya: 0 };
}

/** Muvaffaqiyatsiz urinishni qayd etadi va kerak bo'lsa bloklaydi. */
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

/** Muvaffaqiyatli kirishdan keyin hisoblagichni tozalaydi. */
export function tiklash(kalit: string): void {
  yozuvlar.delete(kalit);
}
