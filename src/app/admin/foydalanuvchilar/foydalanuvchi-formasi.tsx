"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { foydalanuvchiYarat, parolniTiklash } from "../actions";
import { Kiritish, Maydon, Tanlov, Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function Yuborish({ matn, kutish }: { matn: string; kutish: string }) {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" className="w-full" disabled={pending}>
      {pending ? kutish : matn}
    </Tugma>
  );
}

export function FoydalanuvchiFormasi({
  rollar,
  tashkilotlar,
}: {
  rollar: { value: string; label: string }[];
  tashkilotlar: { id: string; name: string }[];
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

      <Yuborish matn="Akkaunt yaratish" kutish="Yaratilmoqda…" />
    </form>
  );
}

export function ParolTiklashTugmasi({ userId }: { userId: string }) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(parolniTiklash, {});

  if (holat.muvaffaqiyat) {
    return (
      <p className="break-words rounded-md bg-emerald-50 px-2.5 py-1.5 font-mono text-xs text-emerald-900">
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
        className="rounded-md px-2 py-1 text-sm text-matn-ikkilamchi hover:bg-slate-100 hover:text-matn"
      >
        Parolni tiklash
      </button>
    </form>
  );
}
