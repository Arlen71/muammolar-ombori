import { talabTasdiqlangan } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { rolMenyusi } from "@/lib/menyu";
import { jamiOqilmagan } from "@/lib/suhbat";

/**
 * Suhbat bo'limining qobig'i.
 *
 * Profil bilan bir xil: suhbat har uch rolda ochiladi, shuning uchun
 * yon paneldagi menyu foydalanuvchining roliga qarab tanlanadi.
 */
export default async function SuhbatLayout({ children }: LayoutProps<"/suhbat">) {
  const foydalanuvchi = await talabTasdiqlangan();
  const oqilmagan = await jamiOqilmagan(foydalanuvchi);

  return (
    <AppShell foydalanuvchi={foydalanuvchi} havolalar={rolMenyusi(foydalanuvchi.role, oqilmagan)}>
      {children}
    </AppShell>
  );
}
