import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Next.js ilovasini Cloudflare Workers'ga moslashtirish sozlamasi.
 *
 * Hozircha standart sozlama yetarli: ilovaning barcha sahifalari server
 * tomonida, so'rov bo'yicha render qilinadi (`ƒ` — dynamic), shuning uchun
 * inkremental kesh (ISR) ishlatilmaydi.
 */
export default defineCloudflareConfig();
