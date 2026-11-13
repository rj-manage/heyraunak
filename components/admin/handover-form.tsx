"use client";

import { useState } from "react";

const STATUSES = ["draft", "preparing", "ready"] as const;

export default function HandoverForm() {
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    projectName: "",
    projectReference: "",
    serviceCategory: "",
    description: "",
    handoverMessage: "",
    deliveryDate: "",
    expiresAt: "",
    status: "draft"
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ id: string; accessCode: string } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/project-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: form.clientName,
          clientEmail: form.clientEmail,
          projectName: form.projectName,
          projectReference: form.projectReference || null,
          serviceCategory: form.serviceCategory || null,
          description: form.description || null,
          handoverMessage: form.handoverMessage || null,
          deliveryDate: form.deliveryDate || null,
          expiresAt: form.expiresAt || null,
          status: form.status
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Could not create the handover.");
        return;
      }
      setCreated({ id: data.id, accessCode: data.accessCode });
    } catch {
      setError("Could not create the handover.");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="app-card">
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Handover created</h2>
        <p className="muted">Share this access code with the client. It is shown only once.</p>
        <p className="vault-note" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.1em", color: "var(--mint-ink)" }}>
          {created.accessCode}
        </p>
        <p className="muted" style={{ marginTop: 8 }}>
          Only a hash is stored — regenerate the code if you lose it.
        </p>
        <div className="vault-actions" style={{ marginTop: 18 }}>
          <a className="soft-btn" href={`/admin/project-vault/${created.id}`}>
            Open handover
          </a>
          <a className="soft-btn ghost" href="/admin/project-vault">
            Back to list
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="app-card" noValidate>
      <div className="f-grid">
        <div className="f-field">
          <label htmlFor="clientName">Client name</label>
          <input className="f-input" id="clientName" required value={form.clientName}
            onChange={(e) => set("clientName", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="clientEmail">Client email</label>
          <input className="f-input" id="clientEmail" type="email" required value={form.clientEmail}
            onChange={(e) => set("clientEmail", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="projectName">Project name</label>
          <input className="f-input" id="projectName" required value={form.projectName}
            onChange={(e) => set("projectName", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="projectReference">Project reference <span className="opt">(optional)</span></label>
          <input className="f-input" id="projectReference" value={form.projectReference}
            onChange={(e) => set("projectReference", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="serviceCategory">Service category <span className="opt">(optional)</span></label>
          <input className="f-input" id="serviceCategory" value={form.serviceCategory}
            onChange={(e) => set("serviceCategory", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="status">Status</label>
          <select className="f-input f-select" id="status" value={form.status}
            onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="f-field">
          <label htmlFor="deliveryDate">Delivery date <span className="opt">(optional)</span></label>
          <input className="f-input" id="deliveryDate" type="date" value={form.deliveryDate}
            onChange={(e) => set("deliveryDate", e.target.value)} />
        </div>
        <div className="f-field">
          <label htmlFor="expiresAt">Access expires <span className="opt">(optional)</span></label>
          <input className="f-input" id="expiresAt" type="date" value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)} />
        </div>
        <div className="f-field wide">
          <label htmlFor="description">Project description <span className="opt">(optional)</span></label>
          <textarea className="f-input" id="description" rows={2} value={form.description}
            onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="f-field wide">
          <label htmlFor="handoverMessage">Handover message <span className="opt">(optional)</span></label>
          <textarea className="f-input" id="handoverMessage" rows={2} value={form.handoverMessage}
            onChange={(e) => set("handoverMessage", e.target.value)} />
        </div>
      </div>

      {error ? <p className="vault-note" data-tone="error" role="alert">{error}</p> : null}

      <div className="vault-actions">
        <button className="soft-btn" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create handover"}
        </button>
        <a className="soft-btn ghost" href="/admin/project-vault">Cancel</a>
      </div>
    </form>
  );
}
