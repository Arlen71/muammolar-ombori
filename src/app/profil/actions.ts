"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { talabKirish } from "@/lib/auth";
import { auditYoz } from "@/lib/audit";
import { faylniOchir, yolEgasiniTekshir } from "@/lib/uploads";
import { zodXatolari, type AmalNatijasi } from "@/lib/validation";

/*
  Foydalanuvchi O'ZI o'zgartira oladigan maydonlar.

  Ro'yxatda ataylab yo'q:
    phone   — login sifatida ishlatiladi, uni almashtirish akkauntni
              boshqa odamga o'tkazish bilan teng. Administrator qiladi.
    role    — huquqni o'zi ko'tarib olishi mumkin bo'lardi.
    status  — bloklangan foydalanuvchi o'zini yoqib qo'yardi.
    organizationId — rahbar o'zini boshqa tashkilotga ko'chirib, o'sha
              tashkilotning muammolarini ko'ra olardi.

  Ya'ni bu ro'yxat qisqaligi bilan xavfsizlik chegarasi hosil qiladi:
  quyidagi sxemada bo'lmagan hech qanday maydon bazaga yozilmaydi.
*/
const profilSxemasi = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Ism-familiyani to'liq yozing")
    .max(120, "Ism juda uzun"),
  position: z
    .string()
    .trim()
    .max(120, "Lavozim juda uzun")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Elektron pochta manzili noto'g'ri")
    .optional()
    .or(z.literal("")),
});

export async function profilniYangila(
  _oldingi: AmalNatijasi,
  fd: FormData
): Promise<AmalNatijasi> {
  const foydalanuvchi = await talabKirish();

  const natija = profilSxemasi.safeParse({
    fullName: fd.get("fullName") ?? "",
    position: fd.get("position") ?? "",
    email: fd.get("email") ?? "",
  });
  if (!natija.success) return { maydonXatolari: zodXatolari(natija.error) };

  const { fullName, position, email } = natija.data;

  try {
    await db.user.update({
      where: { id: foydalanuvchi.id },
      data: {
        fullName,
        position: position || null,
        email: email || null,
      },
    });
  } catch (e) {
    // `email` bazada unique — boshqa akkaunt egallagan bo'lsa
    if ((e as { code?: string }).code === "P2002") {
      return { maydonXatolari: { email: "Bu pochta boshqa akkauntga biriktirilgan." } };
    }
    throw e;
  }

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "profil.yangilandi",
    entity: "User",
    entityId: foydalanuvchi.id,
  });

  revalidatePath("/profil");
  return { muvaffaqiyat: "Profil saqlandi." };
}

/**
 * Yuklangan rasmni profilga biriktiradi.
 *
 * Fayl baytlari bu yerga KELMAYDI — brauzer ularni omborga bevosita
 * yuborgan (`/api/yuklash` tokeni bilan), bu amal esa faqat yo'lni
 * qabul qiladi. Sabab: Vercel serverless funksiyasiga 4.5 MB dan katta
 * tana o'tmaydi, ya'ni 10 MB li rasmni server orqali o'tkazib bo'lmaydi.
 *
 * Yo'l mijozdan kelgani uchun u ISHONCHSIZ deb qaraladi: prefiks
 * chaqiruvchining o'z papkasiga mos kelishi tekshiriladi. Token berishda
 * ham xuddi shu tekshiruv bor — ikkitasi bir-birini dublikat qiladi va
 * bittasi o'tkazib yuborilsa, ikkinchisi ushlab qoladi.
 */
export async function rasmniBiriktir(yol: string): Promise<AmalNatijasi> {
  const foydalanuvchi = await talabKirish();

  if (!yolEgasiniTekshir(yol, foydalanuvchi.id)) {
    return { xato: "Rasm yo'li noto'g'ri." };
  }

  /*
    Eski rasm o'chiriladi — aks holda har yangilashda omborda bir dona
    yetim fayl qolib ketardi. Avval baza yangilanadi: agar o'chirish
    yiqilsa, foydalanuvchi baribir yangi rasmini ko'radi, omborda esa
    faqat bitta ortiqcha fayl qoladi. Teskarisi bo'lsa — eski rasm
    o'chib, yangisi yozilmay qolishi mumkin edi.
  */
  const eskiYol = (
    await db.user.findUnique({
      where: { id: foydalanuvchi.id },
      select: { avatarPath: true },
    })
  )?.avatarPath;

  await db.user.update({
    where: { id: foydalanuvchi.id },
    data: { avatarPath: yol },
  });

  if (eskiYol && eskiYol !== yol) await faylniOchir(eskiYol);

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "profil.rasm_yuklandi",
    entity: "User",
    entityId: foydalanuvchi.id,
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { muvaffaqiyat: "Rasm yuklandi." };
}

export async function rasmniOchir(): Promise<AmalNatijasi> {
  const foydalanuvchi = await talabKirish();

  const eskiYol = (
    await db.user.findUnique({
      where: { id: foydalanuvchi.id },
      select: { avatarPath: true },
    })
  )?.avatarPath;

  if (!eskiYol) return { muvaffaqiyat: "Rasm allaqachon yo'q." };

  await db.user.update({
    where: { id: foydalanuvchi.id },
    data: { avatarPath: null },
  });
  await faylniOchir(eskiYol);

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "profil.rasm_ochirildi",
    entity: "User",
    entityId: foydalanuvchi.id,
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  return { muvaffaqiyat: "Rasm o'chirildi." };
}
