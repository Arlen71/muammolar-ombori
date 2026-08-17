"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { qadamniSaqla } from "@/app/rahbar/actions";
import { Avtosaqlash } from "@/components/sehrgar/avtosaqlash";
import { OxshashOgohlantirish } from "@/components/sehrgar/oxshash-ogohlantirish";
import {
  BelgilashGuruhi,
  TanlovGuruhi,
  TegKiritish,
  YoqotishHisoblagichi,
} from "@/components/sehrgar/maydonlar";
import { Kiritish, KattaMatn, Maydon, Tanlov, Tugma, Xabar } from "@/components/ui";
import {
  INTEGRATSIYA,
  KIRISH_JOYI,
  MALUMOT_HAJMI,
  MAXFIYLIK,
  MAXFIYLIK_IZOHI,
  FOYDALANUVCHILAR_SONI,
  MUAMMO_TURI,
  OQIBAT,
  SHOSHILINCHLIK,
  VOSITA,
  variantlar,
} from "@/lib/labels";
import { QADAM_NOMLARI, type QadamRaqami } from "@/lib/problem-schema";
import type { AmalNatijasi } from "@/lib/validation";

/** Sahifadan keladigan muammo ma'lumoti (faqat sehrgar uchun kerakli maydonlar). */
export type SehrgarMuammosi = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  painTypes: string[];
  currentProcess: string | null;
  toolsUsed: string[];
  toolsNote: string | null;
  rolesInvolved: string[];
  frequency: number | null;
  frequencyUnit: "DAY" | "WEEK" | "MONTH" | "YEAR" | null;
  minutesPerCase: number | null;
  peopleAffected: number | null;
  citizensAffected: number | null;
  consequence: string | null;
  urgency: string;
  deadline: string | null;
  deadlineReason: string | null;
  dataVolume: string | null;
  usersCount: string | null;
  dataSensitivity: string | null;
  integrations: string[];
  integrationsNote: string | null;
  accessFrom: string[];
  previousAttempt: boolean;
  previousAttemptNote: string | null;
  desiredOutcome: string | null;
  successMetric: string | null;
  contactName: string | null;
  contactPosition: string | null;
  contactPhone: string | null;
};

const LAVOZIM_TAKLIFLARI = [
  "Kotib",
  "Bo'lim mudiri",
  "Rahbar",
  "Buxgalter",
  "Kadrlar inspektori",
  "Ijrochi xodim",
];

function KeyingiTugmasi({ qadam }: { qadam: QadamRaqami }) {
  const { pending } = useFormStatus();
  return (
    <Tugma type="submit" disabled={pending}>
      {pending ? "Saqlanmoqda…" : qadam < 5 ? "Saqlash va davom etish" : "Saqlash va ko'rish"}
    </Tugma>
  );
}

export function SehrgarFormasi({
  muammo,
  qadam,
  turkumlar,
}: {
  muammo: SehrgarMuammosi;
  qadam: QadamRaqami;
  turkumlar: { id: string; name: string }[];
}) {
  const [holat, amal] = useActionState<AmalNatijasi, FormData>(qadamniSaqla, {});
  const x = holat.maydonXatolari;

  return (
    <form action={amal} className="space-y-6" noValidate>
      <input type="hidden" name="muammoId" value={muammo.id} />
      <input type="hidden" name="qadam" value={qadam} />

      <div>
        <h1 className="text-xl font-semibold tracking-tight text-matn">
          {QADAM_NOMLARI[qadam].toliq}
        </h1>
      </div>

      {holat.xato && <Xabar turi="xato">{holat.xato}</Xabar>}

      {qadam === 1 && (
        <>
          <Maydon
            yorliq="Muammoni bir jumlada ayting"
            htmlFor="title"
            majburiy
            xato={x?.title}
            namuna="Ta'tilga chiqish arizasi qo'lda yoziladi va yo'lda yo'qolib qoladi"
          >
            <Kiritish
              id="title"
              name="title"
              defaultValue={muammo.title}
              maxLength={120}
              placeholder="Nima noto'g'ri ketyapti?"
              aria-invalid={!!x?.title}
            />
          </Maydon>

          <Maydon
            yorliq="Muammoni batafsil tushuntiring"
            htmlFor="description"
            majburiy
            xato={x?.description}
            izoh="Bu ishni umuman bilmaydigan odamga tushuntirgandek yozing. Nima sodir bo'ladi, nima uchun bu muammo, kimga xalaqit beradi?"
          >
            <KattaMatn
              id="description"
              name="description"
              defaultValue={muammo.description}
              rows={7}
              placeholder="Masalan: Xodim ta'tilga chiqmoqchi bo'lsa, qo'lda ariza yozadi. Ariza uch kishidan imzo olishi kerak…"
              aria-invalid={!!x?.description}
            />
          </Maydon>

          <OxshashOgohlantirish
            muammoId={muammo.id}
            boshlangichSarlavha={muammo.title}
          />

          <Maydon yorliq="Bu qaysi sohaga tegishli?" htmlFor="categoryId" majburiy xato={x?.categoryId}>
            <Tanlov id="categoryId" name="categoryId" defaultValue={muammo.categoryId}>
              {turkumlar.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Tanlov>
          </Maydon>

          <Maydon
            yorliq="Muammo nimada namoyon bo'ladi?"
            majburiy
            xato={x?.painTypes}
            izoh="Mos keladiganlarning barchasini belgilang."
          >
            <BelgilashGuruhi
              name="painTypes"
              variantlar={variantlar(MUAMMO_TURI)}
              boshlangich={muammo.painTypes}
            />
          </Maydon>
        </>
      )}

      {qadam === 2 && (
        <>
          <Xabar turi="malumot">
            Bu qadam dasturchi uchun eng qimmatli. U hozirgi jarayonni tushunmasa, yechim
            ham mos kelmaydi.
          </Xabar>

          <Maydon
            yorliq="Bu ish hozir bosqichma-bosqich qanday bajariladi?"
            htmlFor="currentProcess"
            majburiy
            xato={x?.currentProcess}
            izoh="Har bir qadamni yangi qatordan yozing: kim boshlaydi → kimga boradi → kim tasdiqlaydi → nima bilan tugaydi."
            namuna="1. Xodim qo'lda ariza yozadi. 2. Bo'lim mudiri imzolaydi. 3. Kadrlar bo'limi qolgan ta'til kunini tekshiradi…"
          >
            <KattaMatn
              id="currentProcess"
              name="currentProcess"
              defaultValue={muammo.currentProcess ?? ""}
              rows={8}
              placeholder={"1. \n2. \n3. "}
              aria-invalid={!!x?.currentProcess}
            />
          </Maydon>

          <Maydon
            yorliq="Hozir nimadan foydalanasiz?"
            majburiy
            xato={x?.toolsUsed}
            izoh="Ishni bajarish uchun ishlatiladigan hamma narsani belgilang."
          >
            <BelgilashGuruhi
              name="toolsUsed"
              variantlar={variantlar(VOSITA)}
              boshlangich={muammo.toolsUsed}
            />
          </Maydon>

          <Maydon
            yorliq="Dastur yoki tizim nomi"
            htmlFor="toolsNote"
            izoh="Yuqorida «Ichki dastur» yoki «Davlat axborot tizimi» ni belgilagan bo'lsangiz, nomini yozing."
          >
            <Kiritish
              id="toolsNote"
              name="toolsNote"
              defaultValue={muammo.toolsNote ?? ""}
              placeholder="Masalan: 1C Buxgalteriya 8.3, E-ijro"
            />
          </Maydon>

          <Maydon
            yorliq="Jarayonda qaysi lavozimlar qatnashadi?"
            majburiy
            xato={x?.rolesInvolved}
            izoh="Dasturchi shundan tizimda kimga qanday huquq kerakligini tushunadi."
          >
            <TegKiritish
              name="rolesInvolved"
              boshlangich={muammo.rolesInvolved}
              placeholder="Lavozim nomini yozing va Enter bosing"
              takliflar={LAVOZIM_TAKLIFLARI}
            />
          </Maydon>
        </>
      )}

      {qadam === 3 && (
        <>
          <YoqotishHisoblagichi
            boshlangich={{
              frequency: muammo.frequency,
              frequencyUnit: muammo.frequencyUnit,
              minutesPerCase: muammo.minutesPerCase,
              peopleAffected: muammo.peopleAffected,
            }}
          />
          {(x?.frequency || x?.minutesPerCase || x?.peopleAffected || x?.frequencyUnit) && (
            <Xabar turi="xato">
              {x?.peopleAffected ?? x?.frequency ?? x?.frequencyUnit ?? x?.minutesPerCase}
            </Xabar>
          )}

          <Maydon
            yorliq="Bu muammo fuqarolarga ham ta'sir qiladimi?"
            htmlFor="citizensAffected"
            izoh="Ta'sir qilsa, taxminan necha nafar fuqaro ekanini yozing. Bilmasangiz, bo'sh qoldiring."
            xato={x?.citizensAffected}
          >
            <Kiritish
              id="citizensAffected"
              name="citizensAffected"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={muammo.citizensAffected ?? ""}
              placeholder="Masalan: 6500"
            />
          </Maydon>

          <Maydon
            yorliq="Bu muammo hal qilinmasa nima bo'ladi?"
            majburiy
            xato={x?.consequence}
          >
            <TanlovGuruhi
              name="consequence"
              variantlar={variantlar(OQIBAT)}
              boshlangich={muammo.consequence}
            />
          </Maydon>

          <Maydon yorliq="Muammo qanchalik shoshilinch?" majburiy xato={x?.urgency}>
            <TanlovGuruhi
              name="urgency"
              variantlar={variantlar(SHOSHILINCHLIK)}
              boshlangich={muammo.urgency}
              ustunlar={2}
            />
          </Maydon>

          <div className="grid gap-4 sm:grid-cols-2">
            <Maydon yorliq="Muddat bormi?" htmlFor="deadline" izoh="Ixtiyoriy">
              <Kiritish
                id="deadline"
                name="deadline"
                type="date"
                defaultValue={muammo.deadline ?? ""}
              />
            </Maydon>
            <Maydon yorliq="Muddat nima bilan bog'liq?" htmlFor="deadlineReason" izoh="Ixtiyoriy">
              <Kiritish
                id="deadlineReason"
                name="deadlineReason"
                defaultValue={muammo.deadlineReason ?? ""}
                placeholder="Masalan: yangi o'quv yili boshlanishi"
              />
            </Maydon>
          </div>
        </>
      )}

      {qadam === 4 && (
        <>
          <Xabar turi="malumot">
            Bu savollar oddiy ko'rinadi, lekin dasturchi aynan shulardan tizimning hajmi,
            xavfsizlik talablari va qancha vaqt ketishini aniqlaydi.
          </Xabar>

          <Maydon
            yorliq="Oyiga taxminan nechta yozuv yoki hujjat to'planadi?"
            majburiy
            xato={x?.dataVolume}
            izoh="Aniq bilmasangiz, eng yaqin variantni tanlang."
          >
            <TanlovGuruhi
              name="dataVolume"
              variantlar={variantlar(MALUMOT_HAJMI)}
              boshlangich={muammo.dataVolume}
              ustunlar={2}
            />
          </Maydon>

          <Maydon
            yorliq="Dasturdan necha kishi foydalanadi?"
            majburiy
            xato={x?.usersCount}
          >
            <TanlovGuruhi
              name="usersCount"
              variantlar={variantlar(FOYDALANUVCHILAR_SONI)}
              boshlangich={muammo.usersCount}
              ustunlar={2}
            />
          </Maydon>

          <Maydon
            yorliq="Ma'lumot qanchalik maxfiy?"
            majburiy
            xato={x?.dataSensitivity}
            izoh="Bu tizimning xavfsizlik talablarini belgilaydi."
          >
            <TanlovGuruhi
              name="dataSensitivity"
              variantlar={(
                Object.keys(MAXFIYLIK) as (keyof typeof MAXFIYLIK)[]
              ).map((k) => ({
                value: k,
                label: MAXFIYLIK[k],
                izoh: MAXFIYLIK_IZOHI[k],
              }))}
              boshlangich={muammo.dataSensitivity}
            />
          </Maydon>

          <Maydon
            yorliq="Boshqa tizim bilan bog'lanish kerakmi?"
            izoh="Kerak bo'lmasa, hech narsani belgilamang."
          >
            <BelgilashGuruhi
              name="integrations"
              variantlar={variantlar(INTEGRATSIYA)}
              boshlangich={muammo.integrations}
            />
          </Maydon>

          <Maydon yorliq="Integratsiya haqida izoh" htmlFor="integrationsNote">
            <Kiritish
              id="integrationsNote"
              name="integrationsNote"
              defaultValue={muammo.integrationsNote ?? ""}
              placeholder="Qaysi tizim, qanday ma'lumot almashinadi"
            />
          </Maydon>

          <Maydon yorliq="Dasturdan qayerdan foydalaniladi?" majburiy xato={x?.accessFrom}>
            <BelgilashGuruhi
              name="accessFrom"
              variantlar={variantlar(KIRISH_JOYI)}
              boshlangich={muammo.accessFrom}
            />
          </Maydon>

          <Maydon yorliq="Bu muammoni ilgari hal qilishga urinilganmi?">
            <label className="flex items-center gap-2.5 rounded-lg border border-chegara bg-white p-3 text-sm">
              <input
                type="checkbox"
                name="previousAttempt"
                defaultChecked={muammo.previousAttempt}
                className="size-4 accent-[var(--color-asosiy)]"
              />
              Ha, urinilgan
            </label>
          </Maydon>

          <Maydon
            yorliq="Oldingi urinish nega natija bermadi?"
            htmlFor="previousAttemptNote"
            izoh="Bu dasturchini o'sha xatoni takrorlashdan saqlaydi."
          >
            <KattaMatn
              id="previousAttemptNote"
              name="previousAttemptNote"
              defaultValue={muammo.previousAttemptNote ?? ""}
              rows={3}
              placeholder="Masalan: tayyor dastur sotib olingan, lekin bizning hisob-kitob qoidalarimizga moslashmagan"
            />
          </Maydon>
        </>
      )}

      {qadam === 5 && (
        <>
          <Maydon
            yorliq="Muammo hal bo'lsa, ish qanday ketishini xohlaysiz?"
            htmlFor="desiredOutcome"
            majburiy
            xato={x?.desiredOutcome}
            izoh="Texnik yechimni emas, natijani tasvirlang."
            namuna="Xodim ta'tilni tizimda so'raydi, mudir telefonidan tasdiqlaydi, qolgan ta'til kunlari o'zi hisoblanadi"
          >
            <KattaMatn
              id="desiredOutcome"
              name="desiredOutcome"
              defaultValue={muammo.desiredOutcome ?? ""}
              rows={5}
              aria-invalid={!!x?.desiredOutcome}
            />
          </Maydon>

          <Maydon
            yorliq="Nimani ko'rsak «hal bo'ldi» deymiz?"
            htmlFor="successMetric"
            majburiy
            xato={x?.successMetric}
            izoh="O'lchanadigan bitta natija yozing."
            namuna="Ariza 3 kunda emas, 1 soatda tasdiqlanadi"
          >
            <Kiritish
              id="successMetric"
              name="successMetric"
              defaultValue={muammo.successMetric ?? ""}
              aria-invalid={!!x?.successMetric}
            />
          </Maydon>

          <div className="rounded-xl border border-chegara bg-yuza p-5">
            <h2 className="font-medium text-matn">Dasturchi kim bilan bog'lansin?</h2>
            <p className="mt-1 text-sm text-matn-ikkilamchi">
              Yechim telefon orqali taqdim etiladi. Bu ma'lumot faqat tasdiqlangan
              dasturchilarga ko'rinadi.
            </p>

            <div className="mt-4 space-y-4">
              <Maydon yorliq="Mas'ul shaxs" htmlFor="contactName" majburiy xato={x?.contactName}>
                <Kiritish
                  id="contactName"
                  name="contactName"
                  defaultValue={muammo.contactName ?? ""}
                  aria-invalid={!!x?.contactName}
                />
              </Maydon>
              <div className="grid gap-4 sm:grid-cols-2">
                <Maydon yorliq="Lavozimi" htmlFor="contactPosition">
                  <Kiritish
                    id="contactPosition"
                    name="contactPosition"
                    defaultValue={muammo.contactPosition ?? ""}
                  />
                </Maydon>
                <Maydon
                  yorliq="Telefon raqami"
                  htmlFor="contactPhone"
                  majburiy
                  xato={x?.contactPhone}
                >
                  <Kiritish
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    inputMode="tel"
                    defaultValue={muammo.contactPhone ?? ""}
                    placeholder="+998 90 123 45 67"
                    aria-invalid={!!x?.contactPhone}
                  />
                </Maydon>
              </div>
            </div>
          </div>
        </>
      )}

      <footer className="flex flex-wrap items-center gap-3 border-t border-chegara pt-5">
        {qadam > 1 && (
          <Link href={`/rahbar/muammo/${muammo.id}/${qadam - 1}`}>
            <Tugma type="button" korinish="ikkilamchi">
              Orqaga
            </Tugma>
          </Link>
        )}
        <KeyingiTugmasi qadam={qadam} />
        <div className="ml-auto">
          <Avtosaqlash muammoId={muammo.id} qadam={qadam} />
        </div>
      </footer>
    </form>
  );
}
