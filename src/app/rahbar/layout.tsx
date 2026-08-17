import { talabRahbar } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function RahbarLayout({ children }: LayoutProps<"/rahbar">) {
  const rahbar = await talabRahbar();

  return (
    <AppShell
      foydalanuvchi={rahbar}
      havolalar={[
        { yol: "/rahbar", matn: "Mening muammolarim" },
        { yol: "/rahbar/boshqalar", matn: "Boshqa tashkilotlarda" },
      ]}
    >
      {children}
    </AppShell>
  );
}
