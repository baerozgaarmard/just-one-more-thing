export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";

export type RequestKind = "included" | "clarify" | "swap" | "extra" | "later";

export type RequestStatus =
  | "logged"
  | "quoted"
  | "approved"
  | "done"
  | "declined";

export interface Project {
  id: string;
  name: string;
  client: string;
  currency: CurrencyCode;
  /** Agreed fixed price for the original scope. */
  value: number;
  /** Freelancer's hourly rate, used to price extras. */
  hourlyRate: number;
  /** The agreed scope, one deliverable per entry. */
  scope: string[];
  createdAt: string;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  title: string;
  detail: string;
  kind: RequestKind;
  /** Estimated hours of work. */
  hours: number;
  /** Extra calendar days this adds to the delivery date. */
  days: number;
  /** For "swap" requests: which agreed scope item it replaces. */
  swapFor?: string;
  status: RequestStatus;
  createdAt: string;
  approvedAt?: string;
}

export interface AppData {
  projects: Project[];
  requests: ChangeRequest[];
  activeProjectId: string;
}
