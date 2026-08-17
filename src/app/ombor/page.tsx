import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { MuammoQatori } from "@/components/muammo-qatori";
import { BoshHolat, Kiritish, Tanlov, Tugma } from "@/components/ui";
import { HUDUD, SHOSHILINCHLIK, variantlar } from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import type { Prisma } from "@/generated/prisma/client";
import type { Region, Urgency } from "@/generated/prisma/enums";

export const metadata: Metadata = { title: "Muammolar ombori" };

/** Omborda ko'rinadigan holatlar — qoralama va rad etilganlar bu yerga tushmaydi. */
const OMBORDAGI = ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] as const;

const SARALASH = {
  tasir: "Eng ta'sirli",
  talab: "Eng ko'p tashkilotda",
  vaqt: "Eng ko'p vaqt yo'qotadigan",
  yangi: "Eng yangi",
} as const;
type SaralashTuri = keyof typeof SARALASH;

function saralashTartibi(t: SaralashTuri): Prisma.ProblemOrderByWithRelationInput[] {
  switch (t) {
    case "talab":
      return [{ supporters: { _count: "desc" } }, { impactScore: "desc" }];
    case "vaqt":
      return [{ monthlyHoursLost: "desc" }];
    case "yangi":
      return [{ approvedAt: "desc" }, { createdAt: "desc" }];
    default:
      return [{ impactScore: "desc" }, { createdAt: "desc" }];
  }
}

export default async function OmborSahifasi(props: PageProps<"/ombor">) {
  const q = await props.searchParams;
  const matn = typeof q.q === "string" ? q.q.trim() : "";
  const soha = typeof q.soha === "string" ? q.soha : "";
  const hudud = typeof q.hudud === "string" ? (q.hudud as Region) : "";
  const shoshilinch = typeof q.shoshilinch === "string" ? (q.shoshilinch as Urgency) : "";
  const faqatOchiq = q.ochiq === "1";
  const saralash: SaralashTuri =
    typeof q.saralash === "string" && q.saralash in SARALASH
      ? (q.saralash as SaralashTuri)
      : "tasir";

  const shart: Prisma.ProblemWhereInput = {
    status: faqatOchiq ? "APPROVED" : { in: [...OMBORDAGI] },
    // Dublikat sifatida birlashtirilganlar ro'yxatda alohida chiqmaydi
    canonicalId: null,
    ...(soha ? { categoryId: soha } : {}),
    ...(hudud ? { organization: { region: hudud } } : {}),
    ...(shoshilinch ? { urgency: shoshilinch } : {}),
    ...(matn
      ? {
          OR: [
            { title: { contains: matn, mode: "insensitive" } },
            { description: { contains: matn, mode: "insensitive" } },
            { refCode: { contains: matn, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [muammolar, turkumlar, jami] = await Promise.all([
    db.problem.findMany({
      where: shart,
      orderBy: saralashTartibi(saralash),
      take: 100,
      include: {
        category: { select: { name: true } },
        organization: { select: { name: true, region: true } },
        _count: { select: { supporters: true, attachments: true } },
        assignments: {
          where: { releasedAt: null },
          select: { developer: { select: { fullName: true } } },
          take: 1,
        },
      },
    }),
    db.category.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.problem.aggregate({
      where: { status: { in: [...OMBORDAGI] }, canonicalId: null },
      _sum: { monthlyHoursLost: true },
      _count: true,
    }),
  ]);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Muammolar ombori"
        izoh={`${jami._count} ta muammo · birgalikda oyiga ${soatMatni(jami._sum.monthlyHoursLost ?? 0)} yo'qotilmoqda`}
      />

      <form method="get" className="mb-6 rounded-xl border border-chegara bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="q" className="mb-1 block text-xs font-medium text-matn-ikkilamchi">
              Qidiruv
            </label>
            <Kiritish
              id="q"
              name="q"
              defaultValue={matn}
              placeholder="Kalit so'z yoki muammo raqami"
            />
          </div>

          <div>
            <label htmlFor="soha" className="mb-1 block text-xs font-medium text-matn-ikkilamchi">
              Soha
            </label>
            <Tanlov id="soha" name="soha" defaultValue={soha}>
              <option value="">Barchasi</option>
              {turkumlar.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Tanlov>
          </div>

          <div>
            <label htmlFor="hudud" className="mb-1 block text-xs font-medium text-matn-ikkilamchi">
              Hudud
            </label>
            <Tanlov id="hudud" name="hudud" defaultValue={hudud}>
              <option value="">Barchasi</option>
              {variantlar(HUDUD).map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </Tanlov>
          </div>

          <div>
            <label
              htmlFor="shoshilinch"
              className="mb-1 block text-xs font-medium text-matn-ikkilamchi"
            >
              Shoshilinchlik
            </label>
            <Tanlov id="shoshilinch" name="shoshilinch" defaultValue={shoshilinch}>
              <option value="">Barchasi</option>
              {variantlar(SHOSHILINCHLIK).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Tanlov>
          </div>

          <div>
            <label
              htmlFor="saralash"
              className="mb-1 block text-xs font-medium text-matn-ikkilamchi"
            >
              Saralash
            </label>
            <Tanlov id="saralash" name="saralash" defaultValue={saralash}>
              {(Object.keys(SARALASH) as SaralashTuri[]).map((k) => (
                <option key={k} value={k}>
                  {SARALASH[k]}
                </option>
              ))}
            </Tanlov>
          </div>

          <div className="flex items-end gap-3 lg:col-span-2">
            <label className="flex h-11 items-center gap-2 text-sm text-matn">
              <input
                type="checkbox"
                name="ochiq"
                value="1"
                defaultChecked={faqatOchiq}
                className="size-4 accent-[var(--color-asosiy)]"
              />
              Faqat hali hech kim olmagan
            </label>
            <Tugma type="submit" korinish="ikkilamchi">
              Qo'llash
            </Tugma>
          </div>
        </div>
      </form>

      {muammolar.length === 0 ? (
        <BoshHolat
          sarlavha="Bu shartlarga mos muammo topilmadi"
          izoh="Filtrlarni kengaytirib ko'ring yoki qidiruv so'zini o'zgartiring."
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-matn-ikkilamchi">
            {muammolar.length} ta muammo ko'rsatilmoqda
            {muammolar.length === 100 && " (eng yuqoridagi 100 tasi)"}
          </p>
          <div className="space-y-2.5">
            {muammolar.map((m) => (
              <MuammoQatori key={m.id} muammo={m} yol={`/ombor/${m.id}`} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
