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

interface Row {
  id: string;
  enquiry_ref: string;
  category_name: string;
  service_name: string;
  status: string;
  contact: { fullName?: string; whatsapp?: string; company?: string };
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

export default function EnquiryList() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [query, setQuery] = useState("");

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

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [r.enquiry_ref, r.service_name, r.category_name, r.contact?.fullName, r.contact?.whatsapp, r.contact?.company]
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
            placeholder="Reference, service, name or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {state === "loading" ? <p className="muted">Loading enquiries…</p> : null}
        {state === "error" ? <p className="vault-note" data-tone="error">Could not load enquiries.</p> : null}
        {state === "ready" && filtered.length === 0 ? (
          <p className="vault-empty">No enquiries yet. New service enquiries will appear here.</p>
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
            <a className="soft-btn sm ghost" href={`/admin/enquiries/${r.id}`}>
              Open
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
