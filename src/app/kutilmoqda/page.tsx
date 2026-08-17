import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { talabKirish, boshSahifa } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Quti, Xabar } from "@/components/ui";
import { telefonMatni } from "@/lib/labels";

export const metadata: Metadata = { title: "Ariza ko'rib chiqilmoqda" };

/** Tasdiqlanmagan dasturchi shu ekranni ko'radi. */
export default async function KutishSahifasi() {
  const foydalanuvchi = await talabKirish();

  // Tasdiqlangan yoki boshqa roldagi foydalanuvchi bu yerda turmasin
  if (foydalanuvchi.role !== "DEVELOPER" || foydalanuvchi.status === "ACTIVE") {
    redirect(boshSahifa(foydalanuvchi.role));
  }

  return (
    <AppShell foydalanuvchi={foydalanuvchi}>
      <div className="mx-auto max-w-xl py-8">
        <Quti className="p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-matn">
            Arizangiz ko'rib chiqilmoqda
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-matn-ikkilamchi">
            Muammolar ombori davlat tashkilotlarining ichki ish jarayonlariga oid
            ma'lumotlarni saqlaydi, shuning uchun unga faqat administrator
            tasdiqlagan dasturchilar kira oladi.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-matn-ikkilamchi">
            Administrator arizangizni ko'rib chiqqach, shu sahifa avtomatik
            ochiladi — qaytadan kiring yoki sahifani yangilang.
          </p>

          <Xabar turi="malumot" className="mt-5">
            Sizning raqamingiz: <strong>{telefonMatni(foydalanuvchi.phone)}</strong>
            <br />
            Tezlashtirish uchun administratorga shu raqamni ayting.
          </Xabar>
        </Quti>
      </div>
    </AppShell>
  );
}
