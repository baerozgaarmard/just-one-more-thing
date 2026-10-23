import { useState } from "react";
import { track } from "@vercel/analytics";
import { BadgeCheck, BellRing, CloudUpload, FileBadge2, Link2 } from "lucide-react";
import { isValidEmail } from "../lib/logic";

const WAITLIST_KEY = "jomt:waitlist:v1";
const WAITLIST_ENDPOINT = "https://formsubmit.co/ajax/ayushbhatt207@gmail.com";

type State = "idle" | "sending" | "done" | "error";

/**
 * Pro waitlist capture. Signups are emailed to the maker via FormSubmit
 * (no backend of our own) and remembered locally so the panel turns into
 * a quiet confirmation instead of nagging on every visit.
 */
export default function WaitlistPanel() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>(() =>
    typeof localStorage !== "undefined" && localStorage.getItem(WAITLIST_KEY) ? "done" : "idle",
  );

  async function join() {
    if (!isValidEmail(email) || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          _subject: "New Pro waitlist signup — Just One More Thing",
          _template: "table",
          source: "in-app waitlist panel",
        }),
      });
      if (!res.ok) throw new Error("signup failed");
      localStorage.setItem(WAITLIST_KEY, email);
      track("waitlist_joined");
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="panel" style={{ marginTop: 20 }} aria-label="Pro waitlist">
      <div className="panel-head">
        <h2>Pro is coming</h2>
        <span className="panel-sub">Join the waitlist</span>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: "12px 14px 4px", display: "grid", gap: 8, fontSize: 13.5 }}>
        <li style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <FileBadge2 size={15} /> Your logo on change-order documents
        </li>
        <li style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <CloudUpload size={15} /> Cloud backup &amp; sync across devices
        </li>
        <li style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link2 size={15} /> Shareable links clients approve in one click
        </li>
      </ul>
      {state === "done" ? (
        <p style={{ display: "flex", gap: 8, alignItems: "center", margin: 0, padding: "10px 14px 14px", fontSize: 13.5, color: "var(--green, #2F6B3A)" }}>
          <BadgeCheck size={16} /> You’re on the list — launch pricing is locked in for you.
        </p>
      ) : (
        <form
          style={{ padding: "8px 14px 14px" }}
          onSubmit={(e) => {
            e.preventDefault();
            void join();
          }}
        >
          <label className="lab" htmlFor="waitlist-email">Email for the Pro launch</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="waitlist-email"
              className="field"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button className="btn btn-primary" type="submit" disabled={!isValidEmail(email) || state === "sending"}>
              <BellRing size={15} /> {state === "sending" ? "Joining…" : "Join"}
            </button>
          </div>
          {state === "error" && (
            <p style={{ margin: "8px 0 0", fontSize: 12.5, color: "var(--ember, #BC3F12)" }}>
              That didn’t go through — check the email and try again.
            </p>
          )}
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--ink-2)" }}>
            One email when Pro launches. No spam, ever.
          </p>
        </form>
      )}
    </section>
  );
}
