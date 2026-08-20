import { Nishoncha, Quti } from "@/components/ui";
import {
  INTEGRATSIYA,
  KIRISH_JOYI,
  MALUMOT_HAJMI,
  MAXFIYLIK,
  MAXFIYLIK_IZOHI,
  FOYDALANUVCHILAR_SONI,
  MUAMMO_HOLATI,
  MUAMMO_HOLATI_RANGI,
  MUAMMO_TURI,
  OQIBAT,
  SHOSHILINCHLIK,
  SHOSHILINCHLIK_RANGI,
  TAKRORLANISH,
  TASHKILOT_TURI,
  HUDUD,
  VOSITA,
  sanaMatni,
  sonMatni,
  telefonMatni,
} from "@/lib/labels";
import { soatMatni } from "@/lib/scoring";
import { hajmMatni } from "@/lib/uploads-client";
import type {
  AccessLocation,
  DataSensitivity,
  DataVolume,
  FrequencyUnit,
  IntegrationTarget,
  PainType,
  ProblemStatus,
  ToolUsed,
  Urgency,
  UsersCount,
  Consequence,
  OrgType,
  Region,
} from "@/generated/prisma/enums";

export type KartochkaMuammosi = {
  id: string;
  refCode: string;
  title: string;
  description: string;
  status: ProblemStatus;
  category: { name: string };
  organization: { name: string; type: OrgType; region: Region; district: string | null };

  painTypes: PainType[];
  currentProcess: string | null;
  toolsUsed: ToolUsed[];
  toolsNote: string | null;
  rolesInvolved: string[];

  frequency: number | null;
  frequencyUnit: FrequencyUnit | null;
  minutesPerCase: number | null;
  peopleAffected: number | null;
  citizensAffected: number | null;
  consequence: Consequence | null;
  urgency: Urgency;
  deadline: Date | null;
  deadlineReason: string | null;

  dataVolume: DataVolume | null;
  usersCount: UsersCount | null;
  dataSensitivity: DataSensitivity | null;
  integrations: IntegrationTarget[];
  integrationsNote: string | null;
  accessFrom: AccessLocation[];
  previousAttempt: boolean;
  previousAttemptNote: string | null;

  desiredOutcome: string | null;
  successMetric: string | null;
  contactName: string | null;
  contactPosition: string | null;
  contactPhone: string | null;

  monthlyHoursLost: number;
  completeness: number;
  createdAt: Date;

  attachments: { id: string; fileName: string; size: number }[];
  supporters: { organization: { name: string } }[];
};

function Bolim({
  sarlavha,
  children,
}: {
  sarlavha: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-chegara pt-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-matn-uchinchi">
        {sarlavha}
      </h2>
      {children}
    </section>
  );
}

function Juftlik({ yorliq, qiymat }: { yorliq: string; qiymat: React.ReactNode }) {
  if (qiymat === null || qiymat === undefined || qiymat === "") return null;
  return (
    <div>
      <dt className="text-sm text-matn-ikkilamchi">{yorliq}</dt>
      <dd className="mt-0.5 text-sm font-medium text-matn">{qiymat}</dd>
    </div>
  );
}

/**
 * Muammoning to'liq kartochkasi.
 * Rahbar buni "oldindan ko'rish"da, dasturchi esa omborda ko'radi —
 * shu tufayli rahbar dasturchi nimani ko'rishini aynan biladi.
 */
export function MuammoKartochkasi({
  muammo,
  aloqaKorsatilsin = false,
  yuklabOlishMumkin = false,
}: {
  muammo: KartochkaMuammosi;
  /** Aloqa ma'lumotlari faqat tasdiqlangan dasturchi va adminlarga ko'rsatiladi */
  aloqaKorsatilsin?: boolean;
  yuklabOlishMumkin?: boolean;
}) {
  const qollabSoni = muammo.supporters.length;

  return (
    <article className="space-y-6">
      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Nishoncha className={MUAMMO_HOLATI_RANGI[muammo.status]}>
            {MUAMMO_HOLATI[muammo.status]}
          </Nishoncha>
          <Nishoncha className={SHOSHILINCHLIK_RANGI[muammo.urgency]}>
            {SHOSHILINCHLIK[muammo.urgency]}
          </Nishoncha>
          <Nishoncha>{muammo.category.name}</Nishoncha>
          <span className="text-sm text-matn-uchinchi">{muammo.refCode}</span>
        </div>

        <h1 className="text-2xl font-semibold leading-snug tracking-tight text-matn">
          {muammo.title || "Sarlavha kiritilmagan"}
        </h1>

        <p className="mt-2 text-sm text-matn-ikkilamchi">
          {muammo.organization.name} · {TASHKILOT_TURI[muammo.organization.type]} ·{" "}
          {HUDUD[muammo.organization.region]}
          {muammo.organization.district ? `, ${muammo.organization.district}` : ""}
        </p>
      </header>

      {/* Asosiy raqamlar — dasturchi birinchi navbatda shularni ko'radi */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-asosiy-ochiq px-4 py-3">
          <p className="text-xs text-asosiy-quyuq/80">Oyiga yo'qotish</p>
          <p className="mt-0.5 text-lg font-semibold text-asosiy-quyuq">
            {soatMatni(muammo.monthlyHoursLost)}
          </p>
        </div>
        <div className="rounded-xl border border-chegara px-4 py-3">
          <p className="text-xs text-matn-ikkilamchi">Jalb qilingan xodim</p>
          <p className="mt-0.5 text-lg font-semibold text-matn">
            {muammo.peopleAffected ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-chegara px-4 py-3">
          <p className="text-xs text-matn-ikkilamchi">Ta'sirlangan fuqaro</p>
          <p className="mt-0.5 text-lg font-semibold text-matn">
            {muammo.citizensAffected ? sonMatni(muammo.citizensAffected) : "—"}
          </p>
        </div>
        <div
          className={
            qollabSoni > 0
              ? "rounded-xl bg-muvaffaqiyat-yuza px-4 py-3"
              : "rounded-xl border border-chegara px-4 py-3"
          }
        >
          <p className={qollabSoni > 0 ? "text-xs text-muvaffaqiyat/80" : "text-xs text-matn-ikkilamchi"}>
            Shu muammo bor tashkilot
          </p>
          <p
            className={
              qollabSoni > 0
                ? "mt-0.5 text-lg font-semibold text-muvaffaqiyat"
                : "mt-0.5 text-lg font-semibold text-matn"
            }
          >
            {qollabSoni + 1}
          </p>
        </div>
      </div>

      {qollabSoni > 0 && (
        <div className="rounded-lg bg-muvaffaqiyat-yuza px-4 py-3 text-sm text-muvaffaqiyat ring-1 ring-inset ring-muvaffaqiyat-chegara">
          <p className="font-medium">
            Bu muammo yana {qollabSoni} ta tashkilotda uchraydi
          </p>
          <p className="mt-1">
            {muammo.supporters.map((s) => s.organization.name).join(" · ")}
          </p>
        </div>
      )}

      <Bolim sarlavha="Muammo nima">
        <p className="whitespace-pre-line leading-relaxed text-matn">{muammo.description}</p>
        {muammo.painTypes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {muammo.painTypes.map((p) => (
              <li key={p}>
                <Nishoncha>{MUAMMO_TURI[p]}</Nishoncha>
              </li>
            ))}
          </ul>
        )}
      </Bolim>

      {muammo.currentProcess && (
        <Bolim sarlavha="Hozir bu ish qanday bajariladi">
          <p className="whitespace-pre-line leading-relaxed text-matn">
            {muammo.currentProcess}
          </p>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Juftlik
              yorliq="Ishlatilayotgan vositalar"
              qiymat={muammo.toolsUsed.map((t) => VOSITA[t]).join(", ")}
            />
            <Juftlik yorliq="Dastur/tizim nomi" qiymat={muammo.toolsNote} />
            <Juftlik
              yorliq="Jarayondagi lavozimlar"
              qiymat={muammo.rolesInvolved.join(", ")}
            />
          </dl>
        </Bolim>
      )}

      {muammo.attachments.length > 0 && (
        <Bolim sarlavha="Biriktirilgan fayllar">
          <ul className="space-y-2">
            {muammo.attachments.map((a) => (
              <li key={a.id}>
                {yuklabOlishMumkin ? (
                  <a
                    href={`/api/fayl/${a.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-chegara px-3 py-2 transition-colors hover:border-asosiy hover:bg-asosiy-ochiq"
                  >
                    <span className="truncate text-sm font-medium text-asosiy">{a.fileName}</span>
                    <span className="shrink-0 text-xs text-matn-uchinchi">
                      {hajmMatni(a.size)}
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-chegara px-3 py-2">
                    <span className="truncate text-sm text-matn">{a.fileName}</span>
                    <span className="shrink-0 text-xs text-matn-uchinchi">
                      {hajmMatni(a.size)}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Bolim>
      )}

      <Bolim sarlavha="Ko'lam va yo'qotish">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Juftlik
            yorliq="Takrorlanish"
            qiymat={
              muammo.frequency && muammo.frequencyUnit
                ? `${TAKRORLANISH[muammo.frequencyUnit]} ${muammo.frequency} marta`
                : null
            }
          />
          <Juftlik
            yorliq="Bir martaga ketadigan vaqt"
            qiymat={muammo.minutesPerCase ? `${muammo.minutesPerCase} daqiqa` : null}
          />
          <Juftlik
            yorliq="Hal qilinmasa"
            qiymat={muammo.consequence ? OQIBAT[muammo.consequence] : null}
          />
          <Juftlik
            yorliq="Muddat"
            qiymat={
              muammo.deadline
                ? `${sanaMatni(muammo.deadline)}${muammo.deadlineReason ? ` — ${muammo.deadlineReason}` : ""}`
                : null
            }
          />
        </dl>
      </Bolim>

      <Bolim sarlavha="Ma'lumot va cheklovlar">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Juftlik
            yorliq="Oylik ma'lumot hajmi"
            qiymat={muammo.dataVolume ? MALUMOT_HAJMI[muammo.dataVolume] : null}
          />
          <Juftlik
            yorliq="Foydalanuvchilar soni"
            qiymat={muammo.usersCount ? FOYDALANUVCHILAR_SONI[muammo.usersCount] : null}
          />
          <Juftlik
            yorliq="Kirish joyi"
            qiymat={muammo.accessFrom.map((a) => KIRISH_JOYI[a]).join(", ")}
          />
          <Juftlik
            yorliq="Integratsiya"
            qiymat={
              muammo.integrations.length > 0
                ? `${muammo.integrations.map((i) => INTEGRATSIYA[i]).join(", ")}${
                    muammo.integrationsNote ? ` — ${muammo.integrationsNote}` : ""
                  }`
                : "Kerak emas"
            }
          />
        </dl>

        {muammo.dataSensitivity && (
          <div className="mt-4 rounded-lg bg-ogohlantirish-yuza px-4 py-3 text-sm text-ogohlantirish ring-1 ring-inset ring-ogohlantirish-chegara">
            <p className="font-medium">Maxfiylik: {MAXFIYLIK[muammo.dataSensitivity]}</p>
            <p className="mt-1">{MAXFIYLIK_IZOHI[muammo.dataSensitivity]}</p>
          </div>
        )}

        {muammo.previousAttempt && (
          <div className="mt-4 rounded-lg border border-chegara px-4 py-3 text-sm">
            <p className="font-medium text-matn">Ilgari hal qilishga urinilgan</p>
            {muammo.previousAttemptNote && (
              <p className="mt-1 text-matn-ikkilamchi">{muammo.previousAttemptNote}</p>
            )}
          </div>
        )}
      </Bolim>

      {(muammo.desiredOutcome || muammo.successMetric) && (
        <Bolim sarlavha="Kutilayotgan natija">
          {muammo.desiredOutcome && (
            <p className="whitespace-pre-line leading-relaxed text-matn">
              {muammo.desiredOutcome}
            </p>
          )}
          {muammo.successMetric && (
            <div className="mt-4 rounded-lg bg-muvaffaqiyat-yuza px-4 py-3 text-sm text-muvaffaqiyat ring-1 ring-inset ring-muvaffaqiyat-chegara">
              <span className="font-medium">Muvaffaqiyat mezoni: </span>
              {muammo.successMetric}
            </div>
          )}
        </Bolim>
      )}

      <Bolim sarlavha="Aloqa">
        {aloqaKorsatilsin ? (
          <Quti className="bg-yuza">
            <p className="font-medium text-matn">{muammo.contactName}</p>
            {muammo.contactPosition && (
              <p className="text-sm text-matn-ikkilamchi">{muammo.contactPosition}</p>
            )}
            {muammo.contactPhone && (
              <a
                href={`tel:${muammo.contactPhone}`}
                className="mt-2 inline-block text-lg font-semibold text-asosiy hover:underline"
              >
                {telefonMatni(muammo.contactPhone)}
              </a>
            )}
            <p className="mt-2 text-sm text-matn-ikkilamchi">
              Yechimni telefon orqali bog'lanib taqdim eting.
            </p>
          </Quti>
        ) : (
          <p className="rounded-lg border border-dashed border-chegara px-4 py-3 text-sm text-matn-ikkilamchi">
            Aloqa ma'lumotlari faqat muammoni o'z zimmasiga olgan tasdiqlangan
            dasturchiga ko'rinadi.
          </p>
        )}
      </Bolim>
    </article>
  );
}
