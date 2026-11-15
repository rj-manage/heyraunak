import SiteNav from "@/components/site-nav";
import AccessForm from "@/components/vault/access-form";

export const metadata = {
  title: "Project Vault - RJ Studio",
  description:
    "Your completed project, documents and deliverables - securely organised in one place.",
  robots: { index: true, follow: true }
};

// Layout mirrors the reference Project Vault page: no page header, straight into
// the two-column card grid plus a full-width contact card. The site nav is
// untouched.
export default function ProjectVaultPage() {
  return (
    <>
      <SiteNav active="/project-vault" />

      <main>
        <section className="vault-section">
          <div className="wrap">
            <h1 className="sr-only">Project Vault</h1>

            <div className="vault-grid">
              <AccessForm />

              <aside className="vault-card">
                <h2>How access works</h2>
                <p>One code unlocks your private handover.</p>

                <div className="vault-meta" style={{ marginTop: 4 }}>
                  <div>
                    <b>Access code</b>
                    <span>Unique to your project</span>
                  </div>
                  <div>
                    <b>Email check</b>
                    <span>Sent to your registered inbox</span>
                  </div>
                </div>

                <ul className="bullets" style={{ marginTop: 22 }}>
                  <li>
                    <span className="tic">✓</span> Files are private to your verified session.
                  </li>
                  <li>
                    <span className="tic">✓</span> Download links are signed and short-lived.
                  </li>
                  <li>
                    <span className="tic">✓</span> We never confirm whether a code belongs to anyone.
                  </li>
                  <li>
                    <span className="tic">✓</span> Sessions expire automatically; sign out when finished.
                  </li>
                </ul>

                <p className="vault-note">
                  Access codes are shared only with the client. If you have changed address, contact RJ
                  Studio before your handover is due.
                </p>
              </aside>

              <article className="vault-card" style={{ gridColumn: "1 / -1" }}>
                <h2>Ready to talk about your next project?</h2>
                <p>Planning something new, or need a hand with this one? We&rsquo;re happy to help.</p>

                <div className="vault-meta">
                  <div>
                    <b>theprofessionalrj@gmail.com</b>
                    <span>Email</span>
                  </div>
                  <div>
                    <b>+91 77008 87944</b>
                    <span>Phone &amp; WhatsApp</span>
                  </div>
                  <div>
                    <b>Bengaluru, India</b>
                    <span>Studio</span>
                  </div>
                  <div>
                    <b>Mon&ndash;Sat</b>
                    <span>Working hours</span>
                  </div>
                </div>

                <div className="vault-actions" style={{ marginTop: 20 }}>
                  <a
                    className="soft-btn"
                    href="mailto:theprofessionalrj@gmail.com?subject=Project%20Vault%20enquiry"
                  >
                    Send an email
                  </a>
                  <a className="soft-btn ghost" href="tel:+917700887944">
                    Call now
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot">
          <div className="foot-main">
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
            <div className="flinks">
              <a href="/portfolio/">Portfolio</a>
              <a href="/services/">Services</a>
              <a href="/gallery/">Design Gallery</a>
              <a href="/works/">Works</a>
              <a href="/contact/">Contact Us</a>
              <a href="/project-vault">Project Vault</a>
            </div>
          </div>
          <div className="foot-tag">
            <span>© 2026 RJ · We design digital experiences.</span>
            <a href="/">← Back to home</a>
          </div>
        </div>
      </footer>
    </>
  );
}
