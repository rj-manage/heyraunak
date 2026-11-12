import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session cookie on every request and guards the app
// areas. Role checks still happen server-side in each route/loader; this only
// ensures an unauthenticated visitor is redirected to sign-in early.

const PROTECTED_PREFIXES = ["/portal", "/admin", "/workspace"];

export async function proxy(request: NextRequest) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  // Without Supabase configured, do not touch the request (keeps the static
  // site and local dev working before provisioning).
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (!user && PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/sign-in";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user && path === "/sign-in") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/portal";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/sign-in", "/auth/:path*", "/portal/:path*", "/admin/:path*", "/workspace/:path*"]
};
