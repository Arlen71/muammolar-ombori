"use client";

import * as React from "react";

/**
 * `<dialog>` ni React holati bilan bog'laydi.
 *
 * Modal ham, yon paneldagi tortma ham aynan bir xil ishlashi kerak, shuning
 * uchun mantiq shu yerda bir marta yozilgan. Ilgari ikkalasida alohida
 * turgan edi va tortmada sahifa qulfi tushib qolgandi: menyu ochiq turganda
 * orqadagi ro'yxat barmoq bilan siljiyverardi.
 *
 * Brauzerning o'z elementidan foydalanamiz, chunki `showModal()` fokusni
 * oyna ichida ushlaydi, `Esc` ni qayta ishlaydi, orqa fonni ekran
 * o'quvchidan yashiradi va elementni top-layer'ga chiqaradi. Qo'lda
 * yozilganda bularning kamida bittasi doim unutiladi.
 */
export function useOyna(ochiq: boolean, yop: () => void) {
  const oyna = React.useRef<HTMLDialogElement>(null);

  // React holati → DOM
  React.useEffect(() => {
    const el = oyna.current;
    if (!el) return;
    if (ochiq && !el.open) el.showModal();
    if (!ochiq && el.open) el.close();
  }, [ochiq]);

  /*
    DOM → React holati.

    `close` hodisasi ko'pikka chiqmaydi (bubble qilmaydi), shuning uchun u
    elementga to'g'ridan-to'g'ri ulanadi. `Esc` bosilganda brauzer oynani
    o'zi yopadi — React esa buni bilmay qoladi va holat rostlikdan
    uzilib ketadi: keyingi safar tugma bosilganda hech narsa ochilmaydi.
  */
  React.useEffect(() => {
    const el = oyna.current;
    if (!el) return;
    el.addEventListener("close", yop);
    return () => el.removeEventListener("close", yop);
  }, [yop]);

  // Orqadagi sahifa siljimasin — `showModal()` buni o'zi qilmaydi
  React.useEffect(() => {
    if (!ochiq) return;
    const oldingi = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldingi;
    };
  }, [ochiq]);

  /*
    Fon bosilganda yopiladi. `<dialog>` da fon — elementning o'zi, ya'ni
    bosilgan nishon aynan dialog bo'lsa, demak kontentdan tashqari joy
    bosilgan.
  */
  function fondaBosildi(hodisa: React.MouseEvent<HTMLDialogElement>) {
    if (hodisa.target === oyna.current) yop();
  }

  return { oyna, fondaBosildi };
}
