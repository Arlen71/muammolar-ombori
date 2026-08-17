/**
 * Ma'lumotlar bazasi diagnostikasi.
 * Ishga tushirish:  npm run db:check
 *
 * Ulanish, PostgreSQL versiyasi va kerakli kengaytmalarni tekshiradi.
 * Yangi serverga deploy qilgandan keyin birinchi bo'lib shuni ishga tushiring.
 */
import "dotenv/config";
import { db } from "@/lib/db";

async function main() {
  const [{ v }] = await db.$queryRaw<{ v: string }[]>`SELECT version() AS v`;
  console.log("PostgreSQL :", v.split(",")[0]);

  const exts = await db.$queryRaw<
    { name: string; installed: string | null; def: string | null }[]
  >`SELECT name, installed_version AS installed, default_version AS def
      FROM pg_available_extensions
     WHERE name IN ('pg_trgm', 'unaccent')
     ORDER BY name`;

  for (const e of exts) {
    const holat = e.installed ? `o'rnatilgan (${e.installed})` : `mavjud, o'rnatilmagan (${e.def})`;
    console.log(`Kengaytma : ${e.name.padEnd(9)} — ${holat}`);
  }
  if (exts.length === 0) {
    console.log("Kengaytma : pg_trgm/unaccent topilmadi — o'xshashlik qidiruvi zaxira usulda ishlaydi");
  }

  const tables = await db.$queryRaw<{ n: bigint }[]>`
    SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log("Jadvallar :", Number(tables[0].n));

  const [orgs, users, problems] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.problem.count(),
  ]);
  console.log(`Yozuvlar  : ${orgs} tashkilot, ${users} foydalanuvchi, ${problems} muammo`);

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error("XATO:", e instanceof Error ? e.message : e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
