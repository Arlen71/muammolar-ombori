"use client";

import { useEffect } from "react";

import { Tugma } from "@/components/ui";

/**
 * Kutilmagan xato ekrani.
 *
 * Bunisiz Next standart oq ekranni ko'rsatadi va foydalanuvchi nima
 * bo'lganini ham, nima qilishini ham bilmay qoladi.
 *
 * Xato matni ATAYLAB ko'rsatilmaydi: u ichki yo'l nomlari, so'rov
 * tafsilotlari yoki baza xabarini o'z ichiga olishi mumkin. Foydalanuvchi
 * bunday matndan foyda ko'rmaydi, hujum qilmoqchi bo'lgan odam esa
 * ko'radi. Tafsilot server jurnaliga yoziladi, foydalanuvchiga esa
 * `digest` — jurnaldagi yozuvni topish uchun qisqa belgi beriladi.
 */
export default function Xato({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Sahifada xato:", error);
  }, [error]);

  return (
    <main
      id="asosiy"
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16"
    >
      <h1 className="text-xl font-semibold tracking-tight text-matn">
        Kutilmagan xatolik yuz berdi
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-matn-ikkilamchi">
        Sahifani ochib bo'lmadi. Qayta urinib ko'ring — muammo takrorlansa,
        administratorga xabar bering.
      </p>

      {error.digest && (
        <p className="mt-4 rounded-lg bg-yuza-2 px-3 py-2 font-mono text-xs text-matn-ikkilamchi">
          Xato belgisi: {error.digest}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Tugma onClick={reset}>Qayta urinish</Tugma>

        {/*
          Ataylab `<Link>` emas, oddiy `<a>`.

          `reset()` allaqachon client tomonidagi qayta urinishni beradi.
          Bu tugma — oxirgi chora: agar router yoki client holati buzilgan
          bo'lsa, `<Link>` bilan o'tish o'sha buzilgan holatda qoladi.
          To'liq qayta yuklash hammasini noldan boshlaydi.
        */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">
          <Tugma korinish="ikkilamchi">Bosh sahifa</Tugma>
        </a>
      </div>
    </main>
  );
}
