import type { Metadata } from "next";

import { db } from "@/lib/db";
import { talabKirish } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { ROL } from "@/lib/labels";
import { ProfilFormasi } from "./profil-formasi";

export const metadata: Metadata = { title: "Mening profilim" };

/**
 * Profil sahifasi.
 *
 * Har uch rol uchun bir xil: administrator ham, rahbar ham, dasturchi ham
 * o'z ismini, lavozimini va rasmini o'zi boshqaradi. Telefon, rol va
 * tashkilot esa administrator qo'lida qoladi — sabablari `actions.ts` da.
 */
export default async function ProfilSahifasi() {
  const joriy = await talabKirish();

  /*
    Pochta `JoriyFoydalanuvchi` da yo'q — u sessiya uchun kerak emas va
    har bir sahifada tashilishi shart emas. Faqat shu yerda so'raladi.
  */
  const malumot = await db.user.findUniqueOrThrow({
    where: { id: joriy.id },
    select: { email: true },
  });

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Mening profilim"
        izoh="Ism, lavozim va rasm — bularni o'zingiz o'zgartirasiz."
      />

      <ProfilFormasi
        foydalanuvchiId={joriy.id}
        ism={joriy.fullName}
        lavozim={joriy.position}
        pochta={malumot.email}
        telefon={joriy.phone}
        tashkilot={joriy.organizationName}
        rol={ROL[joriy.role]}
        rasmVersiyasi={joriy.rasmVersiyasi}
      />
    </>
  );
}
