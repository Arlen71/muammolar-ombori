"use client";

import { useState } from "react";

import { Kiritish, Tanlov } from "@/components/ui";
import { cn } from "@/lib/utils";
import { oylikYoqotilganSoat, soatMatni } from "@/lib/scoring";
import { TAKRORLANISH, sonMatni } from "@/lib/labels";
import type { FrequencyUnit } from "@/generated/prisma/enums";

// ─── Ko'p tanlovli belgilash guruhi ──────────────────────────────────

export function BelgilashGuruhi({
  name,
  variantlar,
  boshlangich = [],
  ustunlar = 2,
}: {
  name: string;
  variantlar: { value: string; label: string }[];
  boshlangich?: string[];
  ustunlar?: 1 | 2;
}) {
  const [tanlangan, setTanlangan] = useState<Set<string>>(new Set(boshlangich));

  return (
    <div
      className={cn("grid gap-2", ustunlar === 2 ? "sm:grid-cols-2" : "grid-cols-1")}
      role="group"
    >
      {variantlar.map((v) => {
        const belgilangan = tanlangan.has(v.value);
        return (
          <label
            key={v.value}
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
              belgilangan
                ? "border-asosiy bg-asosiy-ochiq"
                : "border-chegara bg-white hover:bg-slate-50"
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={v.value}
              defaultChecked={belgilangan}
              onChange={(e) =>
                setTanlangan((oldingi) => {
                  const yangi = new Set(oldingi);
                  if (e.target.checked) yangi.add(v.value);
                  else yangi.delete(v.value);
                  return yangi;
                })
              }
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-asosiy)]"
            />
            <span className={belgilangan ? "text-asosiy-quyuq" : "text-matn"}>{v.label}</span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Bitta tanlovli guruh (radio) ────────────────────────────────────

export function TanlovGuruhi({
  name,
  variantlar,
  boshlangich,
  ustunlar = 1,
}: {
  name: string;
  variantlar: { value: string; label: string; izoh?: string }[];
  boshlangich?: string | null;
  ustunlar?: 1 | 2;
}) {
  const [tanlangan, setTanlangan] = useState(boshlangich ?? "");

  return (
    <div
      className={cn("grid gap-2", ustunlar === 2 ? "sm:grid-cols-2" : "grid-cols-1")}
      role="radiogroup"
    >
      {variantlar.map((v) => {
        const belgilangan = tanlangan === v.value;
        return (
          <label
            key={v.value}
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors",
              belgilangan
                ? "border-asosiy bg-asosiy-ochiq"
                : "border-chegara bg-white hover:bg-slate-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={v.value}
              checked={belgilangan}
              onChange={() => setTanlangan(v.value)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--color-asosiy)]"
            />
            <span>
              <span className={cn("block", belgilangan ? "text-asosiy-quyuq" : "text-matn")}>
                {v.label}
              </span>
              {v.izoh && (
                <span className="mt-0.5 block text-xs text-matn-ikkilamchi">{v.izoh}</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Teg ro'yxati (lavozimlar) ───────────────────────────────────────

export function TegKiritish({
  name,
  boshlangich = [],
  placeholder,
  takliflar = [],
}: {
  name: string;
  boshlangich?: string[];
  placeholder?: string;
  takliflar?: string[];
}) {
  const [teglar, setTeglar] = useState<string[]>(boshlangich);
  const [matn, setMatn] = useState("");

  function qosh(qiymat: string) {
    const t = qiymat.trim();
    if (!t || teglar.includes(t)) return;
    setTeglar([...teglar, t]);
    setMatn("");
  }

  const qolganTakliflar = takliflar.filter((t) => !teglar.includes(t));

  return (
    <div className="space-y-2">
      {/* Server actionga shu yashirin maydonlar ketadi */}
      {teglar.map((t) => (
        <input key={t} type="hidden" name={name} value={t} />
      ))}

      {teglar.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {teglar.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-1.5 rounded-lg bg-asosiy-ochiq py-1 pl-3 pr-1.5 text-sm text-asosiy-quyuq"
            >
              {t}
              <button
                type="button"
                onClick={() => setTeglar(teglar.filter((x) => x !== t))}
                className="rounded p-0.5 text-asosiy hover:bg-blue-100"
                aria-label={`«${t}» ni o'chirish`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Kiritish
          value={matn}
          onChange={(e) => setMatn(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              qosh(matn);
            }
          }}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => qosh(matn)}
          className="shrink-0 rounded-lg border border-chegara px-4 text-sm font-medium text-matn-ikkilamchi hover:bg-slate-50"
        >
          Qo'shish
        </button>
      </div>

      {qolganTakliflar.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="py-1 text-xs text-matn-uchinchi">Tez qo'shish:</span>
          {qolganTakliflar.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => qosh(t)}
              className="rounded-md border border-dashed border-chegara px-2 py-1 text-xs text-matn-ikkilamchi hover:border-asosiy hover:text-asosiy"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Jonli yo'qotish hisoblagichi (3-qadam) ──────────────────────────

/**
 * Rahbar raqamlarni kiritayotganda oylik yo'qotishni darhol ko'rsatadi.
 *
 * Bu shunchaki bezak emas: raqamning jonli o'zgarishi rahbarga muammoning
 * haqiqiy narxini ko'rsatadi va uni aniqroq baho berishga undaydi.
 */
export function YoqotishHisoblagichi({
  boshlangich,
}: {
  boshlangich: {
    frequency: number | null;
    frequencyUnit: FrequencyUnit | null;
    minutesPerCase: number | null;
    peopleAffected: number | null;
  };
}) {
  const [qiymat, setQiymat] = useState({
    frequency: boshlangich.frequency ?? ("" as number | ""),
    frequencyUnit: boshlangich.frequencyUnit ?? ("" as FrequencyUnit | ""),
    minutesPerCase: boshlangich.minutesPerCase ?? ("" as number | ""),
    peopleAffected: boshlangich.peopleAffected ?? ("" as number | ""),
  });

  const soat = oylikYoqotilganSoat({
    frequency: qiymat.frequency === "" ? null : Number(qiymat.frequency),
    frequencyUnit: qiymat.frequencyUnit === "" ? null : qiymat.frequencyUnit,
    minutesPerCase: qiymat.minutesPerCase === "" ? null : Number(qiymat.minutesPerCase),
    peopleAffected: qiymat.peopleAffected === "" ? null : Number(qiymat.peopleAffected),
  });

  const yil = Math.round(soat * 12);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="peopleAffected" className="block text-sm font-medium text-matn">
          Necha xodim shu ishni bajaradi? <span className="text-xato">*</span>
        </label>
        <p className="text-sm text-matn-ikkilamchi">
          Jarayonda muntazam qatnashadigan xodimlar soni.
        </p>
        <Kiritish
          id="peopleAffected"
          name="peopleAffected"
          type="number"
          min={1}
          inputMode="numeric"
          required
          value={qiymat.peopleAffected}
          onChange={(e) =>
            setQiymat((q) => ({
              ...q,
              peopleAffected: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
          placeholder="5"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="frequency" className="block text-sm font-medium text-matn">
          Har bir xodim buni qanchalik tez-tez bajaradi? <span className="text-xato">*</span>
        </label>
        <div className="flex gap-2">
          <Kiritish
            id="frequency"
            name="frequency"
            type="number"
            min={1}
            inputMode="numeric"
            required
            className="flex-1"
            value={qiymat.frequency}
            onChange={(e) =>
              setQiymat((q) => ({
                ...q,
                frequency: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            placeholder="3"
          />
          <Tanlov
            name="frequencyUnit"
            required
            className="w-40"
            value={qiymat.frequencyUnit}
            onChange={(e) =>
              setQiymat((q) => ({ ...q, frequencyUnit: e.target.value as FrequencyUnit }))
            }
          >
            <option value="">— tanlang —</option>
            {(Object.keys(TAKRORLANISH) as FrequencyUnit[]).map((k) => (
              <option key={k} value={k}>
                {TAKRORLANISH[k]}
              </option>
            ))}
          </Tanlov>
        </div>
        <p className="text-xs text-matn-uchinchi">
          <span className="font-medium">Namuna:</span> kuniga 3 marta
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="minutesPerCase" className="block text-sm font-medium text-matn">
          Bitta xodim buni bir marta bajarishga qancha vaqt sarflaydi?{" "}
          <span className="text-xato">*</span>
        </label>
        <p className="text-sm text-matn-ikkilamchi">
          Daqiqada yozing. Kutish va qayta ishlashni ham qo'shing.
        </p>
        <Kiritish
          id="minutesPerCase"
          name="minutesPerCase"
          type="number"
          min={1}
          inputMode="numeric"
          required
          value={qiymat.minutesPerCase}
          onChange={(e) =>
            setQiymat((q) => ({
              ...q,
              minutesPerCase: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
          placeholder="20"
        />
      </div>

      <div
        className={cn(
          "rounded-xl border p-5 transition-colors",
          soat > 0 ? "border-asosiy/30 bg-asosiy-ochiq" : "border-dashed border-chegara bg-white"
        )}
        aria-live="polite"
      >
        {soat > 0 ? (
          <>
            <p className="text-sm text-asosiy-quyuq">
              Tashkilotingiz shu ishga oyiga sarflaydigan vaqt:
            </p>
            <p className="mt-1 text-3xl font-semibold text-asosiy-quyuq">{soatMatni(soat)}</p>
            <p className="mt-1.5 text-sm text-asosiy-quyuq/80">
              Yiliga taxminan {sonMatni(yil)} soat — bu{" "}
              {Math.round(yil / 1760)} ta to'liq stavkaga teng.
            </p>
          </>
        ) : (
          <p className="text-sm text-matn-ikkilamchi">
            Yuqoridagi uchta raqamni to'ldiring — tizim oylik yo'qotishni o'zi hisoblab beradi.
          </p>
        )}
      </div>
    </div>
  );
}
