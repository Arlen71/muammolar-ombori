"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { kirishAmali } from "./actions";
import { Kiritish, Maydon, Tugma, Xabar } from "@/components/ui";
import type { AmalNatijasi } from "@/lib/validation";

function YuborishTugmasi() {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" olcham="katta" className="w-full" disabled={pending}>
      {pending ? "Tekshirilmoqda…" : "Kirish"}
    </Tugma>
  );
}

export function KirishFormasi({ keyingi }: { keyingi?: string }) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(kirishAmali, {});

  return (
    <form action={amal} className="space-y-5" noValidate>
      {keyingi && <input type="hidden" name="keyingi" value={keyingi} />}

      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}

      <Maydon
        yorliq="Telefon raqami"
        htmlFor="telefon"
        majburiy
        xato={holat.maydonXatolari?.telefon}
        izoh="Administrator sizga bergan raqam"
      >
        <Kiritish
          id="telefon"
          name="telefon"
          type="tel"
          inputMode="tel"
          autoComplete="username"
          placeholder="+998 90 123 45 67"
          required
          aria-invalid={!!holat.maydonXatolari?.telefon}
        />
      </Maydon>

      <Maydon
        yorliq="Parol"
        htmlFor="parol"
        majburiy
        xato={holat.maydonXatolari?.parol}
      >
        <Kiritish
          id="parol"
          name="parol"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          aria-invalid={!!holat.maydonXatolari?.parol}
        />
      </Maydon>

      <YuborishTugmasi />
    </form>
  );
}
