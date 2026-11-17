"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS: [string, string][] = [
  ["submitted", "New"],
  ["under_review", "Under review"],
  ["more_info_required", "More info needed"],
  ["qualified", "Qualified"],
  ["not_qualified", "Not qualified"],
  ["proposal_preparation", "Preparing proposal"],
  ["proposal_sent", "Proposal sent"],
  ["closed", "Closed"],
  ["cancelled", "Cancelled"]
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUS_OPTIONS);

interface Detail {
  enquiry: {
    id: string;
    enquiry_ref: string;
    category_name: string;
    service_name: string;
    status: string;
    contact: { fullName?: string; email?: string; whatsapp?: string; company?: string };
    project_details: { label: string; value: unknown }[];
    timeline: string | null;
    source: string | null;
    submitted_at: string;
  };
  attachments: { id: string; file_name: string; mime_type: string | null; size: string; url: string | null }[];
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

function displayValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  return String(v == null ? "" : v);
}

function waLink(raw?: string): string | null {
  const digits = String(raw || "").replace(/[^0-9]/g, "");
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
}

export default function EnquiryDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<Detail | null>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [whatsappHref, setWhatsappHref] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { cache: "no-store" });
      if (!res.ok) {
        setState("error");
        return;
      }
      const d = (await res.json()) as Detail;
      setData(d);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveStatus(next: string) {
    if (!data) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) {
        setMsg("Could not update the status.");
      } else {
        setData({ ...data, enquiry: { ...data.enquiry, status: next } });
        setMsg("Status updated.");
      }
    } catch {
      setMsg("Could not update the status.");
    }
    setSaving(false);
  }

  async function sendUpdate() {
    if (!data) return;
    setSending(true);
    setMsg("");
    setWhatsappHref("");
    try {
      const res = await fetch(`/api/admin/enquiries/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.enquiry.status })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setMsg(body.message || "Could not send the update.");
        setSending(false);
        return;
      }
      const parts: string[] = [];
      if (body.email?.sent) parts.push("Email sent");
      else if (body.email?.reason === "no_email") parts.push("No email on file");
      else if (body.email?.reason === "not_configured") parts.push("Email not configured");
      else parts.push("Email failed");
      if (body.whatsappUrl) {
        const opened = window.open(body.whatsappUrl, "_blank", "noopener");
        if (opened) parts.push("WhatsApp opened - press send");
        else {
          setWhatsappHref(body.whatsappUrl);
          parts.push("WhatsApp ready - open below");
        }
      } else {
        parts.push("No WhatsApp number on file");
      }
      setMsg(parts.join(" · "));
    } catch {
      setMsg("Could not send the update.");
    }
    setSending(false);
  }

  async function remove() {
    if (!confirm("Delete this enquiry permanently? Its attachments are removed and this cannot be undone.")) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setMsg(body.message || "Could not delete the enquiry.");
        setSaving(false);
        return;
      }
      router.replace("/admin/enquiries");
    } catch {
      setMsg("Could not delete the enquiry.");
      setSaving(false);
    }
  }

  if (state === "loading") return <p className="muted">Loading enquiry…</p>;
  if (state === "error" || !data) {
    return <p className="vault-note" data-tone="error">Could not load this enquiry.</p>;
  }

  const e = data.enquiry;
  const wa = waLink(e.contact?.whatsapp);

  return (
    <>
      <div className="app-bar">
        <h1>{e.service_name}</h1>
        <a className="soft-btn ghost" href="/admin/enquiries">Back to list</a>
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Contact</h2>
        <div className="vault-meta" style={{ marginTop: 0 }}>
          <div><b>{e.contact?.fullName || "-"}</b><span>Name</span></div>
          <div>
            <b>{wa ? <a href={wa} target="_blank" rel="noopener">{e.contact?.whatsapp}</a> : e.contact?.whatsapp || "-"}</b>
            <span>WhatsApp</span>
          </div>
          <div>
            <b>{e.contact?.email ? <a href={"mailto:" + e.contact.email}>{e.contact.email}</a> : "-"}</b>
            <span>Email</span>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          {e.category_name} · {e.enquiry_ref} · {fmtDate(e.submitted_at)}
          {e.contact?.company ? " · " + e.contact.company : ""}
        </p>
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Requirements</h2>
        {e.project_details.length === 0 ? (
          <p className="muted">No extra details were provided.</p>
        ) : (
          <div className="vault-meta" style={{ marginTop: 0, gridTemplateColumns: "1fr" }}>
            {e.project_details.map((item, i) => (
              <div key={i}>
                <b>{displayValue(item.value) || "-"}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.attachments.length ? (
        <div className="app-card">
          <h2 style={{ fontSize: 18, marginBottom: 14 }}>Attachments</h2>
          {data.attachments.map((a) => (
            <div className="vault-file" key={a.id}>
              <div className="vault-file-main">
                <b>{a.file_name}</b>
                <span>{a.size}</span>
              </div>
              {a.url ? (
                <a className="soft-btn sm ghost" href={a.url} target="_blank" rel="noopener">Download</a>
              ) : (
                <span className="muted">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Status</h2>
        <select
          className="f-input"
          value={e.status}
          disabled={saving}
          onChange={(ev) => saveStatus(ev.target.value)}
          aria-label="Enquiry status"
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          Sends the &ldquo;{STATUS_LABEL[e.status] || e.status}&rdquo; update to the customer by email and WhatsApp.
        </p>
        <div className="vault-actions" style={{ marginTop: 12 }}>
          <button className="soft-btn" type="button" disabled={sending || saving} onClick={sendUpdate}>
            {sending ? "Sending…" : "Send Update"}
          </button>
        </div>
        {whatsappHref ? (
          <p style={{ marginTop: 10 }}>
            <a className="soft-btn sm ghost" href={whatsappHref} target="_blank" rel="noopener">Open WhatsApp</a>
          </p>
        ) : null}
        {msg ? <p className="muted" style={{ marginTop: 10 }}>{msg}</p> : null}
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Danger zone</h2>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Permanently delete this enquiry and its attachments. This cannot be undone.
        </p>
        <div className="vault-actions" style={{ marginTop: 14 }}>
          <button className="soft-btn ghost sm" type="button" disabled={saving} onClick={remove} style={{ color: "#a63d33" }}>
            Delete enquiry
          </button>
        </div>
      </div>
    </>
  );
}
