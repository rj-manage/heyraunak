import Link from "next/link";
import SignInForm from "@/components/sign-in-form";

export const metadata = { title: "Sign in - RJ Studio" };

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/portal";

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Link className="brand" href="/" style={{ marginBottom: 22 }}>
          <span className="logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/RJ_Logo_Black.png" alt="RJ logo" width={30} height={30} />
          </span>
          <span>
            <b>RJ</b>
            <small>Design &amp; Development</small>
          </span>
        </Link>

        <h1>Sign in to RJ Studio</h1>
        <p>Sign in to save services, submit an enquiry and track your projects.</p>

        {params.error && (
          <p className="auth-note" data-tone="error" role="alert">
            We could not complete that sign-in. Please try again.
          </p>
        )}

        <SignInForm next={next} />
      </div>
    </main>
  );
}
