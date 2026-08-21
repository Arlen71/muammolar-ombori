/**
 * Fayllar bilan ishlashning brauzerda ham kerak bo'ladigan qismi.
 * `uploads.ts` "server-only" bo'lgani uchun bu qiymatlar alohida turadi.
 *
 * Fayl brauzerdan omborga TO'G'RIDAN-TO'G'RI yuklanadi, ya'ni chegara va
 * ruxsat etilgan turlar ikkala tomonga ham kerak:
 *   - brauzerda — foydalanuvchiga darhol javob berish uchun;
 *   - serverda (`/api/yuklash`) — haqiqiy cheklov sifatida.
 * Ikkalasi bitta manbadan o'qiydi, shunda ular bir-biridan uzoqlashmaydi.
 */

export function hajmMatni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Profil rasmi uchun hajm chegarasi — 10 MB.
 *
 * Zamonaviy telefon kamerasi 3–8 MB li rasm chiqaradi va foydalanuvchi
 * uni qirqib o'tirmaydi. Avatar ekranda 32–80 piksel ko'rsatilsa ham,
 * cheklov foydalanuvchining haqiqiy fayliga qarab qo'yiladi.
 */
export const RASM_MAKSIMAL_HAJMI = 10 * 1024 * 1024;

/** Profil rasmi uchun ruxsat etilgan MIME turlari. */
export const RASM_TURLARI = ["image/png", "image/jpeg", "image/webp"] as const;

/** Muammoga biriktiriladigan hujjatlar uchun ruxsat etilgan MIME turlari. */
export const HUJJAT_TURLARI = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/csv",
  "application/csv",
  "text/plain",
] as const;
