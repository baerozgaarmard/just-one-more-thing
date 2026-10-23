import { useEffect, useMemo, useRef, useState } from "react";
import {
  Asterisk,
  Check,
  Download,
  FileText,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AppData,
  ChangeRequest,
  Project,
  RequestKind,
  RequestStatus,
} from "./types";
import {
  KIND_META,
  formatDate,
  formatMoney,
  newId,
  projectStats,
  quoteFor,
  todayISO,
} from "./lib/logic";
import { loadData, saveData, seedData } from "./lib/store";
import RequestForm from "./components/RequestForm";
import MessageModal from "./components/MessageModal";
import ChangeOrderModal from "./components/ChangeOrderModal";
import WaitlistPanel from "./components/WaitlistPanel";
import { Analytics, track } from "@vercel/analytics/react";

const STATUSES: { value: RequestStatus; label: string }[] = [
  { value: "logged", label: "Logged" },
  { value: "quoted", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "done", label: "Done" },
  { value: "declined", label: "Declined" },
];

export default function App() {
  const [data, setData] = useState<AppData>(() => loadData());
  const [showForm, setShowForm] = useState(false);
  const [messageFor, setMessageFor] = useState<ChangeRequest | null>(null);
  const [orderFor, setOrderFor] = useState<ChangeRequest | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<RequestKind | "all">("all");
  const [newScopeItem, setNewScopeItem] = useState("");
  const [editingProject, setEditingProject] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveData(data), [data]);

  const project = useMemo(
    () => data.projects.find((p) => p.id === data.activeProjectId) ?? data.projects[0],
    [data],
  );
  const stats = useMemo(
    () => (project ? projectStats(project, data.requests) : null),
    [project, data.requests],
  );

  const visible = useMemo(() => {
    if (!project) return [];
    return data.requests
      .filter((r) => r.projectId === project.id)
      .filter((r) => kindFilter === "all" || r.kind === kindFilter)
      .filter(
        (r) =>
          !query ||
          (r.title + " " + r.detail).toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.requests, project, kindFilter, query]);

  if (!project || !stats) return null;

  function updateProject(patch: Partial<Project>) {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === project.id ? { ...p, ...patch } : p)),
    }));
  }

  function addProject() {
    const p: Project = {
      id: newId(),
      name: "Untitled project",
      client: "Client name",
      currency: project.currency,
      value: 50000,
      hourlyRate: project.hourlyRate,
      scope: ["Agreed deliverable #1"],
      createdAt: todayISO(),
    };
    setData((d) => ({ projects: [...d.projects, p], requests: d.requests, activeProjectId: p.id }));
    setEditingProject(true);
  }

  function addRequest(req: ChangeRequest) {
    track("request_logged");
    setData((d) => ({ ...d, requests: [req, ...d.requests] }));
    setShowForm(false);
  }

  function updateRequest(id: string, patch: Partial<ChangeRequest>) {
    setData((d) => ({
      ...d,
      requests: d.requests.map((r) =>
        r.id === id
          ? { ...r, ...patch, approvedAt: patch.status === "approved" ? todayISO() : r.approvedAt }
          : r,
      ),
    }));
  }

  function deleteRequest(id: string) {
    setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== id) }));
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "just-one-more-thing-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file: File) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as AppData;
        if (parsed.projects?.length && Array.isArray(parsed.requests)) setData(parsed);
      } catch {
        alert("That file doesn't look like a Just One More Thing backup.");
      }
    });
  }

  const creepWidth = Math.min(100, Math.max(0, stats.creepPercent));

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="wordmark">
            <div className="wordmark-badge"><Asterisk size={20} /></div>
            <div>
              <h1>Just One More Thing</h1>
              <p>The scope-creep ledger for freelancers</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-small" onClick={exportJSON}>
              <Download size={14} /> Export
            </button>
            <button className="btn btn-small" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import
            </button>
            <input
              ref={fileRef} type="file" accept="application/json" hidden
              onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])}
            />
            <button className="btn btn-small" onClick={() => setData(seedData())}>
              Reset demo data
            </button>
          </div>
        </div>
      </header>

      <div className="wrap">
        {/* Project bar */}
        <div className="projectbar">
          <div className="project-select">
            <label className="lab" htmlFor="project-picker">Project</label>
            <select
              id="project-picker" className="field"
              value={project.id}
              onChange={(e) => setData((d) => ({ ...d, activeProjectId: e.target.value }))}
            >
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="btn" onClick={addProject}><Plus size={15} /> New project</button>
          <button className="btn" onClick={() => setEditingProject((v) => !v)}>
            {editingProject ? "Done editing" : "Edit project"}
          </button>
          <div className="project-meta">
            Client <strong>{project.client}</strong> · Agreed value{" "}
            <strong>{formatMoney(project.value, project.currency)}</strong> · Rate{" "}
            <strong>{formatMoney(project.hourlyRate, project.currency)}/h</strong>
          </div>
        </div>

        {editingProject && (
          <div className="panel" style={{ padding: 18, marginTop: 10 }}>
            <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr 120px 140px 140px", display: "grid", gap: 12 }}>
              <div>
                <label className="lab">Project name</label>
                <input className="field" value={project.name} onChange={(e) => updateProject({ name: e.target.value })} />
              </div>
              <div>
                <label className="lab">Client</label>
                <input className="field" value={project.client} onChange={(e) => updateProject({ client: e.target.value })} />
              </div>
              <div>
                <label className="lab">Currency</label>
                <select className="field" value={project.currency} onChange={(e) => updateProject({ currency: e.target.value as Project["currency"] })}>
                  <option value="INR">INR ₹</option>
                  <option value="USD">USD $</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                </select>
              </div>
              <div>
                <label className="lab">Agreed value</label>
                <input className="field" type="number" min={0} value={project.value} onChange={(e) => updateProject({ value: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="lab">Hourly rate</label>
                <input className="field" type="number" min={0} value={project.hourlyRate} onChange={(e) => updateProject({ hourlyRate: Number(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <section className="stats" aria-label="Project statistics">
          <div className="stat">
            <div className="k">Extras quoted</div>
            <div className="v">{formatMoney(stats.extrasQuoted, project.currency)}</div>
            <div className="s">Priced instead of done free</div>
          </div>
          <div className="stat">
            <div className="k">Extras approved</div>
            <div className="v">{formatMoney(stats.extrasApproved, project.currency)}</div>
            <div className="s">Agreed in writing — billable</div>
          </div>
          <div className="stat">
            <div className="k">Hours protected</div>
            <div className="v">{stats.hoursProtected}h</div>
            <div className="s">Extra work no longer invisible</div>
          </div>
          <div className="stat">
            <div className="k">Requests logged</div>
            <div className="v">{stats.totalRequests}</div>
            <div className="s">{stats.daysAdded} extra days approved so far</div>
          </div>
        </section>

        <div className="creep">
          <div className="creep-row">
            <span><strong>Creep meter</strong> — extras as a share of the original {formatMoney(project.value, project.currency)} project</span>
            <strong>{stats.creepPercent.toFixed(1)}%</strong>
          </div>
          <div className="creep-track"><div className="creep-fill" style={{ width: `${creepWidth}%` }} /></div>
        </div>

        <div className="layout">
          {/* Ledger */}
          <section className="panel" aria-label="Request ledger">
            <div className="panel-head">
              <h2>The ledger</h2>
              <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Every “just one thing”, on record</span>
              <div className="spacer" />
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "var(--ink-3)" }} />
                <input
                  className="field" style={{ paddingLeft: 30, width: 180 }} placeholder="Search…"
                  value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search requests"
                />
              </div>
              <select
                className="field" style={{ width: 140 }} value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as RequestKind | "all")}
                aria-label="Filter by type"
              >
                <option value="all">All types</option>
                {(Object.keys(KIND_META) as RequestKind[]).map((k) => (
                  <option key={k} value={k}>{KIND_META[k].label}</option>
                ))}
              </select>
              <button className="btn btn-ember" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Log request
              </button>
            </div>

            {visible.length === 0 ? (
              <div className="empty">
                <h3>Nothing here yet</h3>
                <p>When the client says “can you just…”, it goes in the ledger first.<br />Then you decide what it costs.</p>
                <button className="btn btn-ember" onClick={() => setShowForm(true)}>
                  <Plus size={15} /> Log the first request
                </button>
              </div>
            ) : (
              <table className="ledger">
                <thead>
                  <tr>
                    <th style={{ width: "34%" }}>Request</th>
                    <th>Type</th>
                    <th>Quote</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="req-title">{r.title}</div>
                        {r.detail && <div className="req-detail">{r.detail}</div>}
                        <div className="date">{formatDate(r.createdAt)} · {r.hours}h{r.days > 0 ? ` · +${r.days}d` : ""}</div>
                      </td>
                      <td><span className={`pill pill-${r.kind}`}>{KIND_META[r.kind].label}</span></td>
                      <td className="num">
                        {r.kind === "extra"
                          ? formatMoney(quoteFor(r, project), project.currency)
                          : r.kind === "swap" ? "Swap" : "—"}
                      </td>
                      <td>
                        <select
                          className="status-select" value={r.status} aria-label={`Status of ${r.title}`}
                          onChange={(e) => updateRequest(r.id, { status: e.target.value as RequestStatus })}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {r.approvedAt && r.status !== "logged" && (
                          <div className="date"><Check size={11} /> approved {formatDate(r.approvedAt)}</div>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-small btn-icon" title="Message for the client" onClick={() => setMessageFor(r)}>
                            <MessageSquareText size={15} />
                          </button>
                          {r.kind === "extra" && (
                            <button className="btn btn-small btn-icon" title="Change order document" onClick={() => setOrderFor(r)}>
                              <FileText size={15} />
                            </button>
                          )}
                          <button className="btn btn-small btn-icon" title="Delete" onClick={() => deleteRequest(r.id)}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Scope + guide */}
          <aside>
            <section className="panel" aria-label="Agreed scope">
              <div className="panel-head"><h2>Agreed scope</h2></div>
              <ul className="scope-list">
                {project.scope.map((item) => (
                  <li key={item}>
                    <Check size={15} className="tick" />
                    <span>{item}</span>
                    <button
                      className="del" aria-label={`Remove ${item}`}
                      onClick={() => updateProject({ scope: project.scope.filter((s) => s !== item) })}
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="scope-add">
                <input
                  className="field" placeholder="Add a scope item…" value={newScopeItem}
                  onChange={(e) => setNewScopeItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newScopeItem.trim()) {
                      updateProject({ scope: [...project.scope, newScopeItem.trim()] });
                      setNewScopeItem("");
                    }
                  }}
                />
                <button
                  className="btn"
                  onClick={() => {
                    if (newScopeItem.trim()) {
                      updateProject({ scope: [...project.scope, newScopeItem.trim()] });
                      setNewScopeItem("");
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-2)", padding: "10px 14px 14px", margin: 0 }}>
                This list is your reference point. If a request isn’t on it,
                it isn’t included — it gets sorted, quoted, and approved in writing.
              </p>
            </section>

            <section className="panel" style={{ marginTop: 20 }} aria-label="The five buckets">
              <div className="panel-head"><h2>The five buckets</h2></div>
              <dl className="guide">
                {(Object.keys(KIND_META) as RequestKind[]).map((k) => (
                  <div key={k}>
                    <dt>{KIND_META[k].label}</dt>
                    <dd>{KIND_META[k].hint}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <WaitlistPanel />
          </aside>
        </div>

        <p className="footer-note">
          Local-first: your projects and client names never leave this browser.
          Export a JSON backup before clearing site data. Built for the freelancers
          who were told “it’s just one small thing”.
        </p>
      </div>

      <Analytics />
      {showForm && (
        <RequestForm project={project} onClose={() => setShowForm(false)} onSave={addRequest} />
      )}
      {messageFor && (
        <MessageModal request={messageFor} project={project} onClose={() => setMessageFor(null)} />
      )}
      {orderFor && (
        <ChangeOrderModal request={orderFor} project={project} onClose={() => setOrderFor(null)} />
      )}
    </>
  );
}
