import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { BoshHolat, Kiritish, Nishoncha, Quti, Tugma } from "@/components/ui";
import { HUDUD, MUAMMO_HOLATI, MUAMMO_HOLATI_RANGI } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { QollabTugmasi } from "./qollab-tugmasi";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Boshqa tashkilotlarda" };

export default async function BoshqalarSahifasi(props: PageProps<"/rahbar/boshqalar">) {
  const rahbar = await talabRahbar();
  const q = await props.searchParams;
  const matn = typeof q.q === "string" ? q.q.trim() : "";

  const shart: Prisma.ProblemWhereInput = {
    status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] },
    canonicalId: null,
    organizationId: { not: rahbar.organizationId },
    ...(matn
      ? {
          OR: [
            { title: { contains: matn, mode: "insensitive" } },
            { description: { contains: matn, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const muammolar = await db.problem.findMany({
    where: shart,
    orderBy: [{ impactScore: "desc" }],
    take: 50,
    include: {
      category: { select: { name: true } },
      organization: { select: { name: true, region: true } },
      supporters: { select: { organizationId: true } },
      _count: { select: { supporters: true } },
    },
  });

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Boshqa tashkilotlarda"
        izoh="Shu muammolardan qaysi biri sizda ham bor? Belgilab qo'ying — dasturchilar muammo nechta tashkilotda uchrashini ko'radi va uni birinchi navbatda hal qiladi."
      />

      <form method="get" className="mb-6 flex max-w-xl gap-2">
        <Kiritish name="q" defaultValue={matn} placeholder="Kalit so'z bilan qidirish" />
        <Tugma type="submit" korinish="ikkilamchi">
          Qidirish
        </Tugma>
      </form>

      {muammolar.length === 0 ? (
        <BoshHolat
          sarlavha="Muammo topilmadi"
          izoh="Boshqa tashkilotlar hali muammo kiritmagan yoki qidiruv shartingizga mos kelmadi."
        />
      ) : (
        <div className="space-y-3">
          {muammolar.map((m) => {
            const qollabQildimi = m.supporters.some(
              (s) => s.organizationId === rahbar.organizationId
            );
            return (
              <Quti key={m.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium leading-snug text-matn">{m.title}</h2>
                    <p className="mt-1 text-sm text-matn-uchinchi">
                      {m.organization.name} · {HUDUD[m.organization.region]} · {m.category.name}
                    </p>
                  </div>
                  <Nishoncha className={MUAMMO_HOLATI_RANGI[m.status]}>
                    {MUAMMO_HOLATI[m.status]}
                  </Nishoncha>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-matn-ikkilamchi">
                  {m.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-matn-ikkilamchi">
                  <span>
                    O'sha tashkilotda oyiga{" "}
                    <strong className="text-matn">{soatMatni(m.monthlyHoursLost)}</strong>
                  </span>
                  {m._count.supporters > 0 && (
                    <span className="text-emerald-700">
                      Yana {m._count.supporters} ta tashkilot qo'shilgan
                    </span>
                  )}
                </div>

                <div className="mt-4 border-t border-chegara pt-4">
                  <QollabTugmasi muammoId={m.id} qollabQildimi={qollabQildimi} />
                </div>
              </Quti>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-matn-uchinchi">
        O'z tashkilotingiz muammolari{" "}
        <Link href="/rahbar" className="text-asosiy hover:underline">
          «Mening muammolarim»
        </Link>{" "}
        bo'limida
      </p>
    </>
  );
}
