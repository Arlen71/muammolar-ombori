"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { oxshashlarniTop } from "@/app/rahbar/actions";
import type { OxshashMuammo } from "@/lib/similar";

/**
 * Sarlavha yozilayotganda o'xshash muammolar bor-yo'qligini tekshiradi.
 *
 * Maqsad — ombor bir xil yozuvlarga to'lib ketmasligi. Agar shunday muammo
 * allaqachon bo'lsa, rahbarga yangisini yaratish o'rniga mavjudini
 * qo'llab-quvvatlash taklif qilinadi: shunda dasturchi muammo nechta
 * tashkilotda uchrashini ko'radi.
 */
export function OxshashOgohlantirish({
  muammoId,
  boshlangichSarlavha,
}: {
  muammoId: string;
  boshlangichSarlavha: string;
}) {
  const [oxshashlar, setOxshashlar] = useState<OxshashMuammo[]>([]);
  const [yopilgan, setYopilgan] = useState(false);

  useEffect(() => {
    const sarlavhaMaydoni = document.getElementById("title") as HTMLInputElement | null;
    if (!sarlavhaMaydoni) return;

    let taymer: ReturnType<typeof setTimeout>;
    let bekor = false;

    async function tekshir(qiymat: string) {
      if (qiymat.trim().length < 15) {
        setOxshashlar([]);
        return;
      }
      try {
        const natija = await oxshashlarniTop(qiymat, muammoId);
        if (!bekor) setOxshashlar(natija);
      } catch {
        // Qidiruv ishlamasa jim qolamiz — bu forma to'ldirishga xalaqit bermasligi kerak
      }
    }

    function ozgardi() {
      clearTimeout(taymer);
      taymer = setTimeout(() => tekshir(sarlavhaMaydoni!.value), 800);
    }

    sarlavhaMaydoni.addEventListener("input", ozgardi);
    // Sahifa ochilganda mavjud sarlavha bo'yicha ham tekshiramiz
    void tekshir(boshlangichSarlavha);

    return () => {
      bekor = true;
      clearTimeout(taymer);
      sarlavhaMaydoni.removeEventListener("input", ozgardi);
    };
  }, [muammoId, boshlangichSarlavha]);

  if (yopilgan || oxshashlar.length === 0) return null;

  return (
    <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm ring-1 ring-inset ring-amber-200">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-amber-900">
          Bunga o'xshash {oxshashlar.length} ta muammo allaqachon bor
        </p>
        <button
          type="button"
          onClick={() => setYopilgan(true)}
          className="shrink-0 text-xs text-amber-800 underline-offset-2 hover:underline"
        >
          Yopish
        </button>
      </div>

      <p className="mt-1 text-amber-900/90">
        Agar shulardan biri aynan sizdagi muammo bo'lsa, yangisini yaratish o'rniga
        «Boshqa tashkilotlarda» bo'limidan uni qo'llab-quvvatlang — shunda dasturchilar
        muammo nechta tashkilotda uchrashini ko'radi.
      </p>

      <ul className="mt-3 space-y-1.5">
        {oxshashlar.map((o) => (
          <li key={o.id}>
            <Link
              href="/rahbar/boshqalar"
              className="block rounded-md bg-white/70 px-3 py-2 hover:bg-white"
            >
              <span className="font-medium text-amber-950">{o.title}</span>
              <span className="mt-0.5 block text-xs text-amber-800">
                {o.organizationName}
                {o.supporterCount > 0 && ` · yana ${o.supporterCount} ta tashkilotda bor`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
