"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { humanFileSize } from "@/lib/vault/storage";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", preparing: "Preparing", ready: "Ready for Handover",
  accessed: "Accessed", completed: "Completed", expired: "Expired", revoked: "Revoked"
};

interface FileRow {
  id: string; display_name: string | null; original_filename: string; category: string;
  file_size: number | null; is_visible: boolean; is_downloadable: boolean; created_at: string;
}
interface Handover {
  id: string; client_name: string; client_email: string; project_name: string;
  project_reference: string | null; service_category: string | null; description: string | null;
  handover_message: string | null; delivery_date: string | null; expires_at: string | null; status: string;
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  return `${mins}m ${total % 60}s`;
}

export default function HandoverDetail({ id }: { id: string }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [h, setH] = useState<Handover | null>(null);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "ok" | "error">("idle");
  const [newCode, setNewCode] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [progress, setProgress] = useState<{
    label: string;
    pct: number;
    eta?: number;
    cancellable?: boolean;
  } | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/project-vault/${id}`, { cache: "no-store" });
    if (!res.ok) { setState("error"); return; }
    const data = await res.json();
    setH(data.handover);
    setFiles(data.files || []);
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

  function cancelUpload() {
    cancelledRef.current = true;
    xhrRef.current?.abort();
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const title = files.length === 1 ? uploadTitle.trim() : "";
    const startedAt = performance.now();
    let sentBytes = 0;
    let uploaded = 0;
    let cancelled = false;

    cancelledRef.current = false;
    setBusy(true);
    setTone("idle");
    setMessage("");
    setProgress({ label: files[0].name, pct: 0, eta: 0, cancellable: true });

    for (const file of files) {
      if (cancelledRef.current) { cancelled = true; break; }

      const fd = new FormData();
      fd.append("file", file);
      if (title) fd.append("title", title);

      const result = await sendWithBody(fd, file, sentBytes, totalBytes, startedAt);
      if (result === "cancelled") { cancelled = true; break; }
      if (result === "ok") uploaded++;
      sentBytes += file.size;
    }

    xhrRef.current = null;
    if (fileInput.current) fileInput.current.value = "";
    e.target.value = "";
    setUploadTitle("");
    setBusy(false);

    if (cancelled) {
      setProgress(null);
      setTone("error");
      setMessage(`Upload cancelled. ${uploaded} file(s) were uploaded before cancelling.`);
    } else {
      setProgress({ label: "Finishing…", pct: 100, eta: 0 });
      setTone(uploaded === files.length ? "ok" : "error");
      setMessage(`${uploaded} of ${files.length} file(s) uploaded.`);
      setTimeout(() => setProgress(null), 800);
    }
    await load();
  }

  function sendWithBody(fd: FormData, file: File, baseBytes: number, totalBytes: number, startedAt: number): Promise<"ok" | "error" | "cancelled"> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("POST", `/api/admin/project-vault/${id}/files`);

      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        const sent = baseBytes + ev.loaded;
        const pct = Math.min(100, Math.round((sent / Math.max(1, totalBytes)) * 100));
        const elapsed = Math.max(0.15, (performance.now() - startedAt) / 1000);
        const speed = sent / elapsed;
        const eta = speed > 0 ? (totalBytes - sent) / speed : 0;
        setProgress({ label: file.name, pct, eta, cancellable: true });
      };

      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300 ? "ok" : "error");
      xhr.onerror = () => resolve("error");
      xhr.onabort = () => resolve("cancelled");
      xhr.send(fd);
    });
  }

  async function toggleVisibility(f: FileRow) {
    const ok = await act(`/api/admin/project-vault/${id}/files/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !f.is_visible, isDownloadable: !f.is_visible })
    }, "File updated.");
    if (ok) await load();
  }

  async function removeHandover() {
    if (!confirm("Delete this handover permanently? Its files are removed and the client loses access.")) return;
    const ok = await act(`/api/admin/project-vault/${id}`, { method: "DELETE" }, "Handover deleted.");
    if (ok) router.replace("/admin/project-vault");
  }

  async function removeAllFiles() {
    if (!files.length) return;
    if (!confirm(`Delete all ${files.length} file(s) from this handover? This cannot be undone.`)) return;
    setBusy(true); setTone("idle"); setMessage("");
    let removed = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setProgress({ label: `Deleting ${i + 1} of ${files.length}`, pct: Math.round((i / files.length) * 100) });
      try {
        const res = await fetch(`/api/admin/project-vault/${id}/files/${f.id}`, { method: "DELETE" });
        if (res.ok) removed++;
      } catch {
        /* keep going */
      }
    }
    setBusy(false);
    setProgress({ label: "Finishing…", pct: 100 });
    setTone(removed === files.length ? "ok" : "error");
    setMessage(`${removed} of ${files.length} file(s) deleted.`);
    await load();
    setTimeout(() => setProgress(null), 700);
  }

  async function removeFile(f: FileRow) {
    if (!confirm(`Remove “${f.display_name || f.original_filename}” from this handover?`)) return;
    setProgress({ label: "Deleting file…", pct: 60 });
    const ok = await act(`/api/admin/project-vault/${id}/files/${f.id}`, { method: "DELETE" }, "File deleted.");
    setProgress(null);
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

        {progress ? (
          <>
            <div
              className="vault-progressbar"
              role="progressbar"
              aria-valuenow={progress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progress.label}
            >
              <span style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="vault-progress">
              {progress.label} — {progress.pct}%
              {formatEta(progress.eta || 0) ? ` · ${formatEta(progress.eta || 0)} left` : ""}
            </p>
            {progress.cancellable ? (
              <div className="vault-actions" style={{ marginTop: 6 }}>
                <button
                  className="soft-btn ghost sm"
                  type="button"
                  onClick={cancelUpload}
                  style={{ color: "#a63d33" }}
                >
                  Cancel upload
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="f-field">
          <label htmlFor="vault-title">
            Title <span className="opt">(optional — applied to single uploads)</span>
          </label>
          <input
            className="f-input"
            id="vault-title"
            value={uploadTitle}
            onChange={(e) => setUploadTitle(e.target.value)}
            placeholder="e.g. Source code (v1.0)"
            disabled={busy}
          />
        </div>

        <div className="f-field">
          <label htmlFor="vault-upload">Upload files</label>
          <input className="f-input" id="vault-upload" type="file" multiple ref={fileInput} onChange={upload} disabled={busy} />
          <p className="f-hint">Any file type — archives, PDFs, source, installers (.exe/.dll), assets. Up to 100 MB each.</p>
        </div>

        <div className="f-field">
          <label htmlFor="vault-folder">Or upload a folder</label>
          <input
            className="f-input"
            id="vault-folder"
            type="file"
            onChange={upload}
            disabled={busy}
            {...({ webkitdirectory: "true" } as any)}
          />
          <p className="f-hint">Every file inside the folder is uploaded and listed separately.</p>
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

        {files.length > 0 ? (
          <div className="vault-actions">
            <button
              className="soft-btn ghost sm"
              type="button"
              disabled={busy}
              onClick={removeAllFiles}
              style={{ color: "#a63d33" }}
            >
              Delete all files
            </button>
          </div>
        ) : null}
      </div>

      <div className="app-card">
        <h2 style={{ fontSize: 18, marginBottom: 14 }}>Danger zone</h2>
        <p className="muted" style={{ fontSize: 13.5 }}>
          Permanently delete this handover, its files and its activity. This cannot be undone.
        </p>
        <div className="vault-actions" style={{ marginTop: 14 }}>
          <button className="soft-btn ghost sm" type="button" disabled={busy} onClick={removeHandover} style={{ color: "#a63d33" }}>
            Delete handover
          </button>
        </div>
      </div>
    </>
  );
}
