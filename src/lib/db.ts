import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. .env faylini .env.example asosida to'ldiring."
    );
  }

  /*
    Ulanishlar hovuzini o'zimiz quramiz (adapterga faqat manzil berish o'rniga),
    chunki ikkita narsa kerak:

    1. `pool.on("error")` — bo'sh turgan ulanish uzilsa, node-postgres xato
       chiqaradi. Uni ushlamasak, butun Node jarayoni yiqiladi. Bu ayniqsa
       ma'lumotlar bazasi qayta ishga tushganda yuz beradi.
    2. `idleTimeoutMillis` — uzoq turgan ulanishlar o'zi yopiladi, shuning uchun
       server tomondan uzilgan "o'lik" ulanishga duch kelish ehtimoli kamayadi
       (P1017 xatosi).
  */
  /*
    Hovuz hajmi sozlanadigan, chunki lokal va ishlab chiqarish muhitlari juda farq qiladi:
      - `prisma dev` (lokal) PGlite — WASM ichidagi Postgres. U bir nechta parallel
        ulanishni ko'tara olmaydi va ortiqchasini uzib yuboradi (P1017 xatosi).
        Shuning uchun lokalda DB_POOL_MAX=3 qilib qo'yilgan.
      - Ishlab chiqarishdagi haqiqiy PostgreSQL standart holda 100 ta ulanish beradi,
        u yerda 10 normal qiymat.
  */
  const hovuzHajmi = Number(process.env.DB_POOL_MAX ?? 10);

  const pool = new Pool({
    connectionString,
    max: Number.isFinite(hovuzHajmi) && hovuzHajmi > 0 ? hovuzHajmi : 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  pool.on("error", (xato) => {
    // Bo'sh ulanishdagi xato — hovuz uni o'zi almashtiradi, jarayonni yiqitmaymiz
    console.error("PostgreSQL ulanishlar hovuzida xato:", xato.message);
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// Next.js dev rejimida hot-reload har safar yangi ulanish hovuzi ochmasligi uchun
// klient global obyektda saqlanadi.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
