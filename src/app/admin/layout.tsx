import { talabRol } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await talabRol("ADMIN");

  return (
    <AppShell
      foydalanuvchi={admin}
      havolalar={[
        { yol: "/admin", matn: "Boshqaruv", belgi: "boshqaruv" },
        { yol: "/admin/moderatsiya", matn: "Moderatsiya", belgi: "moderatsiya" },
        { yol: "/admin/dublikatlar", matn: "Dublikatlar", belgi: "dublikat" },
        { yol: "/admin/dasturchilar", matn: "Dasturchilar", belgi: "dasturchilar" },
        { yol: "/admin/tashkilotlar", matn: "Tashkilotlar", belgi: "tashkilotlar" },
        { yol: "/admin/foydalanuvchilar", matn: "Foydalanuvchilar", belgi: "foydalanuvchilar" },
      ]}
    >
      {children}
    </AppShell>
  );
}
