"use client";

import { useActionState } from "react";

import { tashkilotYarat } from "../actions";
import { ModalOchgich } from "@/components/modal";
import { Kiritish, Maydon, Tanlov, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

type Variant = { value: string; label: string };

/** Sahifa sarlavhasidagi tugma va u ochadigan modal. */
export function TashkilotQoshish({
  turlar,
  hududlar,
}: {
  turlar: Variant[];
  hududlar: Variant[];
}) {
  return (
    <ModalOchgich
      yorliq="Yangi tashkilot"
      sarlavha="Yangi tashkilot qo'shish"
      izoh="Tashkilot qo'shilgach, unga rahbar akkaunti yaratish mumkin bo'ladi."
    >
      {/*
        Modal muvaffaqiyatdan keyin OCHIQ qoladi.

        Administrator odatda tashkilotlarni ketma-ket kiritadi, va forma
        o'zi tozalanib, ustida yashil xabar chiqadi — ya'ni keyingisini
        darhol yozish mumkin. Oyna avtomatik yopilsa, har safar tugmani
        qayta bosishga to'g'ri kelardi.
      */}
      {() => <TashkilotFormasi turlar={turlar} hududlar={hududlar} />}
    </ModalOchgich>
  );
}

export function TashkilotFormasi({
  turlar,
  hududlar,
}: {
  turlar: Variant[];
  hududlar: Variant[];
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

      <Yuborish kutish="Qo'shilmoqda…" className="w-full">
        Tashkilotni qo'shish
      </Yuborish>
    </form>
  );
}
