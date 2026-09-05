import type { Metadata } from "next";

import { db } from "@/lib/db";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Ustunlar } from "@/components/grafik";
import {
  Jadval,
  JadvalBosh,
  JadvalKatak,
  JadvalQator,
  JadvalSarlavha,
  JadvalTana,
  KPIKartochka,
  Nishoncha,
  Quti,
  QutiSarlavha,
} from "@/components/ui";
import { TUMANLAR } from "@/lib/hudud";
import { TASHKILOT_TURI, sanaMatni, sonMatni, variantlar } from "@/lib/labels";
import { TashkilotQoshish } from "./tashkilot-formasi";

export const metadata: Metadata = { title: "Tashkilotlar" };

/** Omborga tushgan (ya'ni moderatsiyadan o'tgan) holatlar. */
const OMBORDAGI = ["APPROVED", "TAKEN", "SOLUTION_OFFERED", "RESOLVED"] as const;

export default async function TashkilotlarSahifasi() {
  /*
    Pilotning asosiy savoli: qaysi tashkilot ishtirok etyapti, qaysi biri
    yo'q. Shuning uchun har bir tashkilot uchun uchta narsa kerak:
    nechta muammo yuborgan, oxirgi marta qachon, va umuman kirganmi.

    `problems` munosabati bo'yicha `_count` yetarli emas — u qoralamalarni
    ham sanaydi. Qoralama esa hali yuborilmagan, ya'ni tashkilot
    ishtirok etdi deb hisoblanmaydi. Shu sababli ikkita alohida son.
  */
  const tashkilotlar = await db.organization.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      type: true,
      district: true,
      stir: true,
      _count: { select: { users: true } },
      problems: {
        select: { status: true, submittedAt: true, createdAt: true },
      },
    },
  });

  const qator = tashkilotlar.map((t) => {
    const yuborilgan = t.problems.filter((m) => m.status !== "DRAFT");
    const qoralama = t.problems.length - yuborilgan.length;

    // Oxirgi faoliyat: yuborilgan muammolar ichidagi eng kech sana
    const oxirgi = yuborilgan.reduce<Date | null>((eng, m) => {
      const sana = m.submittedAt ?? m.createdAt;
      return eng === null || sana > eng ? sana : eng;
    }, null);

    return {
      id: t.id,
      nomi: t.name,
      turi: t.type,
      tuman: t.district,
      stir: t.stir,
      foydalanuvchilar: t._count.users,
      yuborilgan: yuborilgan.length,
      omborda: yuborilgan.filter((m) =>
        (OMBORDAGI as readonly string[]).includes(m.status)
      ).length,
      qoralama,
      oxirgi,
    };
  });

  const faol = qator.filter((t) => t.yuborilgan > 0);
  const jim = qator.filter((t) => t.yuborilgan === 0);

  /*
    Ro'yxat tartibi: ishtirok etmaganlar TEPADA.

    Alifbo tartibi bu sahifada foydasiz — administrator bu yerga
    "kim qolib ketdi?" degan savol bilan keladi, va javob ro'yxatning
    o'rtasiga sochilib ketmasligi kerak. Jim tashkilotlar tepada, keyin
    eng kam yuborganlar.
  */
  const tartiblangan = [
    ...jim.sort((a, b) => a.nomi.localeCompare(b.nomi, "uz")),
    ...faol.sort((a, b) => a.yuborilgan - b.yuborilgan),
  ];

  const ustunMalumoti = faol
    .slice()
    .sort((a, b) => b.yuborilgan - a.yuborilgan)
    .slice(0, 8)
    .map((t) => ({ yorliq: t.nomi, qiymat: t.yuborilgan }));

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
        izoh={`${tashkilotlar.length} ta tashkilot · ${faol.length} tasi muammo yuborgan`}
        amal={
          <TashkilotQoshish turlar={variantlar(TASHKILOT_TURI)} tumanlar={TUMANLAR} />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPIKartochka yorliq="Jami tashkilot" qiymat={tashkilotlar.length} />
        <KPIKartochka
          yorliq="Muammo yuborgan"
          qiymat={faol.length}
          izoh={`${Math.round((faol.length / Math.max(tashkilotlar.length, 1)) * 100)}% qamrov`}
        />
        <KPIKartochka
          yorliq="Hali yubormagan"
          qiymat={jim.length}
          izoh={jim.length > 0 ? "Ular bilan bog'lanish kerak" : "Hammasi ishtirok etdi"}
          className={jim.length > 0 ? "border-ogohlantirish-chegara" : undefined}
        />
        <KPIKartochka
          yorliq="Omborga tushgan"
          qiymat={qator.reduce((s, t) => s + t.omborda, 0)}
          izoh="Dasturchilarga ko'rinadi"
        />
      </div>

      {ustunMalumoti.length > 0 && (
        <Quti className="mb-6">
          <QutiSarlavha
            sarlavha="Tashkilotlar bo'yicha yuborilgan muammolar"
            izoh="Faqat yuborilganlar — qoralamalar hisobga olinmaydi."
            className="mb-4"
          />
          <Ustunlar malumot={ustunMalumoti} />
        </Quti>
      )}

      <Jadval>
        <JadvalBosh>
          <JadvalQator className="hover:bg-transparent">
            <JadvalSarlavha className="w-full">Tashkilot</JadvalSarlavha>
            <JadvalSarlavha>Tuman</JadvalSarlavha>
            <JadvalSarlavha>Holati</JadvalSarlavha>
            <JadvalSarlavha className="text-right">Yuborgan</JadvalSarlavha>
            <JadvalSarlavha className="text-right">Omborda</JadvalSarlavha>
            <JadvalSarlavha>Oxirgi marta</JadvalSarlavha>
          </JadvalQator>
        </JadvalBosh>

        <JadvalTana>
          {tartiblangan.map((t) => (
            <JadvalQator key={t.id}>
              <JadvalKatak>
                <span className="font-medium">{t.nomi}</span>
                <span className="mt-0.5 block text-xs text-matn-uchinchi">
                  {TASHKILOT_TURI[t.turi]}
                  {t.foydalanuvchilar === 0 && " · foydalanuvchi yo'q"}
                  {t.qoralama > 0 && ` · ${t.qoralama} ta qoralama`}
                </span>
              </JadvalKatak>

              <JadvalKatak className="whitespace-nowrap">
                {t.tuman ?? <span className="text-matn-uchinchi">—</span>}
              </JadvalKatak>

              <JadvalKatak>
                {/*
                  Uchta holat, va ular bir-biridan farq qiladi:
                    · foydalanuvchi yo'q — akkaunt hali yaratilmagan,
                      ya'ni tashkilot ayblanmaydi, ish administratorda;
                    · yubormagan — akkaunt bor, lekin foydalanilmayapti;
                    · faol — ishtirok etyapti.
                  Bularni bitta "yo'q" ga birlashtirsak, administrator
                  kimga qo'ng'iroq qilishini bilmay qoladi.
                */}
                {t.foydalanuvchilar === 0 ? (
                  <Nishoncha>Akkaunt yo&apos;q</Nishoncha>
                ) : t.yuborilgan === 0 ? (
                  <Nishoncha className="bg-ogohlantirish-yuza text-ogohlantirish ring-ogohlantirish-chegara">
                    Yubormagan
                  </Nishoncha>
                ) : (
                  <Nishoncha className="bg-muvaffaqiyat-yuza text-muvaffaqiyat ring-muvaffaqiyat-chegara">
                    Faol
                  </Nishoncha>
                )}
              </JadvalKatak>

              <JadvalKatak className="text-right tabular-nums">
                {t.yuborilgan > 0 ? (
                  sonMatni(t.yuborilgan)
                ) : (
                  <span className="text-matn-uchinchi">0</span>
                )}
              </JadvalKatak>

              <JadvalKatak className="text-right tabular-nums">
                {t.omborda > 0 ? (
                  sonMatni(t.omborda)
                ) : (
                  <span className="text-matn-uchinchi">0</span>
                )}
              </JadvalKatak>

              <JadvalKatak className="whitespace-nowrap text-sm text-matn-ikkilamchi">
                {t.oxirgi ? (
                  sanaMatni(t.oxirgi)
                ) : (
                  <span className="text-matn-uchinchi">hech qachon</span>
                )}
              </JadvalKatak>
            </JadvalQator>
          ))}
        </JadvalTana>
      </Jadval>
    </>
  );
}
