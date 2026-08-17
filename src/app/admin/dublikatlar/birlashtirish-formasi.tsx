"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { dublikatniBirlashtir } from "../actions";
import { Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function Yuborish() {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" olcham="kichik" disabled={pending}>
      {pending ? "Birlashtirilmoqda…" : "Birlashtirish"}
    </Tugma>
  );
}

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
      <Yuborish />
    </form>
  );
}
