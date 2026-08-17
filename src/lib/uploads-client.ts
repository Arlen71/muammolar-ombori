/**
 * Fayllar bilan ishlashning brauzerda ham kerak bo'ladigan qismi.
 * `uploads.ts` "server-only" bo'lgani uchun bu funksiyalar alohida turadi.
 */

export function hajmMatni(bayt: number): string {
  if (bayt < 1024) return `${bayt} B`;
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`;
  return `${(bayt / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
