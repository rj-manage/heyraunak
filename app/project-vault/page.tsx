import SiteNav from "@/components/site-nav";
import AccessForm from "@/components/vault/access-form";

export const metadata = {
  title: "Project Vault - RJ Studio",
  description:
    "Your completed project, documents and deliverables - securely organised in one place.",
  robots: { index: true, follow: true }
};

export default function ProjectVaultPage() {
  return (
    <>
      <SiteNav active="/project-vault" />

      <main>
        <header className="page-head">
          <div className="sec-head reveal" style={{ maxWidth: 700 }}>
            <div className="kicker">Project Vault</div>
            <h1>Project Vault</h1>
            <p>
              Your completed project, documents and deliverables - securely organised in one place.
            </p>
            <div className="soft-chip" style={{ marginTop: 20 }}>
              <span className="dot" /> Two-step access · Private files
            </div>
          </div>
        </header>

        <section className="vault-section">
          <div className="wrap">
            <div className="vault-grid">
              <AccessForm />

              <aside className="vault-card">
                <h2>How access works</h2>
                <p>Two independent checks protect every handover.</p>

                <div className="vault-meta" style={{ marginTop: 4 }}>
                  <div>
                    <b>1. Access code</b>
                    <span>Unique to your project</span>
                  </div>
                  <div>
                    <b>2. Email check</b>
                    <span>Sent to your registered inbox</span>
                  </div>
                </div>

                <ul className="bullets" style={{ marginTop: 22 }}>
                  <li>
                    <span className="tic">✓</span> Files are private and only shared with your verified
                    session.
                  </li>
                  <li>
                    <span className="tic">✓</span> Downloads are signed links that expire after a minute.
                  </li>
                  <li>
                    <span className="tic">✓</span> We never confirm whether a code belongs to anyone.
                  </li>
                  <li>
                    <span className="tic">✓</span> Sessions expire automatically; sign out when finished.
                  </li>
                </ul>

                <p className="vault-note">
                  Access codes are sent to the registered client email only. If you have changed address,
                  contact RJ Studio before your handover is due.
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
