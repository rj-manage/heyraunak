import { createHash, randomBytes } from "node:crypto";

// The session token is random and only its hash is stored. It is delivered as an
// HttpOnly cookie; nothing sensitive is ever placed in localStorage.
export const SESSION_COOKIE = "rj_vault_session";
export const SESSION_IDLE_MINUTES = 30;
export const SESSION_ABSOLUTE_HOURS = 2;

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update("session:" + token).digest("hex");
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: true;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

// Path is "/" so the cookie is sent to both /project-vault/* and the
// /api/project-vault/* endpoints that validate it on every request.
export function sessionCookieOptions(maxAgeSeconds: number): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds
  };
}

export function idleExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + SESSION_IDLE_MINUTES * 60 * 1000);
}

export function absoluteExpiryFrom(now: Date): Date {
  return new Date(now.getTime() + SESSION_ABSOLUTE_HOURS * 60 * 60 * 1000);
}
