import { talabRahbar } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function RahbarLayout({ children }: LayoutProps<"/rahbar">) {
  const rahbar = await talabRahbar();

  return (
    <AppShell
      foydalanuvchi={rahbar}
      havolalar={[
        { yol: "/rahbar", matn: "Mening muammolarim", belgi: "royxat" },
        { yol: "/rahbar/boshqalar", matn: "Boshqa tashkilotlarda", belgi: "qollab" },
      ]}
    >
      {children}
    </AppShell>
  );
}
