"use client";

import { useActionState, useState } from "react";

import { qollabQuvvatla, qollabQuvvatlashniBekorQil } from "./actions";
import { Kiritish, Tugma, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

export function QollabTugmasi({
  muammoId,
  qollabQildimi,
}: {
  muammoId: string;
  qollabQildimi: boolean;
}) {
  const [qoshHolati, qoshAmali] = useActionState<AmalNatijasi, FormData>(qollabQuvvatla, {});
  const [bekorHolati, bekorAmali] = useActionState<AmalNatijasi, FormData>(
    qollabQuvvatlashniBekorQil,
    {}
  );
  const [ochiq, setOchiq] = useState(false);

  if (qollabQildimi) {
    return (
      <form action={bekorAmali} className="flex items-center gap-3">
        <input type="hidden" name="muammoId" value={muammoId} />
        <span className="inline-flex items-center rounded-lg bg-muvaffaqiyat-yuza px-3 py-1.5 text-sm font-medium text-muvaffaqiyat ring-1 ring-inset ring-muvaffaqiyat-chegara">
          Bizda ham shu muammo bor
        </span>
        <button
          type="submit"
          className="text-sm text-matn-uchinchi underline-offset-2 hover:text-matn hover:underline"
        >
          Bekor qilish
        </button>
        {bekorHolati.xato && <span className="text-sm text-xato">{bekorHolati.xato}</span>}
      </form>
    );
  }

  if (!ochiq) {
    return (
      <div className="space-y-2">
        {qoshHolati.xato && <Xabar turi="xato">{qoshHolati.xato}</Xabar>}
        {qoshHolati.muvaffaqiyat && <Xabar turi="muvaffaqiyat">{qoshHolati.muvaffaqiyat}</Xabar>}
        <Tugma korinish="ikkilamchi" olcham="kichik" onClick={() => setOchiq(true)}>
          Bizda ham shu muammo bor
        </Tugma>
      </div>
    );
  }

  return (
    <form action={qoshAmali} className="space-y-2">
      <input type="hidden" name="muammoId" value={muammoId} />
      {qoshHolati.xato && <Xabar turi="xato">{qoshHolati.xato}</Xabar>}
      <Kiritish
        name="izoh"
        placeholder="Sizda bu qanday ko'rinishda? (ixtiyoriy)"
        className="max-w-lg"
      />
      <div className="flex gap-2">
        <Yuborish kutish="Saqlanmoqda…" olcham="kichik">
          Qo'shilaman
        </Yuborish>
        <Tugma type="button" korinish="shaffof" olcham="kichik" onClick={() => setOchiq(false)}>
          Bekor qilish
        </Tugma>
      </div>
    </form>
  );
}
