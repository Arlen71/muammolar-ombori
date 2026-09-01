import type { Metadata } from "next";
import Link from "next/link";

import { db } from "@/lib/db";
import { talabKirish } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { BoshHolat, Nishoncha } from "@/components/ui";
import { sanaVaqtMatni } from "@/lib/labels";
import type { Prisma } from "@/generated/prisma/client";

export const metadata: Metadata = { title: "Suhbatlar" };

/**
 * Suhbatlar ro'yxati.
 *
 * Har bir yozishma alohida: bitta muammo bo'yicha har bir dasturchi
 * bilan o'z suhbati bo'ladi. Ro'yxat oxirgi xabar vaqti bo'yicha
 * saralanadi — javob kutayotgani tepada turadi.
 */
export default async function SuhbatlarSahifasi() {
  const joriy = await talabKirish();

  /*
    Kim qaysi suhbatni ko'radi — `suhbat.ts` dagi qoidaning so'rov
    ko'rinishi:
      dasturchi — faqat o'ziniki
      rahbar    — o'z tashkiloti muammolari bo'yicha hammasi
      admin     — hammasi (kuzatuvchi sifatida)
  */
  const shart: Prisma.SuhbatWhereInput =
    joriy.role === "DEVELOPER"
      ? { developerId: joriy.id }
      : joriy.role === "LEADER"
        ? { problem: { organizationId: joriy.organizationId ?? "" } }
        : {};

  const suhbatlar = await db.suhbat.findMany({
    where: shart,
    orderBy: { oxirgiXabarAt: "desc" },
    take: 100,
    select: {
      id: true,
      rahbarOqidi: true,
      dasturchiOqidi: true,
      oxirgiXabarAt: true,
      developer: {
        select: { id: true, fullName: true, avatarPath: true },
      },
      problem: {
        select: { id: true, refCode: true, title: true, organization: { select: { name: true } } },
      },
      xabarlar: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { matn: true, yuboruvchiId: true, fayllar: { select: { id: true } } },
      },
      _count: { select: { xabarlar: true } },
    },
  });

  /*
    O'qilmagan xabarlar soni. Har bir suhbat uchun alohida `count`
    so'rovi o'rniga bitta `groupBy` — suhbatlar soni o'nlab bo'lsa ham
    baza bilan bitta aylanma.
  */
  const oqilmaganlar = new Map<string, number>();
  if (joriy.role !== "ADMIN" && suhbatlar.length > 0) {
    const guruh = await db.suhbatXabari.groupBy({
      by: ["suhbatId"],
      where: {
        yuboruvchiId: { not: joriy.id },
        OR: suhbatlar.map((s) => ({
          suhbatId: s.id,
          createdAt: {
            gt: (joriy.role === "LEADER" ? s.rahbarOqidi : s.dasturchiOqidi) ?? new Date(0),
          },
        })),
      },
      _count: { _all: true },
    });
    for (const g of guruh) oqilmaganlar.set(g.suhbatId, g._count._all);
  }

  const jamiOqilmagan = [...oqilmaganlar.values()].reduce((s, n) => s + n, 0);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Suhbatlar"
        izoh={
          joriy.role === "ADMIN"
            ? "Rahbarlar va dasturchilar o'rtasidagi yozishmalar. Siz kuzatuvchisiz — o'qiysiz, yozmaysiz."
            : jamiOqilmagan > 0
              ? `${jamiOqilmagan} ta o'qilmagan xabar`
              : "Muammo bo'yicha aniqlashtiruvchi savol-javob"
        }
      />

      {suhbatlar.length === 0 ? (
        <BoshHolat
          sarlavha="Hozircha suhbat yo'q"
          izoh={
            joriy.role === "DEVELOPER"
              ? "Ombordagi muammoda tushunarsiz joy bo'lsa, kartochkani ochib «Savol berish» tugmasini bosing."
              : "Dasturchi muammongiz bo'yicha savol bersa, yozishma shu yerda paydo bo'ladi."
          }
        />
      ) : (
        <ul className="space-y-2">
          {suhbatlar.map((s, i) => {
            const oqilmagan = oqilmaganlar.get(s.id) ?? 0;
            const oxirgi = s.xabarlar[0];

            return (
              <li
                key={s.id}
                className="jonlanish"
                style={{ "--jonlanish-tartib": Math.min(i, 8) } as React.CSSProperties}
              >
                <Link
                  href={`/suhbat/${s.id}`}
                  className="kotarilish flex items-start gap-3 rounded-2xl border border-chegara bg-yuza p-4 shadow-1 hover:border-asosiy"
                >
                  <Avatar
                    ism={s.developer.fullName}
                    foydalanuvchiId={s.developer.id}
                    rasmVersiyasi={s.developer.avatarPath?.slice(-12, -4) ?? null}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-matn">
                        {/*
                          Dasturchi uchun "kim bilan" — tashkilot;
                          rahbar va admin uchun — dasturchining ismi.
                          Har kim o'zi bilmaydigan tomonni ko'radi.
                        */}
                        {joriy.role === "DEVELOPER"
                          ? s.problem.organization.name
                          : s.developer.fullName}
                      </p>
                      <span className="text-xs text-matn-uchinchi">
                        {sanaVaqtMatni(s.oxirgiXabarAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-sm text-matn-ikkilamchi">
                      <span className="font-mono text-xs">{s.problem.refCode}</span>{" "}
                      · {s.problem.title}
                    </p>

                    {oxirgi ? (
                      <p className="mt-1.5 truncate text-sm text-matn-uchinchi">
                        {oxirgi.yuboruvchiId === joriy.id && "Siz: "}
                        {oxirgi.matn ||
                          (oxirgi.fayllar.length > 0 ? "📎 Fayl yuborildi" : "")}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-sm text-matn-uchinchi">
                        Hali xabar yozilmagan
                      </p>
                    )}
                  </div>

                  {oqilmagan > 0 && (
                    <Nishoncha className="shrink-0 bg-asosiy text-asosiy-matn ring-asosiy">
                      {oqilmagan}
                    </Nishoncha>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
