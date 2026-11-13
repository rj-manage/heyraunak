"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CATEGORY_ORDER = ["main", "documentation", "assets", "additional"] as const;
type Category = (typeof CATEGORY_ORDER)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  main: "Main Project Files",
  documentation: "Documentation",
  assets: "Project Assets",
  additional: "Additional Deliverables"
};

interface VaultFile {
  id: string;
  name: string;
  originalFilename: string;
  description: string | null;
  category: Category;
  mimeType: string | null;
  sizeLabel: string;
  uploadedAt: string;
  downloadable: boolean;
  downloadUrl: string;
}

interface ProjectInfo {
  name: string;
  reference: string | null;
  statusLabel: string;
  deliveryDate: string | null;
  serviceCategory: string | null;
  description: string | null;
  handoverMessage: string | null;
  expiresAt: string | null;
}

function fileTag(file: VaultFile): string {
  const name = file.originalFilename || file.name;
  const dot = name.lastIndexOf(".");
  if (dot > 0) return name.slice(dot + 1).slice(0, 4).toUpperCase();
  return "FILE";
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DeliveryView() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [message, setMessage] = useState("");
  const [preparing, setPreparing] = useState(false);
  const zipForm = useRef<HTMLFormElement | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/project-vault/session", { cache: "no-store" });
      if (res.status === 401) {
        window.location.assign("/project-vault");
        return;
      }
      const data = await res.json();
      if (!data?.ok) {
        setStatus("error");
        setMessage("We couldn't open this handover. Please sign in again.");
        return;
      }
      setProject(data.project);
      setFiles(Array.isArray(data.files) ? data.files : []);
      setStatus("ready");
    } catch {
      setStatus("error");
      setMessage("Something went wrong while loading your project.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    try {
      await fetch("/api/project-vault/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    window.location.assign("/project-vault");
  }

  function downloadAll() {
    setPreparing(true);
    setMessage("Preparing your archive - your browser will show the download progress.");
    window.setTimeout(() => zipForm.current?.submit(), 50);
  }

  if (status === "loading") {
    return (
      <div className="vault-card">
        <h2>Opening your project…</h2>
        <p>Verifying your session and preparing your files.</p>
        <div className="soon-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (status === "error" || !project) {
    return (
      <div className="vault-card">
        <h2>Access unavailable</h2>
        <p>{message || "Please sign in again to open your project."}</p>
        <div className="vault-actions">
          <a className="soft-btn" href="/project-vault">
            Back to Project Vault
          </a>
          <a className="soft-btn ghost" href="/contact/">
            Contact RJ Studio
          </a>
        </div>
      </div>
    );
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: files.filter((f) => f.category === cat)
  })).filter((group) => group.items.length > 0);

  const downloadableCount = files.filter((f) => f.downloadable).length;

  return (
    <>
      <div className="vault-card">
        <div className="soft-chip" style={{ marginBottom: 14 }}>
          <span className="dot" /> {project.statusLabel}
        </div>
        <h2>{project.name}</h2>
        {project.description ? <p>{project.description}</p> : null}

        <div className="vault-meta">
          {project.reference ? (
            <div>
              <b>{project.reference}</b>
              <span>Project reference</span>
            </div>
          ) : null}
          {project.serviceCategory ? (
            <div>
              <b>{project.serviceCategory}</b>
              <span>Service</span>
            </div>
          ) : null}
          {formatDate(project.deliveryDate) ? (
            <div>
              <b>{formatDate(project.deliveryDate)}</b>
              <span>Delivery date</span>
            </div>
          ) : null}
          <div>
            <b>{files.length}</b>
            <span>Files in this handover</span>
          </div>
          {formatDate(project.expiresAt) ? (
            <div>
              <b>{formatDate(project.expiresAt)}</b>
              <span>Access expires</span>
            </div>
          ) : null}
        </div>

        {project.handoverMessage ? (
          <p className="vault-note" style={{ marginTop: 18, fontSize: 14 }}>
            {project.handoverMessage}
          </p>
        ) : null}

        <div className="vault-actions" style={{ marginTop: 20 }}>
          <button
            className="soft-btn"
            type="button"
            onClick={downloadAll}
            disabled={preparing || downloadableCount === 0}
          >
            {preparing ? "Preparing…" : "Download all files"}
          </button>
          <a className="soft-btn ghost" href="mailto:theprofessionalrj@gmail.com?subject=Project%20Vault%20question">
            Report an issue
          </a>
          <button className="soft-btn ghost" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>

        {message ? (
          <p className="vault-progress" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
      </div>

      {grouped.length === 0 ? (
        <div className="vault-card">
          <p className="vault-empty">No files have been published for this project yet.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section className="vault-card" key={group.category}>
            <div className="vault-cat" style={{ marginTop: 0 }}>
              <h3>
                {group.label} <span>{group.items.length}</span>
              </h3>
              {group.items.map((file) => (
                <div className="vault-file" key={file.id}>
                  <span className="vault-file-ico" aria-hidden="true">
                    {fileTag(file)}
                  </span>
                  <div className="vault-file-main">
                    <b>{file.name}</b>
                    <span>
                      {file.sizeLabel}
                      {formatDate(file.uploadedAt) ? " · " + formatDate(file.uploadedAt) : ""}
                    </span>
                    {file.description ? <p>{file.description}</p> : null}
                  </div>
                  {file.downloadable ? (
                    <a className="soft-btn sm" href={file.downloadUrl}>
                      Download
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* native form POST so the archive streams straight to disk */}
      <form ref={zipForm} action="/api/project-vault/download-all" method="post" hidden>
        <button type="submit" tabIndex={-1}>
          Download all
        </button>
      </form>
    </>
  );
}
