import { talabRol } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await talabRol("ADMIN");

  return (
    <AppShell
      foydalanuvchi={admin}
      havolalar={[
        { yol: "/admin", matn: "Boshqaruv" },
        { yol: "/admin/moderatsiya", matn: "Moderatsiya" },
        { yol: "/admin/dublikatlar", matn: "Dublikatlar" },
        { yol: "/admin/dasturchilar", matn: "Dasturchilar" },
        { yol: "/admin/tashkilotlar", matn: "Tashkilotlar" },
        { yol: "/admin/foydalanuvchilar", matn: "Foydalanuvchilar" },
      ]}
    >
      {children}
    </AppShell>
  );
}
