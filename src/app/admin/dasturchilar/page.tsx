import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { BoshHolat, Nishoncha, Quti } from "@/components/ui";
import { FOYDALANUVCHI_HOLATI, sanaMatni, telefonMatni } from "@/lib/labels";
import { DasturchiAmali } from "./dasturchi-amali";

export const metadata: Metadata = { title: "Dasturchilar" };

const HOLAT_RANGI = {
  PENDING: "bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara",
  ACTIVE: "bg-muvaffaqiyat-yuza text-muvaffaqiyat ring-muvaffaqiyat-chegara",
  BLOCKED: "bg-xato-yuza text-xato ring-xato-chegara",
} as const;

export default async function DasturchilarSahifasi() {
  const dasturchilar = await db.user.findMany({
    where: { role: "DEVELOPER" },
    // Tasdiq kutayotganlar birinchi
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      developerProfile: true,
      _count: { select: { assignments: true } },
    },
  });

  const kutayotganlar = dasturchilar.filter((d) => d.status === "PENDING");

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Dasturchilar"
        izoh={
          kutayotganlar.length > 0
            ? `${kutayotganlar.length} ta ariza tasdiqlanishini kutmoqda`
            : `${dasturchilar.length} ta dasturchi`
        }
      />

      {dasturchilar.length === 0 ? (
        <BoshHolat
          sarlavha="Dasturchilar yo'q"
          izoh="«Foydalanuvchilar» bo'limidan dasturchi akkaunti yarating."
        />
      ) : (
        <div className="space-y-3">
          {dasturchilar.map((d) => (
            <Quti key={d.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-matn">{d.fullName}</p>
                  <p className="mt-0.5 text-sm text-matn-ikkilamchi">
                    {telefonMatni(d.phone)}
                    {d.email ? ` · ${d.email}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-matn-uchinchi">
                    Ro'yxatdan o'tgan: {sanaMatni(d.createdAt)} ·{" "}
                    {d._count.assignments} ta muammo olgan
                  </p>
                </div>
                <Nishoncha className={HOLAT_RANGI[d.status]}>
                  {FOYDALANUVCHI_HOLATI[d.status]}
                </Nishoncha>
              </div>

              {d.developerProfile?.skills.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {d.developerProfile.skills.map((s) => (
                    <li key={s}>
                      <Nishoncha>{s}</Nishoncha>
                    </li>
                  ))}
                </ul>
              ) : null}

              {d.developerProfile?.about && (
                <p className="mt-3 text-sm text-matn-ikkilamchi">{d.developerProfile.about}</p>
              )}

              <div className="mt-4 border-t border-chegara pt-4">
                <DasturchiAmali userId={d.id} holat={d.status} />
              </div>
            </Quti>
          ))}
        </div>
      )}
    </>
  );
}
