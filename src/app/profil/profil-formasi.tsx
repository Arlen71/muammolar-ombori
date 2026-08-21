"use client";

import { useActionState } from "react";

import { profilniYangila, rasmniOchir, rasmniYukla } from "./actions";
import { Avatar } from "@/components/avatar";
import { Kiritish, Maydon, Quti, QutiSarlavha, Tugma, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import { telefonMatni } from "@/lib/labels";
import type { AmalNatijasi } from "@/lib/validation";

/**
 * Profil rasmi bloki.
 *
 * Alohida forma: HTML formalarni ichma-ich qo'yishga ruxsat bermaydi, va
 * rasm yuklash matn maydonlaridan mustaqil bo'lishi kerak — foydalanuvchi
 * faqat rasmini almashtirmoqchi bo'lganda ism-familiyani qayta yozishi
 * shart emas.
 */
function RasmBloki({
  ism,
  foydalanuvchiId,
  rasmBormi,
}: {
  ism: string;
  foydalanuvchiId: string;
  rasmBormi: boolean;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(rasmniYukla, {});
  const [ochirHolati, ochirAmali] = useActionState<AmalNatijasi, FormData>(
    async () => rasmniOchir(),
    {}
  );

  return (
    <Quti className="space-y-4">
      <QutiSarlavha
        sarlavha="Profil rasmi"
        izoh="Hamkasblar sizni ro'yxatlarda shu rasm bilan taniydi. PNG, JPG yoki WEBP, 2 MB gacha."
      />

      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
      {holat.muvaffaqiyat && <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>}
      {ochirHolati.muvaffaqiyat && (
        <Xabar turi="muvaffaqiyat">{ochirHolati.muvaffaqiyat}</Xabar>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <Avatar
          ism={ism}
          foydalanuvchiId={foydalanuvchiId}
          rasmBormi={rasmBormi}
          olcham="katta"
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <form action={amal} className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="rasm"
              accept="image/png,image/jpeg,image/webp"
              required
              aria-label="Rasm tanlash"
              className="max-w-full text-sm text-matn-ikkilamchi file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-yuza-2 file:px-3 file:py-2 file:text-sm file:font-medium file:text-matn hover:file:bg-yuza-3"
            />
            <Yuborish kutish="Yuklanmoqda…" korinish="ikkilamchi" olcham="kichik">
              Yuklash
            </Yuborish>
          </form>

          {rasmBormi && (
            <form action={ochirAmali}>
              <Yuborish kutish="O'chirilmoqda…" korinish="shaffof" olcham="kichik">
                Rasmni o'chirish
              </Yuborish>
            </form>
          )}
        </div>
      </div>
    </Quti>
  );
}

export function ProfilFormasi({
  foydalanuvchiId,
  ism,
  lavozim,
  pochta,
  telefon,
  tashkilot,
  rol,
  rasmBormi,
}: {
  foydalanuvchiId: string;
  ism: string;
  lavozim: string | null;
  pochta: string | null;
  telefon: string;
  tashkilot: string | null;
  rol: string;
  rasmBormi: boolean;
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(profilniYangila, {});
  const x = holat.maydonXatolari;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-5">
        <RasmBloki ism={ism} foydalanuvchiId={foydalanuvchiId} rasmBormi={rasmBormi} />

        <Quti>
          <QutiSarlavha
            sarlavha="Shaxsiy ma'lumotlar"
            izoh="Bu ma'lumotlar hamkasblarga ko'rinadi."
            className="mb-4"
          />

          <form action={amal} className="space-y-4" noValidate>
            {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
            {holat.muvaffaqiyat && (
              <Xabar turi="muvaffaqiyat">{holat.muvaffaqiyat}</Xabar>
            )}

            <Maydon yorliq="Ism-familiya" htmlFor="fullName" majburiy xato={x?.fullName}>
              <Kiritish id="fullName" name="fullName" defaultValue={ism} required />
            </Maydon>

            <Maydon
              yorliq="Lavozim"
              htmlFor="position"
              xato={x?.position}
              namuna="Hokim o'rinbosari"
            >
              <Kiritish id="position" name="position" defaultValue={lavozim ?? ""} />
            </Maydon>

            <Maydon
              yorliq="Elektron pochta"
              htmlFor="email"
              xato={x?.email}
              izoh="Ixtiyoriy. Kirish uchun emas — faqat bog'lanish uchun."
            >
              <Kiritish
                id="email"
                name="email"
                type="email"
                inputMode="email"
                defaultValue={pochta ?? ""}
                placeholder="ism@example.uz"
              />
            </Maydon>

            <Yuborish kutish="Saqlanmoqda…">Saqlash</Yuborish>
          </form>
        </Quti>
      </div>

      {/*
        O'zgartirib bo'lmaydigan maydonlar alohida panelda, o'chirilgan
        forma maydoni sifatida emas. O'chirilgan maydon "buni to'ldirish
        kerak edi, lekin nimadir ishlamayapti" degan taassurot beradi;
        alohida ro'yxat esa ochiq aytadi: bu ma'lumotni administrator
        boshqaradi.
      */}
      <Quti className="lg:sticky lg:top-6">
        <QutiSarlavha
          sarlavha="Administrator belgilaydi"
          izoh="O'zgartirish kerak bo'lsa administratorga murojaat qiling."
          className="mb-4"
        />
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-matn-ikkilamchi">Telefon (login)</dt>
            <dd className="mt-0.5 font-mono text-matn">{telefonMatni(telefon)}</dd>
          </div>
          <div>
            <dt className="text-matn-ikkilamchi">Rol</dt>
            <dd className="mt-0.5 text-matn">{rol}</dd>
          </div>
          <div>
            <dt className="text-matn-ikkilamchi">Tashkilot</dt>
            <dd className="mt-0.5 text-matn">
              {tashkilot ?? <span className="text-matn-uchinchi">Biriktirilmagan</span>}
            </dd>
          </div>
        </dl>
      </Quti>
    </div>
  );
}

export { Tugma };
