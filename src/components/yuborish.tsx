"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Tugma } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Forma yuborish tugmasi.
 *
 * Ilgari aynan shu 6 qator 12 ta faylda takrorlangan edi. Endi bitta joyda:
 * bosilgandan keyin tugma o'chadi (ikki marta yuborishning oldini oladi),
 * matni almashadi va aylanuvchi belgi chiqadi.
 *
 * `useFormStatus` faqat **o'zi joylashgan `<form>`** holatini ko'radi, shuning
 * uchun bu komponent har doim forma ichida bo'lishi shart — tashqarida
 * `pending` hech qachon `true` bo'lmaydi.
 */
export function Yuborish({
  kutish = "Yuborilmoqda…",
  children,
  disabled,
  className,
  ...props
}: React.ComponentProps<typeof Tugma> & {
  /** Yuborilayotgan paytdagi matn */
  kutish?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Tugma
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending || undefined}
      className={cn(className)}
      {...props}
    >
      {pending && <Aylantirgich />}
      {pending ? kutish : children}
    </Tugma>
  );
}

/** Kichik aylanuvchi belgi. `currentColor` — tugmaning o'z rangini oladi. */
function Aylantirgich() {
  return (
    <svg
      className="size-4 shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
