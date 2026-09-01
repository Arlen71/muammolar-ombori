import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import {
  BoshHolat,
  Jadval,
  JadvalBosh,
  JadvalKatak,
  JadvalQator,
  JadvalSarlavha,
  JadvalTana,
  Nishoncha,
  Quti,
  QutiSarlavha,
  Xabar,
} from "@/components/ui";
import { MUAMMO_HOLATI, MUAMMO_HOLATI_RANGI, sanaVaqtMatni } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { ModeratsiyaAmali } from "./moderatsiya-amali";

export const metadata: Metadata = { title: "So'nggi qo'shilganlar" };

export default async function ModeratsiyaSahifasi() {
  /*
    Moderatsiya navbati o'rniga — OQIM.

    Muammo endi yuborilishi bilan omborga tushadi, administrator tasdig'i
    kutilmaydi. Bu sahifaning vazifasi o'zgardi: to'sish emas, kuzatish.
    Administrator nima kelayotganini ko'radi va faqat kerak bo'lganda
    aralashadi.
  */
  const [songgilar, arxivdagilar] = await Promise.all([
    db.problem.findMany({
      where: { status: { notIn: ["DRAFT", "ARCHIVED"] } },
      orderBy: { approvedAt: "desc" },
      take: 25,
      select: {
        id: true,
        refCode: true,
        title: true,
        status: true,
        approvedAt: true,
        monthlyHoursLost: true,
        completeness: true,
        organization: { select: { name: true, district: true } },
        _count: { select: { suhbatlar: true } },
      },
    }),
    db.problem.findMany({
      where: { status: "ARCHIVED" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        refCode: true,
        title: true,
        moderationNote: true,
        organization: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="So'nggi qo'shilganlar"
        izoh="Muammolar tasdiqsiz omborga tushadi. Bu yerda oqimni kuzatasiz va kerak bo'lsa aralashasiz."
      />

      <Xabar turi="malumot" className="mb-6">
        Kartochkada kamchilik bo&apos;lsa uni <strong>dasturchi suhbat orqali</strong>{" "}
        rahbardan so&apos;raydi — bu sizning taxmin qilishingizdan aniqroq. Sizning
        vazifangiz: nomaqbul yoki takroriy yozuvni arxivga olish.
      </Xabar>

      {songgilar.length === 0 ? (
        <BoshHolat
          sarlavha="Hali muammo yuborilmagan"
          izoh="Rahbarlar muammo kiritishi bilan ular shu yerda paydo bo'ladi."
        />
      ) : (
        <Jadval>
          <JadvalBosh>
            <JadvalQator className="hover:bg-transparent">
              <JadvalSarlavha className="w-full">Muammo</JadvalSarlavha>
              <JadvalSarlavha>Tashkilot</JadvalSarlavha>
              <JadvalSarlavha>Holat</JadvalSarlavha>
              <JadvalSarlavha className="text-right">To&apos;liqlik</JadvalSarlavha>
              <JadvalSarlavha className="text-right">Suhbat</JadvalSarlavha>
              <JadvalSarlavha>Qo&apos;shilgan</JadvalSarlavha>
              <JadvalSarlavha>Amal</JadvalSarlavha>
            </JadvalQator>
          </JadvalBosh>

          <JadvalTana>
            {songgilar.map((m) => (
              <JadvalQator key={m.id}>
                <JadvalKatak>
                  <Link
                    href={`/ombor/${m.id}`}
                    className="font-medium text-matn hover:text-asosiy hover:underline"
                  >
                    {m.title}
                  </Link>
                  <span className="mt-0.5 block font-mono text-xs text-matn-uchinchi">
                    {m.refCode} · {soatMatni(m.monthlyHoursLost)}
                  </span>
                </JadvalKatak>

                <JadvalKatak className="max-w-48">
                  <span className="block truncate">{m.organization.name}</span>
                  {m.organization.district && (
                    <span className="block truncate text-xs text-matn-uchinchi">
                      {m.organization.district}
                    </span>
                  )}
                </JadvalKatak>

                <JadvalKatak>
                  <Nishoncha className={MUAMMO_HOLATI_RANGI[m.status]}>
                    {MUAMMO_HOLATI[m.status]}
                  </Nishoncha>
                </JadvalKatak>

                <JadvalKatak className="text-right tabular-nums">
                  {/*
                    To'liqlik endi ayniqsa muhim: uni tekshiradigan
                    moderator yo'q. Past ko'rsatkich — dasturchi savol
                    berishiga to'g'ri keladigan kartochka belgisi.
                  */}
                  <span
                    className={
                      m.completeness < 60 ? "font-medium text-ogohlantirish" : undefined
                    }
                  >
                    {m.completeness}%
                  </span>
                </JadvalKatak>

                <JadvalKatak className="text-right tabular-nums">
                  {m._count.suhbatlar > 0 ? (
                    m._count.suhbatlar
                  ) : (
                    <span className="text-matn-uchinchi">—</span>
                  )}
                </JadvalKatak>

                <JadvalKatak className="whitespace-nowrap text-sm text-matn-ikkilamchi">
                  {m.approvedAt ? sanaVaqtMatni(m.approvedAt) : "—"}
                </JadvalKatak>

                <JadvalKatak>
                  <ModeratsiyaAmali muammoId={m.id} arxivdami={false} />
                </JadvalKatak>
              </JadvalQator>
            ))}
          </JadvalTana>
        </Jadval>
      )}

      {arxivdagilar.length > 0 && (
        <Quti className="mt-6">
          <QutiSarlavha
            sarlavha="Arxivdagilar"
            izoh="Ombordan olib qo'yilgan. O'chirilmagan — tarixi va yozishmalari joyida."
            className="mb-4"
          />
          <ul className="space-y-3">
            {arxivdagilar.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-chegara px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-matn">{m.title}</p>
                  <p className="mt-0.5 text-sm text-matn-uchinchi">
                    <span className="font-mono text-xs">{m.refCode}</span> ·{" "}
                    {m.organization.name}
                  </p>
                  {m.moderationNote && (
                    <p className="mt-1 text-sm text-matn-ikkilamchi">
                      Sabab: {m.moderationNote}
                    </p>
                  )}
                </div>
                <ModeratsiyaAmali muammoId={m.id} arxivdami />
              </li>
            ))}
          </ul>
        </Quti>
      )}
    </>
  );
}
