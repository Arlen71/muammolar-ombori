"use client";

import { useActionState, useState } from "react";

import { foydalanuvchiYarat, parolniTiklash } from "../actions";
import { ModalOchgich } from "@/components/modal";
import { Kiritish, Maydon, Tanlov, Xabar } from "@/components/ui";
import { Yuborish } from "@/components/yuborish";
import type { AmalNatijasi } from "@/lib/validation";

type Rol = { value: string; label: string };
type Tashkilot = { id: string; name: string };

/** Sahifa sarlavhasidagi tugma va u ochadigan modal. */
export function FoydalanuvchiQoshish({
  rollar,
  tashkilotlar,
}: {
  rollar: Rol[];
  tashkilotlar: Tashkilot[];
}) {
  return (
    <ModalOchgich
      yorliq="Yangi akkaunt"
      sarlavha="Yangi akkaunt yaratish"
      izoh="Boshlang'ich parol yaratilgandan keyin bir marta ko'rsatiladi — uni nusxalab, egasiga yetkazing."
    >
      {/*
        Oyna muvaffaqiyatdan keyin ataylab yopilmaydi: yaratilgan
        boshlang'ich parol aynan shu xabarda ko'rsatiladi va u boshqa
        hech qayerda saqlanmaydi. Oyna o'zi yopilib ketsa, administrator
        parolni nusxalab ulgurmay qolardi.
      */}
      {() => <FoydalanuvchiFormasi rollar={rollar} tashkilotlar={tashkilotlar} />}
    </ModalOchgich>
  );
}

export function FoydalanuvchiFormasi({
  rollar,
  tashkilotlar,
}: {
  rollar: Rol[];
  tashkilotlar: Tashkilot[];
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(foydalanuvchiYarat, {});
  const [rol, setRol] = useState("LEADER");
  const x = holat.maydonXatolari;

  return (
    <form action={amal} className="space-y-4" noValidate>
      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}
      {holat.muvaffaqiyat && (
        <Xabar turi="muvaffaqiyat" sarlavha="Akkaunt yaratildi">
          <p className="mt-1 break-words font-mono text-xs leading-relaxed">
            {holat.muvaffaqiyat}
          </p>
        </Xabar>
      )}

      <Maydon yorliq="Ism-familiya" htmlFor="fullName" majburiy xato={x?.fullName}>
        <Kiritish id="fullName" name="fullName" placeholder="Bekzod Tursunov" required />
      </Maydon>

      <Maydon yorliq="Telefon raqami" htmlFor="phone" majburiy xato={x?.phone} izoh="Login sifatida ishlatiladi">
        <Kiritish
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="+998 90 123 45 67"
          required
        />
      </Maydon>

      <Maydon yorliq="Roli" htmlFor="role" majburiy xato={x?.role}>
        <Tanlov id="role" name="role" value={rol} onChange={(e) => setRol(e.target.value)}>
          {rollar.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Tanlov>
      </Maydon>

      {rol === "LEADER" && (
        <Maydon
          yorliq="Tashkilot"
          htmlFor="organizationId"
          majburiy
          xato={x?.organizationId}
        >
          <Tanlov id="organizationId" name="organizationId" required>
            <option value="">— tanlang —</option>
            {tashkilotlar.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Tanlov>
        </Maydon>
      )}

      <Maydon yorliq="Lavozimi" htmlFor="position">
        <Kiritish id="position" name="position" placeholder="Hokim o'rinbosari" />
      </Maydon>

      {rol === "DEVELOPER" && (
        <Xabar turi="malumot">
          Dasturchi akkaunti «tasdiq kutmoqda» holatida yaratiladi. U omborni ko'rishi
          uchun «Dasturchilar» bo'limidan tasdiqlashingiz kerak.
        </Xabar>
      )}

      <Yuborish kutish="Yaratilmoqda…" className="w-full">
        Akkaunt yaratish
      </Yuborish>
    </form>
  );
}

export function ParolTiklashTugmasi({ userId }: { userId: string }) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(parolniTiklash, {});

  if (holat.muvaffaqiyat) {
    return (
      <p className="break-words rounded-md bg-muvaffaqiyat-yuza px-2.5 py-1.5 font-mono text-xs text-muvaffaqiyat">
        {holat.muvaffaqiyat}
      </p>
    );
  }

  return (
    <form action={amal}>
      <input type="hidden" name="userId" value={userId} />
      {holat.xato && <span className="mr-2 text-xs text-xato">{holat.xato}</span>}
      <button
        type="submit"
        className="rounded-md px-2 py-1 text-sm text-matn-ikkilamchi hover:bg-yuza-2 hover:text-matn"
      >
        Parolni tiklash
      </button>
    </form>
  );
}
