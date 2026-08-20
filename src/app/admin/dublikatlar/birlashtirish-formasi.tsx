"use client";

import { useActionState } from "react";

import { dublikatniBirlashtir } from "../actions";
import { Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

export function BirlashtirishFormasi({
  takrorId,
  takrorSarlavha,
  asosiyId,
  asosiySarlavha,
}: {
  takrorId: string;
  takrorSarlavha: string;
  asosiyId: string;
  asosiySarlavha: string;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(dublikatniBirlashtir, {});

  if (holat.muvaffaqiyat) {
    return <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>;
  }

  return (
    <form action={amal} className="space-y-2">
      <input type="hidden" name="muammoId" value={takrorId} />
      <input type="hidden" name="asosiyId" value={asosiyId} />
      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
      <p className="text-sm text-matn-ikkilamchi">
        «{takrorSarlavha}» arxivlanadi va uning tashkiloti «{asosiySarlavha}» ni
        qo'llab-quvvatlovchi sifatida qo'shiladi.
      </p>
      <Yuborish kutish="Birlashtirilmoqda…" olcham="kichik">
        Birlashtirish
      </Yuborish>
    </form>
  );
}
