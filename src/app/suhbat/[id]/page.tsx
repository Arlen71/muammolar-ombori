import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { db } from "@/lib/db";
import { talabKirish } from "@/lib/auth";
import { SahifaSarlavhasi } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Nishoncha, Quti, Xabar } from "@/components/ui";
import { oqildiDeb, suhbatRoli, yozaOladimi } from "@/lib/suhbat";
import { MUAMMO_HOLATI, MUAMMO_HOLATI_RANGI, sanaVaqtMatni } from "@/lib/labels";
import { hajmMatni } from "@/lib/uploads-client";
import { XabarFormasi } from "./xabar-formasi";

export const metadata: Metadata = { title: "Suhbat" };

export default async function SuhbatSahifasi(props: PageProps<"/suhbat/[id]">) {
  const { id } = await props.params;
  const joriy = await talabKirish();

  const suhbat = await db.suhbat.findUnique({
    where: { id },
    select: {
      id: true,
      developerId: true,
      developer: { select: { id: true, fullName: true, position: true, avatarPath: true } },
      problem: {
        select: {
          id: true,
          refCode: true,
          title: true,
          status: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      },
      xabarlar: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          matn: true,
          createdAt: true,
          yuboruvchiId: true,
          yuboruvchi: { select: { id: true, fullName: true, avatarPath: true } },
          fayllar: { select: { id: true, fileName: true, size: true } },
        },
      },
    },
  });

  if (!suhbat) notFound();

  const rol = suhbatRoli(joriy, suhbat);
  /*
    Ruxsat yo'q bo'lsa 403 emas, 404. Sabab: 403 "bunday suhbat bor,
    lekin sizga ko'rinmaydi" degani — bu ham ma'lumot. Yopiq tizimda
    suhbat borligining o'zi oshkor bo'lmasligi kerak.
  */
  if (rol === null) notFound();

  // Ochilgani "o'qildi" deb belgilanadi (kuzatuvchi bundan mustasno)
  await oqildiDeb(suhbat.id, rol);

  const muammoYoli =
    joriy.role === "LEADER"
      ? `/rahbar/muammo/${suhbat.problem.id}/korish`
      : `/ombor/${suhbat.problem.id}`;

  return (
    <>
      <SahifaSarlavhasi
        sarlavha={
          rol === "dasturchi" ? suhbat.problem.organization.name : suhbat.developer.fullName
        }
        izoh={
          rol === "dasturchi"
            ? "Tashkilot rahbari bilan yozishma"
            : (suhbat.developer.position ?? "Dasturchi")
        }
      />

      {/* Suhbat qaysi muammo haqida ekani doim ko'z oldida tursin */}
      <Quti className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={muammoYoli}
            className="font-medium text-matn hover:text-asosiy hover:underline"
          >
            {suhbat.problem.title}
          </Link>
          <p className="mt-0.5 font-mono text-xs text-matn-uchinchi">
            {suhbat.problem.refCode}
          </p>
        </div>
        <Nishoncha className={MUAMMO_HOLATI_RANGI[suhbat.problem.status]}>
          {MUAMMO_HOLATI[suhbat.problem.status]}
        </Nishoncha>
      </Quti>

      {rol === "kuzatuvchi" && (
        <Xabar turi="malumot" className="mb-4">
          Siz administratorsiz: yozishmani o&apos;qiy olasiz, lekin unga yoza olmaysiz.
        </Xabar>
      )}

      <div className="space-y-3">
        {suhbat.xabarlar.length === 0 && (
          <p className="rounded-quti border border-dashed border-chegara bg-yuza px-5 py-10 text-center text-sm text-matn-ikkilamchi">
            Hali xabar yo&apos;q. Birinchi savolni yozing.
          </p>
        )}

        {suhbat.xabarlar.map((x, i) => {
          const meniki = x.yuboruvchiId === joriy.id;

          return (
            <div
              key={x.id}
              className={`jonlanish flex gap-3 ${meniki ? "flex-row-reverse" : ""}`}
              style={{ "--jonlanish-tartib": Math.min(i, 8) } as React.CSSProperties}
            >
              <Avatar
                ism={x.yuboruvchi.fullName}
                foydalanuvchiId={x.yuboruvchi.id}
                rasmVersiyasi={x.yuboruvchi.avatarPath?.slice(-12, -4) ?? null}
                olcham="kichik"
                className="mt-1"
              />

              <div className={`min-w-0 max-w-[75%] ${meniki ? "items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    meniki
                      ? "bg-asosiy text-asosiy-matn"
                      : "border border-chegara bg-yuza text-matn"
                  }`}
                >
                  {x.matn && (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {x.matn}
                    </p>
                  )}

                  {x.fayllar.length > 0 && (
                    <ul className={`space-y-1 ${x.matn ? "mt-2" : ""}`}>
                      {x.fayllar.map((f) => (
                        <li key={f.id}>
                          <a
                            href={`/api/suhbat-fayl/${f.id}`}
                            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm underline-offset-2 hover:underline ${
                              meniki ? "bg-black/10" : "bg-yuza-2"
                            }`}
                          >
                            <span aria-hidden="true">📎</span>
                            <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
                            <span className="shrink-0 text-xs opacity-70">
                              {hajmMatni(f.size)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p
                  className={`mt-1 text-xs text-matn-uchinchi ${meniki ? "text-right" : ""}`}
                >
                  {meniki ? "Siz" : x.yuboruvchi.fullName} · {sanaVaqtMatni(x.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {yozaOladimi(rol) && <XabarFormasi suhbatId={suhbat.id} />}
    </>
  );
}
