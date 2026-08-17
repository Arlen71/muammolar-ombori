"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { tashkilotYarat } from "../actions";
import { Kiritish, Maydon, Tanlov, Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function Yuborish() {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" className="w-full" disabled={pending}>
      {pending ? "Qo'shilmoqda…" : "Tashkilotni qo'shish"}
    </Tugma>
  );
}

export function TashkilotFormasi({
  turlar,
  hududlar,
}: {
  turlar: { value: string; label: string }[];
  hududlar: { value: string; label: string }[];
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(tashkilotYarat, {});
  const x = holat.maydonXatolari;

  return (
    <form action={amal} className="space-y-4" noValidate>
      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
      {holat.muvaffaqiyat && <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>}

      <Maydon yorliq="Tashkilot nomi" htmlFor="name" majburiy xato={x?.name}>
        <Kiritish id="name" name="name" placeholder="Chilonzor tumani hokimligi" required />
      </Maydon>

      <Maydon yorliq="Turi" htmlFor="type" majburiy xato={x?.type}>
        <Tanlov id="type" name="type" defaultValue="KHOKIMIYAT">
          {turlar.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Tanlov>
      </Maydon>

      <Maydon yorliq="Hudud" htmlFor="region" majburiy xato={x?.region}>
        <Tanlov id="region" name="region" defaultValue="TASHKENT_CITY">
          {hududlar.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </Tanlov>
      </Maydon>

      <Maydon yorliq="Tuman yoki shahar" htmlFor="district">
        <Kiritish id="district" name="district" placeholder="Chilonzor tumani" />
      </Maydon>

      <Maydon yorliq="STIR" htmlFor="stir" xato={x?.stir} izoh="9 ta raqam, ixtiyoriy">
        <Kiritish id="stir" name="stir" inputMode="numeric" placeholder="201234567" />
      </Maydon>

      <Yuborish />
    </form>
  );
}
