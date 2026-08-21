"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Mavzu almashtirgichi.
 *
 * Tanlov `localStorage` da saqlanadi. Foydalanuvchi hech qachon tanlamagan
 * bo'lsa, tizim sozlamasi (`prefers-color-scheme`) amal qiladi — ya'ni
 * telefonini kechqurun qorong'i rejimga o'tkazadigan odam bu yerda ham
 * qorong'i mavzuni ko'radi, hech narsa bosmasdan.
 *
 * Sahifa yuklanishida mavzuni bu komponent EMAS, `layout.tsx` dagi kichik
 * skript qo'yadi — u React ishga tushishidan oldin bajariladi. Aks holda
 * qorong'i mavzudagi foydalanuvchi har bir o'tishda oq ekranning bir
 * lahzalik chaqnashini ko'rardi.
 *
 * Komponentda holat yo'q. Qaysi ikonka ko'rinishini CSS hal qiladi:
 * ikkalasi ham chiziladi, `dark:` varianti keraksizini yashiradi. Shu
 * tufayli server va brauzer bir xil HTML chiqaradi (hidratsiya
 * nomuvofiqligi bo'lmaydi) va tugma to'g'ri ikonkani darhol ko'rsatadi —
 * React yuklanishini kutmasdan.
 */
export const MAVZU_KALITI = "muammolar-ombori:mavzu";

export function MavzuTugmasi({ className }: { className?: string }) {
  function almashtir() {
    const el = document.documentElement;

    /*
      Almashish oldidan vaqtinchalik o'tish sinfi qo'yiladi — ranglar
      sakrab emas, 300 ms da oqib o'tadi (qoida `globals.css` da).
      Sinf doimiy qolsa har bir hover ham sekinlashardi, shuning uchun
      o'tish tugagach olib tashlanadi.
    */
    el.classList.add("mavzu-otish");
    window.setTimeout(() => el.classList.remove("mavzu-otish"), 350);

    const qorongi = !el.classList.contains("dark");
    el.classList.toggle("dark", qorongi);
    try {
      localStorage.setItem(MAVZU_KALITI, qorongi ? "qorongi" : "yorug");
    } catch {
      // Maxfiylik rejimida localStorage yopiq bo'lishi mumkin —
      // mavzu shu sahifa uchun baribir almashadi, faqat eslab qolinmaydi
    }
  }

  return (
    <button
      type="button"
      onClick={almashtir}
      title="Mavzuni almashtirish"
      aria-label="Mavzuni almashtirish"
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-lg text-matn-ikkilamchi",
        "transition-colors hover:bg-yuza-2 hover:text-matn",
        className
      )}
    >
      <Moon size={18} className="dark:hidden" aria-hidden="true" />
      <Sun size={18} className="hidden dark:block" aria-hidden="true" />
    </button>
  );
}
