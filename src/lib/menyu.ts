import type { Havola } from "@/components/yon-panel";
import type { Role } from "@/generated/prisma/enums";

/**
 * Rolga qarab yon paneldagi menyu.
 *
 * Alohida fayl, chunki uni to'rt joy ishlatadi: `/admin`, `/rahbar`,
 * `/ombor` layout'lari va rolga bog'liq bo'lmagan bo'limlar (`/profil`,
 * `/suhbat`). Ilgari ro'yxat har bir layout ichida qo'lda yozilgan edi
 * va yangi bo'lim qo'shilganda uni bir necha joyda takrorlash kerak
 * bo'lardi — biri esa albatta unutilardi.
 */
const MENYULAR: Record<Role, Havola[]> = {
  ADMIN: [
    { yol: "/admin", matn: "Boshqaruv", belgi: "boshqaruv" },
    { yol: "/admin/moderatsiya", matn: "So'nggi qo'shilganlar", belgi: "moderatsiya" },
    { yol: "/admin/dublikatlar", matn: "Dublikatlar", belgi: "dublikat" },
    { yol: "/admin/dasturchilar", matn: "Dasturchilar", belgi: "dasturchilar" },
    { yol: "/admin/tashkilotlar", matn: "Tashkilotlar", belgi: "tashkilotlar" },
    { yol: "/admin/foydalanuvchilar", matn: "Foydalanuvchilar", belgi: "foydalanuvchilar" },
  ],
  LEADER: [
    { yol: "/rahbar", matn: "Mening muammolarim", belgi: "royxat" },
    { yol: "/rahbar/boshqalar", matn: "Boshqa tashkilotlarda", belgi: "qollab" },
    { yol: "/suhbat", matn: "Suhbatlar", belgi: "suhbat" },
  ],
  DEVELOPER: [
    { yol: "/ombor", matn: "Muammolar ombori", belgi: "ombor" },
    { yol: "/ombor/mening", matn: "Men olgan muammolar", belgi: "royxat" },
    { yol: "/suhbat", matn: "Suhbatlar", belgi: "suhbat" },
  ],
};

/**
 * Rolga mos menyu.
 *
 * `oqilmagan` berilsa, «Suhbatlar» bandiga o'qilmagan xabarlar soni
 * qo'yiladi — foydalanuvchi javob kutilayotganini bo'limga kirmasdan
 * ko'radi. Bildirishnoma tizimi hali yo'q, shuning uchun bu belgi
 * yagona teskari aloqa.
 */
export function rolMenyusi(rol: Role, oqilmagan = 0): Havola[] {
  const menyu = MENYULAR[rol] ?? [];
  if (oqilmagan === 0) return menyu;

  return menyu.map((h) =>
    h.yol === "/suhbat" ? { ...h, soni: oqilmagan } : h
  );
}
