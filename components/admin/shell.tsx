import type { ReactNode } from "react";

const LINKS = [
  { href: "/admin/project-vault", label: "Handovers" },
  { href: "/admin/project-vault/new", label: "New handover" },
  { href: "/project-vault", label: "Public vault" },
  { href: "/", label: "Website" }
];

export default function AdminShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="app-side">
        <a className="brand" href="/">
          <span className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/RJ_Logo_Black.png" alt="RJ logo" width={30} height={30} />
          </span>
          <span>
            <b>RJ</b>
            <small>Project Vault</small>
          </span>
        </a>
        <nav aria-label="Project Vault admin">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} aria-current={active === l.href ? "page" : undefined}>
              {l.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
