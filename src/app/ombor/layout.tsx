import { talabDasturchi } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { rolMenyusi } from "@/lib/menyu";
import { jamiOqilmagan } from "@/lib/suhbat";

export default async function OmborLayout({ children }: LayoutProps<"/ombor">) {
  // Tasdiqlanmagan dasturchi bu yerga kira olmaydi — kutish ekraniga yo'naltiriladi
  const foydalanuvchi = await talabDasturchi();
  const oqilmagan = await jamiOqilmagan(foydalanuvchi);

  return (
    <AppShell
      foydalanuvchi={foydalanuvchi}
      havolalar={rolMenyusi("DEVELOPER", oqilmagan)}
    >
      {children}
    </AppShell>
  );
}
