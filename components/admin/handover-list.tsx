"use client";

import { useEffect, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  preparing: "Preparing",
  ready: "Ready for Handover",
  accessed: "Accessed",
  completed: "Completed",
  expired: "Expired",
  revoked: "Revoked"
};

interface Row {
  id: string;
  project_name: string;
  project_reference: string | null;
  client_name: string;
  client_email: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}
interface Counts { total: number; active: number; draft: number; expired: number; revoked: number }

export default function HandoverList() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/project-vault", { cache: "no-store" });
        if (!res.ok) {
          setState("error");
          return;
        }
        const data = await res.json();
        setRows(data.handovers || []);
        setCounts(data.counts || null);
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.project_name, r.project_reference, r.client_name, r.client_email]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <>
      <div className="app-bar">
        <h1>Project Vault handovers</h1>
        <a className="soft-btn" href="/admin/project-vault/new">
          New handover
        </a>
      </div>

      {counts ? (
        <div className="app-grid">
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.total}</b><span>Total</span></div>
              <div><b>{counts.active}</b><span>Active</span></div>
            </div>
          </div>
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.draft}</b><span>Draft / preparing</span></div>
              <div><b>{counts.expired}</b><span>Expired</span></div>
            </div>
          </div>
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.revoked}</b><span>Revoked</span></div>
              <div><b>{rows.length}</b><span>Listed</span></div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <div className="f-field" style={{ marginBottom: 16 }}>
          <label htmlFor="vault-search">Search</label>
          <input
            className="f-input"
            id="vault-search"
            type="search"
            placeholder="Project, reference, client or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {state === "loading" ? <p className="muted">Loading handovers…</p> : null}
        {state === "error" ? <p className="vault-note" data-tone="error">Could not load handovers.</p> : null}
        {state === "ready" && filtered.length === 0 ? (
          <p className="vault-empty">No handovers yet. Create one to get started.</p>
        ) : null}

        {filtered.map((r) => (
          <div className="vault-file" key={r.id}>
            <div className="vault-file-main">
              <b>{r.project_name}</b>
              <span>
                {r.client_name} · {r.client_email}
                {r.project_reference ? " · " + r.project_reference : ""}
              </span>
            </div>
            <span className="status-pill">
              <span className="pdot" />
              {STATUS_LABEL[r.status] || r.status}
            </span>
            <a className="soft-btn sm ghost" href={`/admin/project-vault/${r.id}`}>
              Manage
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
