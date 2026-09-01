"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { suhbatBoshla } from "@/app/suhbat/actions";
import { Tugma, Xabar } from "@/components/ui";

/**
 * «Savol berish» — dasturchini rahbar bilan yozishmaga olib boradi.
 *
 * Muammoni OLISH shart emas, va bu ataylab shunday: dasturchi
 * kartochkadagi kamchilikni ko'rsa, o'ziga biriktirmasdan turib
 * so'ray oladi. Ilgari bunday savol telefonda so'ralardi — javob esa
 * hech qayerda qolmasdi va keyingi dasturchi o'shani qaytadan so'rardi.
 *
 * Suhbat allaqachon ochilgan bo'lsa yangisi yaratilmaydi: bazada
 * (muammo × dasturchi) juftligi unique.
 */
export function SavolTugmasi({ muammoId }: { muammoId: string }) {
  const router = useRouter();
  const [ketmoqda, ketmoqdaYoz] = useState(false);
  const [xato, xatoniYoz] = useState<string | null>(null);

  async function boshla() {
    ketmoqdaYoz(true);
    xatoniYoz(null);

    const javob = await suhbatBoshla(muammoId);

    if (javob.suhbatId) {
      router.push(`/suhbat/${javob.suhbatId}`);
      return;
    }

    ketmoqdaYoz(false);
    xatoniYoz(javob.xato ?? "Suhbatni ochib bo'lmadi.");
  }

  return (
    <div className="space-y-2">
      {xato && <Xabar turi="xato">{xato}</Xabar>}
      <Tugma
        type="button"
        korinish="ikkilamchi"
        disabled={ketmoqda}
        onClick={boshla}
        className="w-full"
      >
        <MessageSquare size={18} aria-hidden="true" />
        {ketmoqda ? "Ochilmoqda…" : "Savol berish"}
      </Tugma>
    </div>
  );
}
