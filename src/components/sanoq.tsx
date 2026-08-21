"use client";

import * as React from "react";

import { sonMatni } from "@/lib/labels";

/**
 * Jonli sanaladigan raqam.
 *
 * KPI kartochkasidagi son 0 dan haqiqiy qiymatgacha ~0.9 soniyada sanab
 * chiqiladi. Bu bezak emas, e'tibor boshqaruvi: sahifadagi eng muhim
 * narsa — raqamlar, va qisqa harakat ko'zni aynan ularga olib boradi.
 *
 * Uch himoya:
 *   1. Server va brauzer bir xil HTML chiqaradi — boshlang'ich holatda
 *      to'liq qiymat turadi, sanash hidratsiyadan keyin boshlanadi.
 *      Shu tufayli JS o'chiq bo'lsa ham raqam ko'rinadi.
 *   2. `prefers-reduced-motion` da sanash umuman ishlamaydi.
 *   3. Element ekranga kirgandagina boshlanadi (IntersectionObserver) —
 *      sahifa pastidagi raqam foydalanuvchi yetib borganda sanaydi.
 */
export function Sanoq({ qiymat, davomiylik = 900 }: { qiymat: number; davomiylik?: number }) {
  const [korsatilayotgan, korsat] = React.useState(qiymat);
  const oram = React.useRef<HTMLSpanElement>(null);
  const boshlanganmi = React.useRef(false);

  React.useEffect(() => {
    const el = oram.current;
    if (!el || boshlanganmi.current) return;
    if (qiymat === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const kuzatuvchi = new IntersectionObserver(
      ([kirdi]) => {
        if (!kirdi.isIntersecting || boshlanganmi.current) return;
        boshlanganmi.current = true;
        kuzatuvchi.disconnect();

        const boshlandi = performance.now();
        const qadam = (hozir: number) => {
          const ulush = Math.min((hozir - boshlandi) / davomiylik, 1);
          // easeOutCubic — boshida tez, oxirida sekinlashadi: raqam
          // "yetib kelgani" seziladi
          const silliq = 1 - (1 - ulush) ** 3;
          korsat(Math.round(qiymat * silliq));
          if (ulush < 1) requestAnimationFrame(qadam);
        };
        korsat(0);
        requestAnimationFrame(qadam);
      },
      { threshold: 0.4 }
    );

    kuzatuvchi.observe(el);
    return () => kuzatuvchi.disconnect();
  }, [qiymat, davomiylik]);

  return (
    <span ref={oram} className="tabular-nums">
      {sonMatni(korsatilayotgan)}
    </span>
  );
}
