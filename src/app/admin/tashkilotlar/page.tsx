import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Quti } from "@/components/ui";
import { HUDUD, TASHKILOT_TURI, variantlar } from "@/lib/labels";
import { TashkilotFormasi } from "./tashkilot-formasi";

export const metadata: Metadata = { title: "Tashkilotlar" };

export default async function TashkilotlarSahifasi() {
  const tashkilotlar = await db.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, problems: true } },
    },
  });

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Tashkilotlar"
        izoh={`${tashkilotlar.length} ta tashkilot ro'yxatga olingan`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-2.5">
          {tashkilotlar.map((t) => (
            <Quti key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-matn">{t.name}</p>
                <p className="mt-0.5 text-sm text-matn-uchinchi">
                  {TASHKILOT_TURI[t.type]} · {HUDUD[t.region]}
                  {t.district ? `, ${t.district}` : ""}
                  {t.stir ? ` · STIR ${t.stir}` : ""}
                </p>
              </div>
              <p className="shrink-0 text-sm text-matn-ikkilamchi">
                {t._count.users} foydalanuvchi · {t._count.problems} muammo
              </p>
            </Quti>
          ))}
        </div>

        <div>
          <Quti className="p-5">
            <h2 className="mb-4 font-medium text-matn">Yangi tashkilot qo'shish</h2>
            <TashkilotFormasi
              turlar={variantlar(TASHKILOT_TURI)}
              hududlar={variantlar(HUDUD)}
            />
          </Quti>
        </div>
      </div>
    </>
  );
}
