"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { dasturchiniBlokla, dasturchiniTasdiqla } from "../actions";
import { Kiritish, Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function Yuborish({
  matn,
  kutish,
  korinish,
}: {
  matn: string;
  kutish: string;
  korinish?: "asosiy" | "xavfli";
}) {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" korinish={korinish} olcham="kichik" disabled={pending}>
      {pending ? kutish : matn}
    </Tugma>
  );
}

export function DasturchiAmali({
  userId,
  holat,
}: {
  userId: string;
  holat: "PENDING" | "ACTIVE" | "BLOCKED";
}) {
  const [tasdiq, tasdiqAmali] = useActionState<AmalNatijasi, FormData>(
    dasturchiniTasdiqla,
    {}
  );
  const [blok, blokAmali] = useActionState<AmalNatijasi, FormData>(dasturchiniBlokla, {});
  const [blokKorinsin, setBlokKorinsin] = useState(false);

  if (tasdiq.muvaffaqiyat) return <Xabar turi="muvaffaqiyat">{tasdiq.muvaffaqiyat}</Xabar>;
  if (blok.muvaffaqiyat) return <Xabar turi="malumot">{blok.muvaffaqiyat}</Xabar>;

  return (
    <div className="space-y-2">
      {tasdiq.xato && <Xabar turi="xato">{tasdiq.xato}</Xabar>}
      {blok.xato && <Xabar turi="xato">{blok.xato}</Xabar>}

      {blokKorinsin ? (
        <form action={blokAmali} className="space-y-2">
          <input type="hidden" name="userId" value={userId} />
          <Kiritish name="sabab" placeholder="Bloklash sababi (ixtiyoriy)" />
          <div className="flex gap-2">
            <Yuborish matn="Ha, bloklash" kutish="Bloklanmoqda…" korinish="xavfli" />
            <Tugma
              type="button"
              korinish="shaffof"
              olcham="kichik"
              onClick={() => setBlokKorinsin(false)}
            >
              Bekor qilish
            </Tugma>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {holat !== "ACTIVE" && (
            <form action={tasdiqAmali}>
              <input type="hidden" name="userId" value={userId} />
              <Yuborish matn="Tasdiqlash" kutish="Tasdiqlanmoqda…" />
            </form>
          )}
          {holat !== "BLOCKED" && (
            <Tugma
              type="button"
              korinish="ikkilamchi"
              olcham="kichik"
              onClick={() => setBlokKorinsin(true)}
            >
              Bloklash
            </Tugma>
          )}
        </div>
      )}
    </div>
  );
}
