"use client";

import { useEffect, useRef, useState } from "react";

import { avtoSaqla } from "@/app/rahbar/actions";
import { qadamMalumoti } from "@/lib/problem-form";
import type { QadamRaqami } from "@/lib/problem-schema";

type Holat = "tinch" | "yozilmoqda" | "saqlanmoqda" | "saqlandi" | "xato";

const KUTISH_MS = 1500;

/**
 * Qoralamani avtomatik saqlaydi.
 *
 * Nima uchun kerak: rahbar formani 15 daqiqada to'ldiradi. Yarim yo'lda
 * telefon jiringlasa yoki brauzer yopilsa, yozilganlar yo'qolmasligi kerak.
 * Har o'zgarishdan 1,5 soniya keyin fon rejimida saqlanadi.
 *
 * Formaning ichiga qo'yiladi — `closest("form")` orqali o'zi topib oladi.
 */
export function Avtosaqlash({
  muammoId,
  qadam,
  onToliqlik,
}: {
  muammoId: string;
  qadam: QadamRaqami;
  onToliqlik?: (foiz: number) => void;
}) {
  const belgi = useRef<HTMLSpanElement>(null);
  const [holat, setHolat] = useState<Holat>("tinch");

  useEffect(() => {
    const forma = belgi.current?.closest("form");
    if (!forma) return;

    let taymer: ReturnType<typeof setTimeout>;
    let bekorQilingan = false;

    async function saqla() {
      if (!forma) return;
      setHolat("saqlanmoqda");
      try {
        const natija = await avtoSaqla(muammoId, qadamMalumoti(qadam, new FormData(forma)));
        if (bekorQilingan) return;
        setHolat(natija.saqlandi ? "saqlandi" : "xato");
        if (natija.toliqlik !== undefined) onToliqlik?.(natija.toliqlik);
      } catch {
        if (!bekorQilingan) setHolat("xato");
      }
    }

    function ozgardi() {
      clearTimeout(taymer);
      setHolat("yozilmoqda");
      taymer = setTimeout(saqla, KUTISH_MS);
    }

    forma.addEventListener("input", ozgardi);
    forma.addEventListener("change", ozgardi);

    return () => {
      bekorQilingan = true;
      clearTimeout(taymer);
      forma.removeEventListener("input", ozgardi);
      forma.removeEventListener("change", ozgardi);
    };
  }, [muammoId, qadam, onToliqlik]);

  const matn: Record<Holat, string> = {
    tinch: "",
    yozilmoqda: "",
    saqlanmoqda: "Saqlanmoqda…",
    saqlandi: "Qoralama saqlandi",
    xato: "Saqlanmadi — internetni tekshiring",
  };

  return (
    <span
      ref={belgi}
      aria-live="polite"
      className={holat === "xato" ? "text-sm text-xato" : "text-sm text-matn-uchinchi"}
    >
      {matn[holat]}
    </span>
  );
}
