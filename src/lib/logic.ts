import type {
  ChangeRequest,
  CurrencyCode,
  Project,
  RequestKind,
} from "../types";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const KIND_META: Record<
  RequestKind,
  { label: string; hint: string }
> = {
  included: {
    label: "Included",
    hint: "Already covered by the agreed scope. Do it, no discussion needed.",
  },
  clarify: {
    label: "Clarify",
    hint: "You can't tell yet whether it's in scope. Ask one question before deciding.",
  },
  swap: {
    label: "Swap",
    hint: "New, but the client can trade it for something already planned — same price, same deadline.",
  },
  extra: {
    label: "Extra",
    hint: "Clearly outside the agreed scope. Quote it, get written approval, then build it.",
  },
  later: {
    label: "Phase 2",
    hint: "A good idea that doesn't belong in this phase. Park it, in writing, for later.",
  },
};

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString(currency === "INR" ? "en-IN" : "en-US");
  return `${symbol}${grouped}`;
}

/** What a request costs the client. Only billable extras carry a price. */
export function quoteFor(req: ChangeRequest, project: Project): number {
  if (req.kind !== "extra") return 0;
  return Math.max(0, req.hours) * Math.max(0, project.hourlyRate);
}

export interface ProjectStats {
  totalRequests: number;
  extrasQuoted: number;
  extrasApproved: number;
  hoursProtected: number;
  daysAdded: number;
  /** Extras (quoted + approved) as a share of the original project value. */
  creepPercent: number;
}

export function projectStats(
  project: Project,
  requests: ChangeRequest[],
): ProjectStats {
  const mine = requests.filter((r) => r.projectId === project.id);
  const extras = mine.filter((r) => r.kind === "extra");
  const quoted = extras
    .filter((r) => r.status === "quoted" || r.status === "approved" || r.status === "done")
    .reduce((sum, r) => sum + quoteFor(r, project), 0);
  const approved = extras
    .filter((r) => r.status === "approved" || r.status === "done")
    .reduce((sum, r) => sum + quoteFor(r, project), 0);
  const hoursProtected = extras.reduce((sum, r) => sum + r.hours, 0);
  const daysAdded = extras
    .filter((r) => r.status === "approved" || r.status === "done")
    .reduce((sum, r) => sum + r.days, 0);
  return {
    totalRequests: mine.length,
    extrasQuoted: quoted,
    extrasApproved: approved,
    hoursProtected,
    daysAdded,
    creepPercent: project.value > 0 ? (quoted / project.value) * 100 : 0,
  };
}

export type Tone = "warm" | "firm";

/**
 * The client-facing reply for a request. This is the heart of the tool:
 * warm, specific, and impossible to misread — the patterns freelancers in
 * community discussions say actually end scope creep without a fight.
 */

const TITLES = ["dr", "dr.", "mr", "mr.", "mrs", "mrs.", "ms", "ms."];

/** "Dr. Meera Shah" -> "Dr. Shah"; "Meera Shah" -> "Meera". */
export function greetingName(client: string): string {
  const parts = client.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "there";
  if (parts.length > 1 && TITLES.includes(parts[0].toLowerCase())) {
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }
  return parts[0];
}

/** Strip surrounding quotes so a quoted title isn't double-quoted in messages. */
export function cleanTitle(title: string): string {
  return title.trim().replace(/^[“”"']+|[“”"']+$/g, "").trim();
}

export function buildMessage(
  req: ChangeRequest,
  project: Project,
  tone: Tone,
): string {
  const money = formatMoney(quoteFor(req, project), project.currency);
  const hours = req.hours % 1 === 0 ? String(req.hours) : req.hours.toFixed(1);
  const dayLine =
    req.days > 0
      ? ` It would add about ${req.days} day${req.days === 1 ? "" : "s"} to the delivery date.`
      : "";

  switch (req.kind) {
    case "included":
      return (
        `Hi ${greetingName(project.client)}, good news — “${cleanTitle(req.title)}” is already covered ` +
        `in the scope we agreed for ${project.name}, so I'll take care of it as part of the project. ` +
        `No extra cost. I'll update you once it's done.`
      );
    case "clarify":
      return (
        `Hi ${greetingName(project.client)}, thanks for sending this over. Before I confirm how ` +
        `“${cleanTitle(req.title)}” fits into ${project.name}, one quick question: ${req.detail || "could you share a little more detail on what you have in mind?"} ` +
        `Once I know that, I'll confirm straight away whether it's included or needs a separate quote.`
      );
    case "swap":
      return (
        `Hi ${greetingName(project.client)}, I can add “${cleanTitle(req.title)}” to ${project.name}. ` +
        `To keep us on the original price and timeline, we can swap it for “${req.swapFor || "an item in the current scope"}” — ` +
        `or keep both and I'll quote the addition separately. Which would you prefer?`
      );
    case "later":
      return (
        `Hi ${greetingName(project.client)}, “${cleanTitle(req.title)}” is a good idea — it just sits outside ` +
        `the current phase of ${project.name}, so I've noted it down for Phase 2 rather than squeezing it in now. ` +
        `That keeps this launch on schedule. We can pick it up right after delivery.`
      );
    case "extra":
      if (tone === "firm") {
        return (
          `Hi ${greetingName(project.client)}, “${cleanTitle(req.title)}” falls outside the scope we agreed ` +
          `for ${project.name}, so as per our agreement it's quoted separately before work begins. ` +
          `The addition is ${money} (${hours} hours).${dayLine} ` +
          `If you'd like to go ahead, just reply “approved” to this message and I'll schedule it. ` +
          `Until then, I'll continue with the agreed scope so nothing slips.`
        );
      }
      return (
        `Hi ${greetingName(project.client)}, happy to add “${cleanTitle(req.title)}” to ${project.name}. ` +
        `It's outside the scope we originally agreed, so it would be ${money} extra (${hours} hours of work).${dayLine} ` +
        `If that works, just reply “approved” and I'll get it scheduled — no surprises later, for either of us.`
      );
  }
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
