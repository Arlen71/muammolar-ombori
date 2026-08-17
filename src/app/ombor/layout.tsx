import { talabDasturchi } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function OmborLayout({ children }: LayoutProps<"/ombor">) {
  // Tasdiqlanmagan dasturchi bu yerga kira olmaydi — kutish ekraniga yo'naltiriladi
  const foydalanuvchi = await talabDasturchi();

  return (
    <AppShell
      foydalanuvchi={foydalanuvchi}
      havolalar={[
        { yol: "/ombor", matn: "Muammolar ombori" },
        { yol: "/ombor/mening", matn: "Men olgan muammolar" },
      ]}
    >
      {children}
    </AppShell>
  );
}
