import type { AppData } from "../types";

const KEY = "jomt:data:v1";

/**
 * Local-first storage: everything lives in the browser. No account, no
 * server, no client data leaving the machine — export/import is JSON.
 */
export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed.projects?.length) return parsed;
    }
  } catch {
    // Corrupt storage should never brick the app — fall back to seed data.
  }
  return seedData();
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full / private mode: the app keeps working in memory.
  }
}

export function seedData(): AppData {
  const projectId = "seed-project";
  return {
    activeProjectId: projectId,
    projects: [
      {
        id: projectId,
        name: "Harbour Dental — practice website",
        client: "Dr. Meera Shah",
        currency: "INR",
        value: 85000,
        hourlyRate: 1500,
        createdAt: "2026-10-02",
        scope: [
          "5-page website (Home, About, Treatments, Team, Contact)",
          "Appointment enquiry form routed to WhatsApp",
          "Google Maps + Google Business Profile setup",
          "2 rounds of content revisions",
          "Launch + 7 days of post-launch support",
        ],
      },
    ],
    requests: [
      {
        id: "seed-r1",
        projectId,
        title: "Add a blog with treatment guides",
        detail: "Client asked after seeing a competitor's blog.",
        kind: "extra",
        hours: 10,
        days: 3,
        status: "approved",
        createdAt: "2026-10-09",
        approvedAt: "2026-10-10",
      },
      {
        id: "seed-r2",
        projectId,
        title: "Take online payments for appointments",
        detail: "Razorpay checkout for consultation bookings.",
        kind: "extra",
        hours: 6,
        days: 2,
        status: "quoted",
        createdAt: "2026-10-14",
      },
      {
        id: "seed-r3",
        projectId,
        title: "Swap the team photo on About page",
        detail: "New photo supplied by the client.",
        kind: "included",
        hours: 0.5,
        days: 0,
        status: "done",
        createdAt: "2026-10-12",
      },
      {
        id: "seed-r4",
        projectId,
        title: "Add a second location page for the new clinic",
        detail: "Second clinic opens in January.",
        kind: "later",
        hours: 4,
        days: 1,
        status: "logged",
        createdAt: "2026-10-18",
      },
      {
        id: "seed-r5",
        projectId,
        title: "“Can the homepage banner animate?”",
        detail: "Asked on a call — unclear if they mean a slider or motion graphics.",
        kind: "clarify",
        hours: 2,
        days: 0,
        status: "logged",
        createdAt: "2026-10-20",
      },
    ],
  };
}
