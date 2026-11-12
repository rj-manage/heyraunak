// Supabase environment access with explicit failure.
// Values are never logged.

export function supabaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return url;
}

export function supabaseAnonKey(): string {
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return key;
}

export function supabaseServiceRoleKey(): string {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return key;
}

export function supabaseConfigured(): boolean {
  return !!(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim() &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()
  );
}
