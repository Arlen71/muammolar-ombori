import Link from "next/link";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Quti } from "@/components/ui";
import { MUAMMO_HOLATI, sanaVaqtMatni } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";

export default async function AdminBoshSahifa() {
  /*
    Muammolar bo'yicha barcha ko'rsatkich bitta `groupBy` bilan olinadi.
    Ilgari bu yerda 7 ta alohida `count`/`aggregate` bor edi — har biri baza
    bilan alohida aylanma. Bitta so'rov ham tezroq, ham ulanishlar hovuzini
    band qilmaydi.
  */
  const holatlarBoyicha = await db.problem.groupBy({
    by: ["status"],
    where: { canonicalId: null },
    _count: { _all: true },
    _sum: { monthlyHoursLost: true },
  });

  const soni = (...holatlar: string[]) =>
    holatlarBoyicha
      .filter((h) => holatlar.includes(h.status))
      .reduce((s, h) => s + h._count._all, 0);

  const moderatsiyada = soni("SUBMITTED");
  const omborda = soni("APPROVED", "TAKEN", "SOLUTION_OFFERED");
  const halQilingan = soni("RESOLVED");
  const jamiSoat = holatlarBoyicha
    .filter((h) => ["APPROVED", "TAKEN", "SOLUTION_OFFERED"].includes(h.status))
    .reduce((s, h) => s + (h._sum.monthlyHoursLost ?? 0), 0);

  const [tasdiqKutayotganDasturchilar, tashkilotlar, sonngiAmallar] = await Promise.all([
    db.user.count({ where: { role: "DEVELOPER", status: "PENDING" } }),
    db.organization.count(),
    db.problemStatusHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { fullName: true } },
        problem: { select: { id: true, refCode: true, title: true } },
      },
    }),
  ]);

  const ishlar = [
    {
      yol: "/admin/moderatsiya",
      matn: "Moderatsiya kutayotgan muammo",
      soni: moderatsiyada,
    },
    {
      yol: "/admin/dasturchilar",
      matn: "Tasdiq kutayotgan dasturchi",
      soni: tasdiqKutayotganDasturchilar,
    },
  ];

  return (
    <>
      <SahifaSarlavhasi sarlavha="Boshqaruv paneli" />

      {ishlar.some((i) => i.soni > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
            Sizning e'tiboringizni kutmoqda
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {ishlar
              .filter((i) => i.soni > 0)
              .map((i) => (
                <Link
                  key={i.yol}
                  href={i.yol}
                  className="kotarilish flex items-center justify-between rounded-2xl border border-ogohlantirish-chegara bg-ogohlantirish-yuza px-5 py-4"
                >
                  <span className="text-sm font-medium text-ogohlantirish">{i.matn}</span>
                  <span className="font-display text-2xl font-bold tabular-nums text-ogohlantirish">
                    {i.soni}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { yorliq: "Omborda", qiymat: String(omborda) },
          { yorliq: "Hal qilingan", qiymat: String(halQilingan) },
          { yorliq: "Tashkilotlar", qiymat: String(tashkilotlar) },
          { yorliq: "Oyiga yo'qotish", qiymat: soatMatni(jamiSoat) },
        ].map((k) => (
          <div key={k.yorliq} className="rounded-2xl border border-chegara bg-yuza px-4 py-3">
            <p className="text-xs text-matn-ikkilamchi">{k.yorliq}</p>
            <p className="mt-0.5 font-display text-xl font-bold text-matn">{k.qiymat}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">So'nggi harakatlar</h2>
        {sonngiAmallar.length === 0 ? (
          <Quti className="text-sm text-matn-ikkilamchi">Hozircha harakat yo'q.</Quti>
        ) : (
          <ol className="space-y-2">
            {sonngiAmallar.map((h) => (
              <li key={h.id}>
                <Quti className="flex flex-wrap items-baseline justify-between gap-2 p-3.5 text-sm">
                  <span className="min-w-0 text-matn">
                    <strong>{MUAMMO_HOLATI[h.toStatus]}</strong> — {h.problem.title}
                  </span>
                  <span className="shrink-0 text-xs text-matn-uchinchi">
                    {h.actor.fullName} · {sanaVaqtMatni(h.createdAt)}
                  </span>
                </Quti>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
