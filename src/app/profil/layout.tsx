import { talabKirish } from "@/lib/auth";
import { AppShell, type Havola } from "@/components/app-shell";

/**
 * Profil sahifasining qobig'i.
 *
 * Boshqa bo'limlardan farqi: profil har uch rolda ochiladi, ya'ni yon
 * paneldagi menyu foydalanuvchining roliga qarab tanlanadi. Aks holda
 * dasturchi profilga kirganda administrator menyusini ko'rib qolardi.
 */
const MENYULAR: Record<string, Havola[]> = {
  ADMIN: [
    { yol: "/admin", matn: "Boshqaruv", belgi: "boshqaruv" },
    { yol: "/admin/moderatsiya", matn: "Moderatsiya", belgi: "moderatsiya" },
    { yol: "/admin/dublikatlar", matn: "Dublikatlar", belgi: "dublikat" },
    { yol: "/admin/dasturchilar", matn: "Dasturchilar", belgi: "dasturchilar" },
    { yol: "/admin/tashkilotlar", matn: "Tashkilotlar", belgi: "tashkilotlar" },
    { yol: "/admin/foydalanuvchilar", matn: "Foydalanuvchilar", belgi: "foydalanuvchilar" },
  ],
  LEADER: [
    { yol: "/rahbar", matn: "Mening muammolarim", belgi: "royxat" },
    { yol: "/rahbar/boshqalar", matn: "Boshqa tashkilotlarda", belgi: "qollab" },
  ],
  DEVELOPER: [
    { yol: "/ombor", matn: "Muammolar ombori", belgi: "ombor" },
    { yol: "/ombor/mening", matn: "Men olgan muammolar", belgi: "royxat" },
  ],
};

export default async function ProfilLayout({ children }: LayoutProps<"/profil">) {
  const foydalanuvchi = await talabKirish();

  return (
    <AppShell foydalanuvchi={foydalanuvchi} havolalar={MENYULAR[foydalanuvchi.role] ?? []}>
      {children}
    </AppShell>
  );
}
