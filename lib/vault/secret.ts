// Server-only pepper for hashing Project Vault access codes, OTPs and session
// tokens. Never exposed to the browser. Read lazily so tests can set it.
export function vaultSecret(): string {
  const s = (process.env.PROJECT_VAULT_SECRET || "").trim();
  if (s.length < 32) {
    throw new Error("PROJECT_VAULT_SECRET is not set (needs at least 32 characters)");
  }
  return s;
}

export function vaultSecretConfigured(): boolean {
  return (process.env.PROJECT_VAULT_SECRET || "").trim().length >= 32;
}
