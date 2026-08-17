"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { parolTekshir } from "@/lib/password";
import { SESSIYA_COOKIE, cookieSozlamalari, sessiyaTokeniYarat } from "@/lib/session";
import { boshSahifa, KUTISH_SAHIFASI } from "@/lib/routes";
import { kirishSxemasi, zodXatolari, type AmalNatijasi } from "@/lib/validation";
import { kirishChekla, muvaffaqiyatsizUrinish, tiklash } from "@/lib/rate-limit";
import { auditYoz, soragichIp } from "@/lib/audit";

/**
 * Ochiq yo'naltirish (open redirect) hujumidan himoya.
 * Faqat shu saytdagi nisbiy manzilga ruxsat beramiz.
 */
function xavfsizYol(xom: string | null): string | null {
  if (!xom) return null;
  if (!xom.startsWith("/")) return null;
  // "//boshqa-sayt.uz" brauzer uchun tashqi manzil hisoblanadi
  if (xom.startsWith("//")) return null;
  if (xom.includes("\\")) return null;
  return xom;
}

export async function kirishAmali(
  _oldingi: AmalNatijasi,
  formData: FormData
): Promise<AmalNatijasi> {
  const natija = kirishSxemasi.safeParse({
    telefon: formData.get("telefon"),
    parol: formData.get("parol"),
  });

  if (!natija.success) {
    return { maydonXatolari: zodXatolari(natija.error) };
  }

  const { telefon, parol } = natija.data;
  const ip = await soragichIp();
  const cheklovKaliti = `kirish:${telefon}:${ip ?? "nomalum"}`;

  const holat = await kirishChekla(cheklovKaliti);
  if (!holat.ruxsat) {
    const daqiqa = Math.ceil(holat.qolganSoniya / 60);
    return {
      xato: `Juda ko'p muvaffaqiyatsiz urinish. ${daqiqa} daqiqadan keyin qayta urinib ko'ring.`,
    };
  }

  const foydalanuvchi = await db.user.findUnique({
    where: { phone: telefon },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      status: true,
      sessionVersion: true,
      organizationId: true,
    },
  });

  // Foydalanuvchi topilmasa ham parolni tekshirgandek vaqt ketkazamiz —
  // aks holda javob tezligi orqali qaysi raqamlar ro'yxatda borligini bilib olish mumkin.
  const xeshBormi = foydalanuvchi?.passwordHash;
  const parolTogri = xeshBormi
    ? await parolTekshir(parol, xeshBormi)
    : await parolTekshir(parol, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA");

  if (!foydalanuvchi || !parolTogri) {
    muvaffaqiyatsizUrinish(cheklovKaliti);
    await auditYoz({
      action: "kirish.muvaffaqiyatsiz",
      entity: "User",
      meta: { telefon },
    });
    return { xato: "Telefon raqami yoki parol noto'g'ri." };
  }

  if (foydalanuvchi.status === "BLOCKED") {
    await auditYoz({
      actorId: foydalanuvchi.id,
      action: "kirish.bloklangan",
      entity: "User",
      entityId: foydalanuvchi.id,
    });
    return {
      xato: "Sizning akkauntingiz bloklangan. Administratorga murojaat qiling.",
    };
  }

  tiklash(cheklovKaliti);

  const token = await sessiyaTokeniYarat({
    sub: foydalanuvchi.id,
    role: foydalanuvchi.role,
    ver: foydalanuvchi.sessionVersion,
    org: foydalanuvchi.organizationId,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSIYA_COOKIE, token, cookieSozlamalari());

  await db.user.update({
    where: { id: foydalanuvchi.id },
    data: { lastLoginAt: new Date() },
  });

  await auditYoz({
    actorId: foydalanuvchi.id,
    action: "kirish.muvaffaqiyatli",
    entity: "User",
    entityId: foydalanuvchi.id,
  });

  // Tasdiqlanmagan dasturchi omborga emas, kutish sahifasiga tushadi
  const manzil =
    foydalanuvchi.role === "DEVELOPER" && foydalanuvchi.status !== "ACTIVE"
      ? KUTISH_SAHIFASI
      : (xavfsizYol(formData.get("keyingi") as string | null) ??
        boshSahifa(foydalanuvchi.role));

  // redirect() maxsus xato tashlaydi — u try/catch ichida bo'lmasligi kerak
  redirect(manzil);
}

export async function chiqishAmali() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSIYA_COOKIE);
  redirect("/kirish");
}
