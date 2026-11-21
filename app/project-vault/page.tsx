import SiteNav from "@/components/site-nav";
import AccessForm from "@/components/vault/access-form";

export const metadata = {
  title: "Project Vault - RJ Studio",
  description:
    "Your completed project, documents and deliverables - securely organised in one place.",
  robots: { index: true, follow: true }
};

// Page header mirrors the Contact page (kicker, heading, intro, chip), then the
// two-column card grid. The site nav is untouched.
export default function ProjectVaultPage() {
  return (
    <>
      <SiteNav active="/project-vault" />

      <main>
        <header className="page-head">
          <div className="sec-head" style={{ maxWidth: 660 }}>
            <div className="kicker">Project Vault</div>
            <h1>Your project, delivered.</h1>
            <p>
              Enter your access code to open your private handover - files, documents and deliverables, all
              in one place.
            </p>
            <div className="soft-chip" style={{ marginTop: 20 }}>
              <span className="dot" /> Private &amp; secure · Access code + email check
            </div>
          </div>
        </header>

        <section className="vault-section">
          <div className="wrap">
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
                <b>RJ Studio</b>
                <small>Design &amp; Development</small>
              </span>
            </a>
            <div className="flinks">
              <a href="/portfolio/">Portfolio</a>
              <a href="/services/">Services</a>
              <a href="/gallery/">Design Gallery</a>
              <a href="/products/">Products</a>
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
