import Link from "next/link";

import { Nishoncha } from "@/components/ui";
import {
  HUDUD,
  MUAMMO_HOLATI,
  MUAMMO_HOLATI_RANGI,
  SHOSHILINCHLIK,
  SHOSHILINCHLIK_RANGI,
  sonMatni,
} from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import type { ProblemStatus, Region, Urgency } from "@/generated/prisma/enums";

export type QatorMuammosi = {
  id: string;
  refCode: string;
  title: string;
  status: ProblemStatus;
  urgency: Urgency;
  monthlyHoursLost: number;
  citizensAffected: number | null;
  category: { name: string };
  organization: { name: string; region: Region };
  _count: { supporters: number; attachments: number };
  assignments?: { developer: { fullName: string } }[];
};

/** Ombordagi va ro'yxatlardagi bitta muammo qatori. */
export function MuammoQatori({
  muammo,
  yol,
}: {
  muammo: QatorMuammosi;
  yol: string;
}) {
  const olgan = muammo.assignments?.[0]?.developer.fullName;

  return (
    <Link
      href={yol}
      className="block rounded-xl border border-chegara bg-white p-4 transition-colors hover:border-asosiy/50 hover:bg-asosiy-ochiq/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium leading-snug text-matn">{muammo.title}</h3>
          <p className="mt-1 text-sm text-matn-uchinchi">
            {muammo.organization.name} · {HUDUD[muammo.organization.region]} ·{" "}
            {muammo.category.name}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Nishoncha className={SHOSHILINCHLIK_RANGI[muammo.urgency]}>
            {SHOSHILINCHLIK[muammo.urgency]}
          </Nishoncha>
          <Nishoncha className={MUAMMO_HOLATI_RANGI[muammo.status]}>
            {MUAMMO_HOLATI[muammo.status]}
          </Nishoncha>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <span className="text-matn-ikkilamchi">
          Oyiga <strong className="text-matn">{soatMatni(muammo.monthlyHoursLost)}</strong>{" "}
          yo'qotiladi
        </span>

        {muammo._count.supporters > 0 && (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 ring-1 ring-inset ring-emerald-200">
            {muammo._count.supporters + 1} ta tashkilotda shu muammo bor
          </span>
        )}

        {muammo.citizensAffected ? (
          <span className="text-matn-ikkilamchi">
            {sonMatni(muammo.citizensAffected)} fuqaroga ta'sir qiladi
          </span>
        ) : null}

        {muammo._count.attachments > 0 && (
          <span className="text-matn-uchinchi">{muammo._count.attachments} ta fayl</span>
        )}

        {olgan && <span className="text-violet-700">Oldi: {olgan}</span>}

        <span className="ml-auto text-xs text-matn-uchinchi">{muammo.refCode}</span>
      </div>
    </Link>
  );
}
