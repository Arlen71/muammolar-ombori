import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Nishoncha, Quti } from "@/components/ui";
import { FOYDALANUVCHI_HOLATI, ROL, sanaMatni, telefonMatni, variantlar } from "@/lib/labels";
import { FoydalanuvchiFormasi, ParolTiklashTugmasi } from "./foydalanuvchi-formasi";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

const HOLAT_RANGI = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  BLOCKED: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

export default async function FoydalanuvchilarSahifasi() {
  const [foydalanuvchilar, tashkilotlar] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      include: { organization: { select: { name: true } } },
    }),
    db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Foydalanuvchilar"
        izoh="Tizimga kirish huquqini faqat administrator beradi — o'z-o'zidan ro'yxatdan o'tish yo'q."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-2.5">
          {foydalanuvchilar.map((f) => (
            <Quti key={f.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-matn">{f.fullName}</p>
                  <p className="mt-0.5 text-sm text-matn-ikkilamchi">
                    {telefonMatni(f.phone)}
                    {f.position ? ` · ${f.position}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-matn-uchinchi">
                    {f.organization?.name ?? "Tashkilotga biriktirilmagan"} · yaratilgan{" "}
                    {sanaMatni(f.createdAt)}
                    {f.lastLoginAt ? ` · oxirgi kirish ${sanaMatni(f.lastLoginAt)}` : " · hali kirmagan"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Nishoncha>{ROL[f.role]}</Nishoncha>
                  <Nishoncha className={HOLAT_RANGI[f.status]}>
                    {FOYDALANUVCHI_HOLATI[f.status]}
                  </Nishoncha>
                </div>
              </div>
              <div className="mt-3 border-t border-chegara pt-3">
                <ParolTiklashTugmasi userId={f.id} />
              </div>
            </Quti>
          ))}
        </div>

        <div>
          <Quti className="p-5">
            <h2 className="mb-4 font-medium text-matn">Yangi akkaunt yaratish</h2>
            <FoydalanuvchiFormasi rollar={variantlar(ROL)} tashkilotlar={tashkilotlar} />
          </Quti>
        </div>
      </div>
    </>
  );
}
