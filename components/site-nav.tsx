"use client";

import { useState } from "react";

// Mirrors the public site's nav markup exactly (plain anchors, same classes) and
// adds Project Vault. Kept as a client component only for the mobile toggle.
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: "/services/", label: "Services" },
  { href: "/gallery/", label: "Design Gallery" },
  { href: "/works/", label: "Works" },
  { href: "/contact/", label: "Contact Us" },
  { href: "/project-vault", label: "Project Vault" }
];

export default function SiteNav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav" aria-label="Primary">
      <a className="brand" href="/">
        <span className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/RJ_Logo_Black.png" alt="RJ logo" width={30} height={30} />
        </span>
        <span>
          <b>RJ</b>
          <small>Design &amp; Development</small>
        </span>
      </a>

      <div className={"nav-links" + (open ? " open" : "")} id="menu">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            aria-current={active === link.href ? "page" : undefined}
            className={active === link.href ? "active" : undefined}
          >
            {link.label}
          </a>
        ))}
      </div>

      <a className="soft-btn cta" href="/gallery/">
        Explore Designs
      </a>

      <button
        className="burger"
        id="burger"
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
    </nav>
  );
}
