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
} from "@/components/ui";
import { TUMANLAR } from "@/lib/hudud";
import { TASHKILOT_TURI, sonMatni, variantlar } from "@/lib/labels";
import { TashkilotQoshish } from "./tashkilot-formasi";

export const metadata: Metadata = { title: "Tashkilotlar" };

export default async function TashkilotlarSahifasi() {
  const tashkilotlar = await db.organization.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, problems: true } },
    },
  });

  return (
    <>
      {/*
        Yaratish formasi ilgari o'ng ustunda doim ochiq turardi va ro'yxatga
        atigi ikki uchdan bir joy qolardi. Ammo administrator bu sahifaga
        asosan ro'yxatni ko'rish uchun kiradi, tashkilot esa kamdan-kam
        qo'shiladi. Endi forma modalda — ro'yxat butun kenglikni oladi va
        jadvalga sig'adi.
      */}
      <SahifaSarlavhasi
        sarlavha="Tashkilotlar"
        izoh={`${tashkilotlar.length} ta tashkilot ro'yxatga olingan`}
        amal={
          <TashkilotQoshish turlar={variantlar(TASHKILOT_TURI)} tumanlar={TUMANLAR} />
        }
      />

      <Jadval>
        <JadvalBosh>
          <JadvalQator className="hover:bg-transparent">
            <JadvalSarlavha className="w-full">Tashkilot</JadvalSarlavha>
            <JadvalSarlavha>Turi</JadvalSarlavha>
            <JadvalSarlavha>Tuman</JadvalSarlavha>
            <JadvalSarlavha className="text-right">Foydalanuvchi</JadvalSarlavha>
            <JadvalSarlavha className="text-right">Muammo</JadvalSarlavha>
          </JadvalQator>
        </JadvalBosh>

        <JadvalTana>
          {tashkilotlar.map((t) => (
            <JadvalQator key={t.id}>
              <JadvalKatak>
                <span className="font-medium">{t.name}</span>
                {t.stir && (
                  <span className="mt-0.5 block text-xs text-matn-uchinchi">
                    STIR {t.stir}
                  </span>
                )}
              </JadvalKatak>
              <JadvalKatak>{TASHKILOT_TURI[t.type]}</JadvalKatak>
              <JadvalKatak>
                {t.district ?? <span className="text-matn-uchinchi">—</span>}
              </JadvalKatak>
              <JadvalKatak className="text-right tabular-nums">
                {sonMatni(t._count.users)}
              </JadvalKatak>
              <JadvalKatak className="text-right tabular-nums">
                {sonMatni(t._count.problems)}
              </JadvalKatak>
            </JadvalQator>
          ))}
        </JadvalTana>
      </Jadval>
    </>
  );
}
