import { talabRol } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { rolMenyusi } from "@/lib/menyu";
import { jamiOqilmagan } from "@/lib/suhbat";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await talabRol("ADMIN");
  const oqilmagan = await jamiOqilmagan(admin);

  return (
    <AppShell
      foydalanuvchi={admin}
      havolalar={rolMenyusi("ADMIN", oqilmagan)}
    >
      {children}
    </AppShell>
  );
}
