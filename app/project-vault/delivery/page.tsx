import SiteNav from "@/components/site-nav";
import DeliveryView from "@/components/vault/delivery-view";

export const metadata = {
  title: "Your project - RJ Studio Project Vault",
  robots: { index: false, follow: false }
};

export default function DeliveryPage() {
  return (
    <>
      <SiteNav active="/project-vault" />

      <main>
        <header className="page-head">
          <div className="sec-head reveal" style={{ maxWidth: 700 }}>
            <div className="kicker">Project Vault</div>
            <h1>Your project</h1>
            <p>Everything RJ Studio has prepared for you, ready to download.</p>
          </div>
        </header>

        <section className="vault-section">
          <div className="wrap">
            <div className="vault-grid" style={{ gridTemplateColumns: "1fr" }}>
              <DeliveryView />
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
            <span>© 2026 RJ · Private handover area</span>
            <a href="/">← Back to home</a>
          </div>
        </div>
      </footer>
    </>
  );
}
