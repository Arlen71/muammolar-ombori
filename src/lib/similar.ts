import "server-only";

import { db } from "@/lib/db";

/**
 * O'xshash muammolarni topish.
 *
 * Asosiy usul — PostgreSQL `pg_trgm` kengaytmasidagi `similarity()`. U so'zlarni
 * uch harfli bo'laklarga bo'lib solishtiradi, shuning uchun "hujjat aylanishi
 * sekin" va "hujjatlar aylanishi juda sekin" ni o'xshash deb topadi.
 *
 * Kengaytma bo'lmasa (masalan, DBA ruxsat bermagan bo'lsa) — dastur ishlashdan
 * to'xtamaydi, oddiy so'z bo'yicha qidiruvga o'tadi. Sifat pastroq, lekin bor.
 */

export type OxshashMuammo = {
  id: string;
  refCode: string;
  title: string;
  organizationName: string;
  supporterCount: number;
  oxshashlik: number;
};

/** Kengaytma bir marta tekshiriladi va natija eslab qolinadi. */
let trgmBormi: boolean | null = null;

async function trgmMavjudmi(): Promise<boolean> {
  if (trgmBormi !== null) return trgmBormi;
  try {
    const natija = await db.$queryRaw<{ bor: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') AS bor`;
    trgmBormi = natija[0]?.bor ?? false;
  } catch {
    trgmBormi = false;
  }
  return trgmBormi;
}

/** Zaxira usul: sarlavhadagi uzun so'zlar bo'yicha qidiradi. */
async function zaxiraQidiruv(
  sarlavha: string,
  chiqarilsin: string[],
  soni: number
): Promise<OxshashMuammo[]> {
  const sozlar = sarlavha
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length >= 5)
    .slice(0, 6);
  if (sozlar.length === 0) return [];

  const topilgan = await db.problem.findMany({
    where: {
      id: { notIn: chiqarilsin },
      canonicalId: null,
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
      OR: sozlar.map((s) => ({ title: { contains: s, mode: "insensitive" as const } })),
    },
    take: soni,
    include: {
      organization: { select: { name: true } },
      _count: { select: { supporters: true } },
    },
  });

  return topilgan.map((m) => {
    const mosKelgan = sozlar.filter((s) => m.title.toLowerCase().includes(s)).length;
    return {
      id: m.id,
      refCode: m.refCode,
      title: m.title,
      organizationName: m.organization.name,
      supporterCount: m._count.supporters,
      oxshashlik: mosKelgan / sozlar.length,
    };
  });
}

/**
 * Berilgan sarlavhaga o'xshash, omborda turgan muammolarni qaytaradi.
 *
 * @param eng_kam  0–1 oralig'idagi eng kam o'xshashlik. 0.3 amalda yaxshi ishlaydi:
 *                 pastroq qiymat tasodifiy mosliklarni ham olib keladi.
 */
export async function oxshashMuammolar(
  sarlavha: string,
  {
    chiqarilsin = [],
    soni = 5,
    engKam = 0.3,
  }: { chiqarilsin?: string[]; soni?: number; engKam?: number } = {}
): Promise<OxshashMuammo[]> {
  const tozaSarlavha = sarlavha.trim();
  if (tozaSarlavha.length < 10) return [];

  if (!(await trgmMavjudmi())) {
    return zaxiraQidiruv(tozaSarlavha, chiqarilsin, soni);
  }

  // Prisma'ning tipli so'rovlari `similarity()` ni bilmaydi — xom SQL ishlatamiz.
  // Barcha qiymatlar parametr sifatida uzatiladi, SQL inyeksiya ehtimoli yo'q.
  const chiqarilsinRoyxati = chiqarilsin.length > 0 ? chiqarilsin : ["__yoq__"];

  const natija = await db.$queryRaw<
    {
      id: string;
      refCode: string;
      title: string;
      organizationName: string;
      supporterCount: bigint;
      oxshashlik: number;
    }[]
  >`
    SELECT p.id,
           p."refCode",
           p.title,
           o.name AS "organizationName",
           count(s.id) AS "supporterCount",
           similarity(p.title, ${tozaSarlavha}) AS oxshashlik
      FROM "Problem" p
      JOIN "Organization" o ON o.id = p."organizationId"
      LEFT JOIN "ProblemSupporter" s ON s."problemId" = p.id
     WHERE p."canonicalId" IS NULL
       AND p.status IN ('APPROVED', 'TAKEN', 'SOLUTION_OFFERED', 'RESOLVED')
       AND p.id <> ALL(${chiqarilsinRoyxati})
       AND similarity(p.title, ${tozaSarlavha}) >= ${engKam}
     GROUP BY p.id, p."refCode", p.title, o.name
     ORDER BY oxshashlik DESC
     LIMIT ${soni}`;

  return natija.map((r) => ({
    ...r,
    supporterCount: Number(r.supporterCount),
  }));
}
