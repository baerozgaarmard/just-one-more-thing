import { describe, expect, it } from "vitest";
import type { ChangeRequest, Project } from "../types";
import { buildMessage, formatMoney, projectStats, quoteFor, greetingName, cleanTitle, isValidEmail } from "./logic";

const project: Project = {
  id: "p1",
  name: "Harbour Dental — practice website",
  client: "Dr. Meera Shah",
  currency: "INR",
  value: 85000,
  hourlyRate: 1500,
  scope: ["5-page website"],
  createdAt: "2026-10-01",
};

function req(partial: Partial<ChangeRequest>): ChangeRequest {
  return {
    id: "r1",
    projectId: "p1",
    title: "Add online payments",
    detail: "",
    kind: "extra",
    hours: 6,
    days: 2,
    status: "quoted",
    createdAt: "2026-10-10",
    ...partial,
  };
}

describe("formatMoney", () => {
  it("formats INR with Indian digit grouping", () => {
    expect(formatMoney(125000, "INR")).toBe("₹1,25,000");
  });
  it("formats USD with western grouping", () => {
    expect(formatMoney(1250, "USD")).toBe("$1,250");
  });
});

describe("quoteFor", () => {
  it("prices extras at hours × rate", () => {
    expect(quoteFor(req({}), project)).toBe(9000);
  });
  it("never charges for included, swap or phase-2 requests", () => {
    expect(quoteFor(req({ kind: "included" }), project)).toBe(0);
    expect(quoteFor(req({ kind: "swap" }), project)).toBe(0);
    expect(quoteFor(req({ kind: "later" }), project)).toBe(0);
  });
  it("ignores negative hours", () => {
    expect(quoteFor(req({ hours: -3 }), project)).toBe(0);
  });
});

describe("projectStats", () => {
  it("separates quoted from approved money", () => {
    const stats = projectStats(project, [
      req({ id: "a", status: "quoted" }),
      req({ id: "b", status: "approved", hours: 2, days: 1 }),
      req({ id: "c", kind: "included", status: "done" }),
    ]);
    expect(stats.extrasQuoted).toBe(12000);
    expect(stats.extrasApproved).toBe(3000);
    expect(stats.hoursProtected).toBe(8);
    expect(stats.daysAdded).toBe(1);
    expect(stats.creepPercent).toBeCloseTo(14.1, 1);
  });
});

describe("buildMessage", () => {
  it("quotes the price and asks for written approval on warm extras", () => {
    const msg = buildMessage(req({}), project, "warm");
    expect(msg).toContain("₹9,000");
    expect(msg).toContain("approved");
    expect(msg).toContain("Add online payments");
  });
  it("references the agreement in the firm tone", () => {
    const msg = buildMessage(req({}), project, "firm");
    expect(msg).toContain("as per our agreement");
  });
  it("never mentions a price for included work", () => {
    const msg = buildMessage(req({ kind: "included" }), project, "warm");
    expect(msg).toContain("No extra cost");
  });
});

describe("greetingName and cleanTitle", () => {
  it("keeps an honorific with the surname", () => {
    expect(greetingName("Dr. Meera Shah")).toBe("Dr. Shah");
  });
  it("uses the first name when there is no honorific", () => {
    expect(greetingName("Meera Shah")).toBe("Meera");
  });
  it("strips surrounding quotes from a title", () => {
    expect(cleanTitle("\u201CCan the banner animate?\u201D")).toBe("Can the banner animate?");
  });
  it("greets Dr. Shah in a generated message", () => {
    const msg = buildMessage(req({ kind: "clarify", title: "\u201CCan the banner animate?\u201D" }), project, "warm");
    expect(msg.startsWith("Hi Dr. Shah,")).toBe(true);
    expect(msg).not.toContain("\u201C\u201C");
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("meera@harbourdental.in")).toBe(true);
    expect(isValidEmail(" a@b.co ")).toBe(true);
  });
  it("rejects junk", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
