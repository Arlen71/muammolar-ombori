import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { BoshHolat, Quti } from "@/components/ui";
import { oxshashMuammolar } from "@/lib/similar";
import { BirlashtirishFormasi } from "./birlashtirish-formasi";

export const metadata: Metadata = { title: "Dublikatlar" };

/** Shu balldan yuqori o'xshashlikdagilar taklif qilinadi. */
const ENG_KAM_OXSHASHLIK = 0.4;

export default async function DublikatlarSahifasi() {
  const muammolar = await db.problem.findMany({
    where: {
      status: { in: ["APPROVED", "TAKEN", "SOLUTION_OFFERED"] },
      canonicalId: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      refCode: true,
      title: true,
      createdAt: true,
      organization: { select: { name: true } },
      _count: { select: { supporters: true } },
    },
  });

  // Har bir muammoga o'xshashlarni topamiz. Bir juftlik ikki marta
  // ko'rsatilmasligi uchun ko'rilgan juftliklarni eslab boramiz.
  const korilgan = new Set<string>();
  const juftliklar: {
    yangi: (typeof muammolar)[number];
    eski: Awaited<ReturnType<typeof oxshashMuammolar>>[number];
  }[] = [];

  for (const m of muammolar) {
    const oxshashlar = await oxshashMuammolar(m.title, {
      chiqarilsin: [m.id],
      soni: 3,
      engKam: ENG_KAM_OXSHASHLIK,
    });
    for (const o of oxshashlar) {
      const kalit = [m.id, o.id].sort().join("|");
      if (korilgan.has(kalit)) continue;
      korilgan.add(kalit);
      juftliklar.push({ yangi: m, eski: o });
    }
  }

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Dublikatlarni birlashtirish"
        izoh="Bir xil muammoni bir necha tashkilot alohida kiritgan bo'lishi mumkin. Ularni birlashtirsangiz, dasturchi muammo nechta tashkilotda uchrashini ko'radi."
      />

      {juftliklar.length === 0 ? (
        <BoshHolat
          sarlavha="O'xshash muammolar topilmadi"
          izoh="Ombordagi muammolar bir-biridan yetarlicha farq qiladi."
        />
      ) : (
        <div className="space-y-4">
          {juftliklar.map(({ yangi, eski }) => (
            <Quti key={`${yangi.id}-${eski.id}`} className="p-5">
              <p className="mb-4 text-sm font-medium text-ogohlantirish">
                {Math.round(eski.oxshashlik * 100)}% o'xshash
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-chegara p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-matn-uchinchi">
                    Yangiroq
                  </p>
                  <p className="mt-1 font-medium text-matn">{yangi.title}</p>
                  <p className="mt-1 text-sm text-matn-uchinchi">
                    {yangi.organization.name} · {yangi.refCode}
                    {yangi._count.supporters > 0 &&
                      ` · ${yangi._count.supporters} ta qo'llab-quvvatlash`}
                  </p>
                </div>

                <div className="rounded-lg border border-chegara p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-matn-uchinchi">
                    Omborda turgan
                  </p>
                  <p className="mt-1 font-medium text-matn">{eski.title}</p>
                  <p className="mt-1 text-sm text-matn-uchinchi">
                    {eski.organizationName} · {eski.refCode}
                    {eski.supporterCount > 0 &&
                      ` · ${eski.supporterCount} ta qo'llab-quvvatlash`}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-4 border-t border-chegara pt-4">
                <BirlashtirishFormasi
                  takrorId={yangi.id}
                  takrorSarlavha={yangi.title}
                  asosiyId={eski.id}
                  asosiySarlavha={eski.title}
                />
              </div>
            </Quti>
          ))}
        </div>
      )}
    </>
  );
}
