import type { QadamRaqami } from "@/lib/problem-schema";

/**
 * FormData'dan bitta qadamning maydonlarini o'qiydi.
 *
 * Ikkala tomonda ishlatiladi:
 *   - server action  — "Keyingi" bosilganda;
 *   - brauzer        — avtosaqlashda.
 * Shuning uchun bu oddiy modul: "use server" ham, "server-only" ham emas.
 */
export function qadamMalumoti(qadam: QadamRaqami, fd: FormData): Record<string, unknown> {
  const m = (k: string) => fd.get(k);
  const royxat = (k: string) =>
    fd.getAll(k).filter((v): v is string => typeof v === "string" && v !== "");

  switch (qadam) {
    case 1:
      return {
        title: m("title"),
        description: m("description"),
        categoryId: m("categoryId"),
        painTypes: royxat("painTypes"),
      };
    case 2:
      return {
        currentProcess: m("currentProcess"),
        toolsUsed: royxat("toolsUsed"),
        toolsNote: m("toolsNote"),
        rolesInvolved: royxat("rolesInvolved"),
      };
    case 3:
      return {
        frequency: m("frequency"),
        frequencyUnit: m("frequencyUnit") || null,
        minutesPerCase: m("minutesPerCase"),
        peopleAffected: m("peopleAffected"),
        citizensAffected: m("citizensAffected"),
        consequence: m("consequence") || null,
        urgency: m("urgency") || undefined,
        deadline: m("deadline"),
        deadlineReason: m("deadlineReason"),
      };
    case 4:
      return {
        dataVolume: m("dataVolume") || null,
        usersCount: m("usersCount") || null,
        dataSensitivity: m("dataSensitivity") || null,
        integrations: royxat("integrations"),
        integrationsNote: m("integrationsNote"),
        accessFrom: royxat("accessFrom"),
        previousAttempt: m("previousAttempt") === "on" || m("previousAttempt") === "true",
        previousAttemptNote: m("previousAttemptNote"),
      };
    case 5:
      return {
        desiredOutcome: m("desiredOutcome"),
        successMetric: m("successMetric"),
        contactName: m("contactName"),
        contactPosition: m("contactPosition"),
        contactPhone: m("contactPhone"),
      };
  }
}
