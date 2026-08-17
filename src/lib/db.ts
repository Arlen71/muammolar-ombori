import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma klienti.
 *
 * Ulanish `prisma+postgres://` protokoli orqali, HTTP ustida ketadi.
 * Bu ataylab tanlangan va yagona qo'llab-quvvatlanadigan usul:
 *
 *   1. Cloudflare Workers'da har bir so'rov alohida, qisqa umrli muhitda
 *      bajariladi. TCP ulanishlar hovuzini so'rovlar orasida saqlab bo'lmaydi,
 *      har bir isolate esa o'z hovuzini ochsa, baza ulanishlari tez tugaydi.
 *      HTTP hech qanday hovuz talab qilmaydi.
 *   2. Lokal va ishlab chiqarish muhitlari bitta kod yo'lidan yuradi —
 *      "lokalda ishlaydi, serverda ishlamaydi" holati yo'q.
 *   3. `pg` drayveri, ulanishlar hovuzi sozlamalari va ular bilan bog'liq
 *      uchta bog'liqlik umuman kerak emas.
 */
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. .env faylini .env.example asosida to'ldiring."
    );
  }
  if (!url.startsWith("prisma+postgres://")) {
    throw new Error(
      "DATABASE_URL `prisma+postgres://` bilan boshlanishi kerak.\n" +
        "Prisma Console'dagi ulanish manzilini oling: https://console.prisma.io"
    );
  }

  return new PrismaClient({
    accelerateUrl: url,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

type Klient = ReturnType<typeof createClient>;

// Next.js dev rejimida hot-reload har safar yangi klient yaratmasligi uchun
// u global obyektda saqlanadi.
const globalForPrisma = globalThis as unknown as { prisma?: Klient };

function klientniOl(): Klient {
  const mavjud = globalForPrisma.prisma;
  if (mavjud) return mavjud;

  const yangi = createClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = yangi;
  return yangi;
}

/**
 * Klient birinchi murojaatda yaratiladi, modul yuklanishida emas.
 *
 * Sababi: `next build` sahifalarni tahlil qilish uchun modullarni yuklaydi.
 * Agar klient shu paytda yaratilsa, build ishlab chiqarish maxfiy
 * ma'lumotlarini talab qilib qoladi — CI va toza muhitda build yiqiladi.
 */
export const db = new Proxy({} as Klient, {
  get(_maqsad, xossa, qabulqiluvchi) {
    const klient = klientniOl();
    const qiymat = Reflect.get(klient as object, xossa, qabulqiluvchi);
    return typeof qiymat === "function" ? qiymat.bind(klient) : qiymat;
  },
});
