import { talabRahbar } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { rolMenyusi } from "@/lib/menyu";
import { jamiOqilmagan } from "@/lib/suhbat";

export default async function RahbarLayout({ children }: LayoutProps<"/rahbar">) {
  const rahbar = await talabRahbar();
  const oqilmagan = await jamiOqilmagan(rahbar);

  return (
    <AppShell
      foydalanuvchi={rahbar}
      havolalar={rolMenyusi("LEADER", oqilmagan)}
    >
      {children}
    </AppShell>
  );
}
