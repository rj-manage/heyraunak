"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { humanFileSize } from "@/lib/vault/storage";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", preparing: "Preparing", ready: "Ready for Handover",
  accessed: "Accessed", completed: "Completed", expired: "Expired", revoked: "Revoked"
};

interface FileRow {
  id: string; display_name: string | null; original_filename: string; category: string;
  file_size: number | null; is_visible: boolean; is_downloadable: boolean; created_at: string;
}
interface EventRow { id: string; event_type: string; created_at: string }
interface Handover {
  id: string; client_name: string; client_email: string; project_name: string;
  project_reference: string | null; service_category: string | null; description: string | null;
  handover_message: string | null; delivery_date: string | null; expires_at: string | null; status: string;
}

export default function HandoverDetail({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [h, setH] = useState<Handover | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "ok" | "error">("idle");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/project-vault/${id}`, { cache: "no-store" });
    if (!res.ok) { setState("error"); return; }
    const data = await res.json();
    setH(data.handover);
    setFiles(data.files || []);
    setEvents(data.events || []);
    setState("ready");
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function act(path: string, init: RequestInit, okMessage: string) {
    setBusy(true); setTone("idle"); setMessage("");
    try {
      const res = await fetch(path, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setTone("error"); setMessage(data.message || "That action failed."); return null; }
      setTone("ok"); setMessage(okMessage);
      return data;
    } catch {
      setTone("error"); setMessage("That action failed."); return null;
    } finally { setBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!h) return;
    const body = {
      clientName: h.client_name, clientEmail: h.client_email, projectName: h.project_name,
      projectReference: h.project_reference || null, serviceCategory: h.service_category || null,
      description: h.description || null, handoverMessage: h.handover_message || null,
      deliveryDate: h.delivery_date || null, expiresAt: h.expires_at || null
    };
    const ok = await act(`/api/admin/project-vault/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    }, "Handover updated.");
    if (ok) await load();
  }

  async function setStatus(status: string) {
    const ok = await act(`/api/admin/project-vault/${id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
    }, `Status set to ${STATUS_LABEL[status] || status}.`);
    if (ok) await load();
  }

  async function regenerate() {
    const data = await act(`/api/admin/project-vault/${id}/code`, { method: "POST" }, "New access code generated.");
    if (data) setNewCode(data.accessCode);
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const ok = await act(`/api/admin/project-vault/${id}/files`, { method: "POST", body: fd }, "File uploaded.");
    if (fileInput.current) fileInput.current.value = "";
    if (ok) await load();
  }

  async function toggleVisibility(f: FileRow) {
    const ok = await act(`/api/admin/project-vault/${id}/files/${f.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !f.is_visible, isDownloadable: !f.is_visible })
    }, "File updated.");
    if (ok) await load();
  }

  async function removeFile(f: FileRow) {
    if (!confirm(`Remove “${f.display_name || f.original_filename}” from this handover?`)) return;
    const ok = await act(`/api/admin/project-vault/${id}/files/${f.id}`, { method: "DELETE" }, "File removed.");
    if (ok) await load();
  }

  if (state === "loading") return <div className="app-card"><p className="muted">Loading…</p></div>;
  if (state === "error" || !h) return <div className="app-card"><p className="vault-note" data-tone="error">Could not load this handover.</p></div>;

  return (
    <>
      <div className="app-bar">
        <h1>{h.project_name}</h1>
        <span className="status-pill"><span className="pdot" />{STATUS_LABEL[h.status] || h.status}</span>
      </div>

      {message ? <div className="app-card"><p className="vault-note" data-tone={tone}>{message}</p></div> : null}

      {newCode ? (
        <div className="app-card">
          <p className="muted">New access code — shown once:</p>
          <p className="vault-note" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.1em", color: "var(--mint-ink)" }}>{newCode}</p>
        </div>
      ) : null}

      <form className="app-card" onSubmit={save} noValidate>
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Details</h2>
        <div className="f-grid">
          <div className="f-field"><label htmlFor="client_name">Client name</label>
            <input className="f-input" id="client_name" value={h.client_name} onChange={(e) => setH({ ...h, client_name: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="client_email">Client email</label>
            <input className="f-input" id="client_email" type="email" value={h.client_email} onChange={(e) => setH({ ...h, client_email: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="project_name">Project name</label>
            <input className="f-input" id="project_name" value={h.project_name} onChange={(e) => setH({ ...h, project_name: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="project_reference">Reference</label>
            <input className="f-input" id="project_reference" value={h.project_reference || ""} onChange={(e) => setH({ ...h, project_reference: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="service_category">Service category</label>
            <input className="f-input" id="service_category" value={h.service_category || ""} onChange={(e) => setH({ ...h, service_category: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="delivery_date">Delivery date</label>
            <input className="f-input" id="delivery_date" type="date" value={h.delivery_date || ""} onChange={(e) => setH({ ...h, delivery_date: e.target.value })} /></div>
          <div className="f-field"><label htmlFor="expires_at">Access expires</label>
            <input className="f-input" id="expires_at" type="date" value={h.expires_at || ""} onChange={(e) => setH({ ...h, expires_at: e.target.value })} /></div>
          <div className="f-field wide"><label htmlFor="description">Description</label>
            <textarea className="f-input" id="description" rows={2} value={h.description || ""} onChange={(e) => setH({ ...h, description: e.target.value })} /></div>
          <div className="f-field wide"><label htmlFor="handover_message">Handover message</label>
            <textarea className="f-input" id="handover_message" rows={2} value={h.handover_message || ""} onChange={(e) => setH({ ...h, handover_message: e.target.value })} /></div>
        </div>
        <div className="vault-actions">
          <button className="soft-btn" type="submit" disabled={busy}>Save changes</button>
        </div>
      </form>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Access</h2>
        <div className="vault-actions" style={{ marginTop: 0 }}>
          <button className="soft-btn ghost" type="button" disabled={busy} onClick={regenerate}>Regenerate code</button>
          <button className="soft-btn ghost" type="button" disabled={busy} onClick={() => setStatus("ready")}>Activate</button>
          <button className="soft-btn ghost" type="button" disabled={busy} onClick={() => setStatus("revoked")}>Revoke access</button>
          <button className="soft-btn ghost" type="button" disabled={busy} onClick={() => setStatus("expired")}>Expire now</button>
        </div>
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Files</h2>
        <div className="f-field">
          <label htmlFor="vault-upload">Upload a deliverable</label>
          <input className="f-input" id="vault-upload" type="file" ref={fileInput} onChange={upload} disabled={busy} />
          <p className="f-hint">ZIP, PDF, documents, images and source archives up to 100 MB.</p>
        </div>
        {files.length === 0 ? <p className="vault-empty">No files yet.</p> : null}
        {files.map((f) => (
          <div className="vault-file" key={f.id}>
            <div className="vault-file-main">
              <b>{f.display_name || f.original_filename}</b>
              <span>{humanFileSize(f.file_size)} · {f.category} · {f.is_visible ? "visible" : "hidden"}</span>
            </div>
            <button className="soft-btn sm ghost" type="button" disabled={busy} onClick={() => toggleVisibility(f)}>
              {f.is_visible ? "Hide" : "Show"}
            </button>
            <button className="soft-btn sm ghost" type="button" disabled={busy} onClick={() => removeFile(f)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Activity</h2>
        {events.length === 0 ? <p className="vault-empty">No activity yet.</p> : null}
        {events.map((ev) => (
          <div className="vault-file" key={ev.id}>
            <div className="vault-file-main"><b>{ev.event_type}</b><span>{new Date(ev.created_at).toLocaleString()}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}
