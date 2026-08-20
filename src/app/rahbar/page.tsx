import Link from "next/link";

import { db } from "@/lib/db";
import { talabRahbar } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { BoshHolat, Nishoncha, Quti, Tugma } from "@/components/ui";
import { MUAMMO_HOLATI, MUAMMO_HOLATI_RANGI, sanaMatni } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { yangiMuammoYarat } from "./actions";

export default async function RahbarBoshSahifa() {
  const rahbar = await talabRahbar();

  const muammolar = await db.problem.findMany({
    where: { organizationId: rahbar.organizationId },
    include: {
      category: { select: { name: true } },
      _count: { select: { supporters: true, attachments: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const qoralamalar = muammolar.filter((m) => m.status === "DRAFT");
  const yuborilganlar = muammolar.filter((m) => m.status !== "DRAFT");
  const halQilingan = muammolar.filter((m) => m.status === "RESOLVED").length;
  const jamiSoat = muammolar.reduce((s, m) => s + m.monthlyHoursLost, 0);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Mening muammolarim"
        izoh={rahbar.organizationName ?? undefined}
        amal={
          <form action={yangiMuammoYarat}>
            <Tugma type="submit">Yangi muammo qo'shish</Tugma>
          </form>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { yorliq: "Jami muammo", qiymat: String(muammolar.length) },
          { yorliq: "Qoralama", qiymat: String(qoralamalar.length) },
          { yorliq: "Hal qilindi", qiymat: String(halQilingan) },
          { yorliq: "Oyiga yo'qotish", qiymat: soatMatni(jamiSoat) },
        ].map((k) => (
          <div key={k.yorliq} className="rounded-xl border border-chegara bg-yuza px-4 py-3">
            <p className="text-xs text-matn-ikkilamchi">{k.yorliq}</p>
            <p className="mt-0.5 text-xl font-semibold text-matn">{k.qiymat}</p>
          </div>
        ))}
      </div>

      {muammolar.length === 0 ? (
        <BoshHolat
          sarlavha="Hali birorta muammo kiritilmagan"
          izoh="Tashkilotingizdagi kundalik ishni sekinlashtirayotgan biror jarayonni tasvirlab bering. Texnik bilim kerak emas — tizim sizga oddiy savollar beradi."
          amal={
            <form action={yangiMuammoYarat}>
              <Tugma type="submit">Birinchi muammoni qo'shish</Tugma>
            </form>
          }
        />
      ) : (
        <div className="space-y-8">
          {qoralamalar.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
                Tugallanmagan qoralamalar
              </h2>
              <div className="space-y-2">
                {qoralamalar.map((m) => (
                  <Link
                    key={m.id}
                    href={`/rahbar/muammo/${m.id}/1`}
                    className="block transition-colors hover:border-asosiy/40"
                  >
                    <Quti className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-matn">
                          {m.title || "Nomsiz qoralama"}
                        </p>
                        <p className="mt-0.5 text-sm text-matn-uchinchi">
                          {m.refCode} · oxirgi o'zgarish {sanaMatni(m.updatedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="w-28">
                          <div className="mb-1 flex justify-between text-xs text-matn-ikkilamchi">
                            <span>To'liqlik</span>
                            <span className="tabular-nums">{m.completeness}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-yuza-2">
                            <div
                              className="h-full rounded-full bg-asosiy transition-all"
                              style={{ width: `${m.completeness}%` }}
                            />
                          </div>
                        </div>
                        <Nishoncha className={MUAMMO_HOLATI_RANGI.DRAFT}>
                          Davom ettirish
                        </Nishoncha>
                      </div>
                    </Quti>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {yuborilganlar.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-matn-ikkilamchi">
                Yuborilgan muammolar
              </h2>
              <div className="space-y-2">
                {yuborilganlar.map((m) => (
                  <Link key={m.id} href={`/rahbar/muammo/${m.id}/korish`} className="block">
                    <Quti className="p-4 transition-colors hover:border-asosiy/40">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-matn">{m.title}</p>
                          <p className="mt-1 text-sm text-matn-uchinchi">
                            {m.refCode} · {m.category.name}
                          </p>
                        </div>
                        <Nishoncha className={MUAMMO_HOLATI_RANGI[m.status]}>
                          {MUAMMO_HOLATI[m.status]}
                        </Nishoncha>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-matn-ikkilamchi">
                        <span>
                          Oyiga yo'qotish:{" "}
                          <strong className="text-matn">{soatMatni(m.monthlyHoursLost)}</strong>
                        </span>
                        {m._count.supporters > 0 && (
                          <span>
                            Yana{" "}
                            <strong className="text-matn">{m._count.supporters} ta tashkilot</strong>{" "}
                            shu muammoni qo'llab-quvvatladi
                          </span>
                        )}
                        {m._count.attachments > 0 && (
                          <span>{m._count.attachments} ta fayl</span>
                        )}
                      </div>

                      {m.status === "REJECTED" && m.moderationNote && (
                        <p className="mt-3 rounded-lg bg-xato-yuza px-3 py-2 text-sm text-xato">
                          <strong>Rad etish sababi:</strong> {m.moderationNote}
                        </p>
                      )}
                    </Quti>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
