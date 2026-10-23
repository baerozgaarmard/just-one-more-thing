import { useMemo, useState } from "react";
import { Check, Copy, Mail, MessageCircle, X } from "lucide-react";
import type { ChangeRequest, Project } from "../types";
import { buildMessage, cleanTitle, type Tone } from "../lib/logic";

interface Props {
  request: ChangeRequest;
  project: Project;
  onClose: () => void;
}

export default function MessageModal({ request, project, onClose }: Props) {
  const [tone, setTone] = useState<Tone>("warm");
  const [copied, setCopied] = useState(false);
  const message = useMemo(() => buildMessage(request, project, tone), [request, project, tone]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Clipboard may be unavailable (permissions) — select-and-copy still works.
      const el = document.getElementById("msg-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const mailUrl =
    `mailto:?subject=${encodeURIComponent(`Re: ${request.title} — ${project.name}`)}` +
    `&body=${encodeURIComponent(message)}`;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Message for your client">
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Say it like a professional</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-2)" }}>
              For “{cleanTitle(request.title)}”. Warm keeps it friendly; firm quotes the agreement.
              {request.kind !== "extra" && " Tone only changes extra/billable replies."}
            </p>
          </div>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <div className="seg" role="group" aria-label="Tone">
              <button className={tone === "warm" ? "on" : ""} onClick={() => setTone("warm")}>Warm</button>
              <button className={tone === "firm" ? "on" : ""} onClick={() => setTone("firm")}>Firm</button>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              Second or third extra? Switch to firm.
            </span>
          </div>
          <div className="msgbox" id="msg-text">{message}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={copy}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy message"}
            </button>
            <a className="btn" href={waUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <MessageCircle size={15} /> Send on WhatsApp
            </a>
            <a className="btn" href={mailUrl} style={{ textDecoration: "none" }}>
              <Mail size={15} /> Send as email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
