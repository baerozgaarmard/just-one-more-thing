import { useState } from "react";
import { X } from "lucide-react";
import type { ChangeRequest, Project, RequestKind } from "../types";
import { KIND_META, formatMoney, newId, todayISO } from "../lib/logic";

interface Props {
  project: Project;
  onClose: () => void;
  onSave: (req: ChangeRequest) => void;
}

const KINDS = Object.keys(KIND_META) as RequestKind[];

export default function RequestForm({ project, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [kind, setKind] = useState<RequestKind>("extra");
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState(0);
  const [swapFor, setSwapFor] = useState(project.scope[0] ?? "");
  const [error, setError] = useState("");

  function submit() {
    if (!title.trim()) {
      setError("Give the request a short title — exactly how the client phrased it works best.");
      return;
    }
    onSave({
      id: newId(),
      projectId: project.id,
      title: title.trim(),
      detail: detail.trim(),
      kind,
      hours: Math.max(0, hours) || 0,
      days: Math.max(0, days) || 0,
      swapFor: kind === "swap" ? swapFor : undefined,
      status: kind === "extra" ? "quoted" : "logged",
      createdAt: todayISO(),
    });
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Log a client request">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Log a request</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-2)" }}>
              Write it down the moment it arrives — that’s the whole system.
            </p>
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <label className="lab" htmlFor="req-title">What did the client ask for?</label>
            <input
              id="req-title" className="field" value={title}
              placeholder="e.g. “Can you just add a blog?”"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="lab" htmlFor="req-detail">Detail / context (optional)</label>
            <textarea
              id="req-detail" className="field" rows={2} value={detail}
              placeholder="Where it came up, links, the question you need answered…"
              onChange={(e) => setDetail(e.target.value)}
            />
          </div>

          <label className="lab">Sort it — which bucket is it in?</label>
          <div className="kind-grid" style={{ marginBottom: 14 }}>
            {KINDS.map((k) => (
              <button
                key={k} type="button"
                className={"kind-opt" + (kind === k ? " sel" : "")}
                onClick={() => setKind(k)}
              >
                <span className="t">{KIND_META[k].label}</span>
                <span className="h">{KIND_META[k].hint}</span>
              </button>
            ))}
          </div>

          {kind === "swap" && (
            <div style={{ marginBottom: 12 }}>
              <label className="lab" htmlFor="swap-for">Swaps out this agreed item</label>
              <select id="swap-for" className="field" value={swapFor} onChange={(e) => setSwapFor(e.target.value)}>
                {project.scope.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid2">
            <div>
              <label className="lab" htmlFor="req-hours">Estimated hours</label>
              <input
                id="req-hours" className="field" type="number" min={0} step={0.5}
                value={hours} onChange={(e) => setHours(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="lab" htmlFor="req-days">Adds days to delivery</label>
              <input
                id="req-days" className="field" type="number" min={0} step={1}
                value={days} onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
          </div>

          {kind === "extra" && hours > 0 && (
            <p style={{ fontSize: 13.5, margin: "12px 0 0" }}>
              Quote at your rate:{" "}
              <strong className="num">
                {formatMoney(hours * project.hourlyRate, project.currency)}
              </strong>{" "}
              ({hours}h × {formatMoney(project.hourlyRate, project.currency)}/h)
            </p>
          )}

          {error && <p style={{ color: "var(--ember)", fontSize: 13, margin: "10px 0 0" }}>{error}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-ember" onClick={submit}>Add to ledger</button>
          </div>
        </div>
      </div>
    </div>
  );
}
