import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import {
  Jadval,
  JadvalBosh,
  JadvalKatak,
  JadvalQator,
  JadvalSarlavha,
  JadvalTana,
  Nishoncha,
} from "@/components/ui";
import { FOYDALANUVCHI_HOLATI, ROL, sanaMatni, telefonMatni, variantlar } from "@/lib/labels";
import { FoydalanuvchiQoshish, ParolTiklashTugmasi } from "./foydalanuvchi-formasi";

export const metadata: Metadata = { title: "Foydalanuvchilar" };

const HOLAT_RANGI = {
  PENDING: "bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara",
  ACTIVE: "bg-muvaffaqiyat-yuza text-muvaffaqiyat ring-muvaffaqiyat-chegara",
  BLOCKED: "bg-xato-yuza text-xato ring-xato-chegara",
} as const;

export default async function FoydalanuvchilarSahifasi() {
  const [foydalanuvchilar, tashkilotlar] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { fullName: "asc" }],
      include: { organization: { select: { name: true } } },
    }),
    db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <SahifaSarlavhasi
        sarlavha="Foydalanuvchilar"
        izoh="Tizimga kirish huquqini faqat administrator beradi — o'z-o'zidan ro'yxatdan o'tish yo'q."
        amal={
          <FoydalanuvchiQoshish rollar={variantlar(ROL)} tashkilotlar={tashkilotlar} />
        }
      />

      <Jadval>
        <JadvalBosh>
          <JadvalQator className="hover:bg-transparent">
            <JadvalSarlavha className="w-full">Foydalanuvchi</JadvalSarlavha>
            <JadvalSarlavha>Tashkilot</JadvalSarlavha>
            {/*
              Rol va holat bitta ustunda. Alohida turganda ular jadvalni
              ekrandan chiqarib yuborardi: "Tashkilot rahbari" va
              "Tasdiqlanishi kutilmoqda" nishonchalari uzun va satrga
              bo'linmaydi. Ustma-ust qo'yilganda esa ikkalasi ham bitta
              tor ustunga sig'adi.
            */}
            <JadvalSarlavha>Rol va holat</JadvalSarlavha>
            <JadvalSarlavha>Oxirgi kirish</JadvalSarlavha>
            {/*
              Sarlavha ko'rinadigan matn, `sr-only` emas.

              `sr-only` element `position: absolute` bo'ladi va o'zining
              oqimdagi joyida qoladi. Gorizontal siljiydigan jadvalda bu
              joy ekrandan ancha o'ngda bo'lishi mumkin — natijada hujjat
              kengligi o'sib, BUTUN SAHIFA yon tomonga siljiy boshlaydi.
              375px da bu 267 pikselni tashkil qilgan.
            */}
            <JadvalSarlavha>Amal</JadvalSarlavha>
          </JadvalQator>
        </JadvalBosh>

        <JadvalTana>
          {foydalanuvchilar.map((f) => (
            <JadvalQator key={f.id}>
              <JadvalKatak>
                <span className="font-medium">{f.fullName}</span>
                <span className="mt-0.5 block text-xs text-matn-uchinchi">
                  {telefonMatni(f.phone)}
                  {f.position ? ` · ${f.position}` : ""}
                </span>
              </JadvalKatak>

              <JadvalKatak className="max-w-48">
                <span className="block truncate">
                  {f.organization?.name ?? (
                    <span className="text-matn-uchinchi">Biriktirilmagan</span>
                  )}
                </span>
              </JadvalKatak>

              <JadvalKatak>
                <div className="flex flex-col items-start gap-1">
                  <Nishoncha>{ROL[f.role]}</Nishoncha>
                  <Nishoncha className={HOLAT_RANGI[f.status]}>
                    {FOYDALANUVCHI_HOLATI[f.status]}
                  </Nishoncha>
                </div>
              </JadvalKatak>

              <JadvalKatak className="whitespace-nowrap text-sm text-matn-ikkilamchi">
                {f.lastLoginAt ? (
                  sanaMatni(f.lastLoginAt)
                ) : (
                  <span className="text-matn-uchinchi">hali kirmagan</span>
                )}
              </JadvalKatak>

              <JadvalKatak className="text-right">
                <ParolTiklashTugmasi userId={f.id} />
              </JadvalKatak>
            </JadvalQator>
          ))}
        </JadvalTana>
      </Jadval>
    </>
  );
}
