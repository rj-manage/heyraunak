"use client";

import { useEffect, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "New",
  under_review: "Under review",
  more_info_required: "More info needed",
  qualified: "Qualified",
  not_qualified: "Not qualified",
  proposal_preparation: "Preparing proposal",
  proposal_sent: "Proposal sent",
  closed: "Closed",
  cancelled: "Cancelled"
};

const STATUS_ORDER: string[] = [
  "draft",
  "submitted",
  "under_review",
  "more_info_required",
  "qualified",
  "not_qualified",
  "proposal_preparation",
  "proposal_sent",
  "closed",
  "cancelled"
];

interface Row {
  id: string;
  enquiry_ref: string;
  category_name: string;
  service_name: string;
  status: string;
  contact: { fullName?: string; email?: string; whatsapp?: string; company?: string };
  submitted_at: string;
}
interface Counts {
  total: number;
  submitted: number;
  under_review: number;
  qualified: number;
  closed: number;
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function computeCounts(rows: Row[]): Counts {
  const counts: Counts = { total: rows.length, submitted: 0, under_review: 0, qualified: 0, closed: 0 };
  for (const row of rows) {
    if (row.status === "submitted") counts.submitted++;
    else if (row.status === "under_review") counts.under_review++;
    else if (row.status === "qualified") counts.qualified++;
    else if (row.status === "closed") counts.closed++;
  }
  return counts;
}

export default function EnquiryList() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/enquiries", { cache: "no-store" });
        if (!res.ok) {
          setState("error");
          return;
        }
        const data = await res.json();
        setRows(data.enquiries || []);
        setCounts(data.counts || null);
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, []);

  async function remove(r: Row) {
    if (!confirm(`Delete enquiry ${r.enquiry_ref} permanently? This cannot be undone.`)) return;
    setDeletingId(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/enquiries/${r.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setError(body.message || "Could not delete the enquiry.");
      } else {
        const next = rows.filter((row) => row.id !== r.id);
        setRows(next);
        setCounts(computeCounts(next));
      }
    } catch {
      setError("Could not delete the enquiry.");
    }
    setDeletingId(null);
  }

  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.enquiry_ref, r.service_name, r.category_name, r.contact?.fullName, r.contact?.email, r.contact?.whatsapp, r.contact?.company]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <>
      <div className="app-bar">
        <h1>Service enquiries</h1>
      </div>

      {counts ? (
        <div className="app-grid">
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.total}</b><span>Total</span></div>
              <div><b>{counts.submitted}</b><span>New</span></div>
            </div>
          </div>
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.under_review}</b><span>Under review</span></div>
              <div><b>{counts.qualified}</b><span>Qualified</span></div>
            </div>
          </div>
          <div className="app-card">
            <div className="vault-meta" style={{ marginTop: 0 }}>
              <div><b>{counts.closed}</b><span>Closed</span></div>
              <div><b>{rows.length}</b><span>Listed</span></div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="app-card">
        <div className="f-field" style={{ marginBottom: 16 }}>
          <label htmlFor="enq-search">Search</label>
          <input
            className="f-input"
            id="enq-search"
            type="search"
            placeholder="Reference, service, name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-row" role="group" aria-label="Filter by status">
          <button
            type="button"
            className={"soft-btn sm ghost" + (statusFilter === "all" ? " on" : "")}
            aria-pressed={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            All ({rows.length})
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={"soft-btn sm ghost" + (statusFilter === s ? " on" : "")}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABEL[s]} ({byStatus[s] || 0})
            </button>
          ))}
        </div>

        {state === "loading" ? <p className="muted">Loading enquiries…</p> : null}
        {state === "error" ? <p className="vault-note" data-tone="error">Could not load enquiries.</p> : null}
        {error ? <p className="vault-note" data-tone="error">{error}</p> : null}
        {state === "ready" && filtered.length === 0 ? (
          <p className="vault-empty">No enquiries match this view.</p>
        ) : null}

        {filtered.map((r) => (
          <div className="vault-file" key={r.id}>
            <div className="vault-file-main">
              <b>{r.service_name}</b>
              <span>
                {r.contact?.fullName || "-"}
                {r.contact?.company ? " · " + r.contact.company : ""} · {r.enquiry_ref} · {fmtDate(r.submitted_at)}
              </span>
            </div>
            <span className="status-pill">
              <span className="pdot" />
              {STATUS_LABEL[r.status] || r.status}
            </span>
            <button
              className="soft-btn sm ghost"
              type="button"
              disabled={deletingId === r.id}
              onClick={() => remove(r)}
              style={{ color: "#a63d33" }}
            >
              Delete
            </button>
            <a className="soft-btn sm ghost" href={`/admin/enquiries/${r.id}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
