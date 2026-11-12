/* ============================================================
   RJ Studio - enquiry endpoint
   POST /api/enquiry
   ------------------------------------------------------------
   Saves an enquiry to one Google Sheet, then emails the
   administrator. Runs on Vercel as a serverless function and uses
   only Node built-ins (no dependencies).

   Storage goes through a Google Apps Script web app (see
   apps-script/enquiry.gs), so no Google service-account key is
   needed. Email is sent with Resend.

   Configuration (Vercel -> Project -> Settings -> Environment
   Variables). Nothing here is ever exposed to the browser:

     GOOGLE_APPS_SCRIPT_URL    deployed web-app URL (ends in /exec)
     RJ_ENQUIRY_SHARED_SECRET  shared secret, also set in the Apps Script
     ADMIN_NOTIFICATION_EMAIL  where enquiries are emailed
     EMAIL_PROVIDER_API_KEY    Resend API key
     EMAIL_SENDER_ADDRESS      verified sender, e.g. "RJ Studio <enquiries@yourdomain.com>"
     CUSTOMER_ACK_ENABLED      "true" to also email the client
     ENQUIRY_ALLOWED_ORIGIN    optional, locks the endpoint to one origin

   If a required variable is missing the endpoint answers 503
   { error: "not_configured" } and never pretends to have saved
   anything.
   ============================================================ */

"use strict";

const crypto = require("crypto");

const RESEND_URL = "https://api.resend.com/emails";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_TEXT = 2000;
const MAX_SHORT = 200;
const MAX_DETAIL_KEYS = 40;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 6;
const MIN_FILL_MS = 2000;
const SHEET_TIMEOUT_MS = 15000;
const MIN_SECRET_LENGTH = 16;

const HEADERS = [
  "Enquiry ID",
  "Submission Date & Time",
  "Client Name",
  "Email Address",
  "Phone Number",
  "Country",
  "Service Category",
  "Selected Service",
  "Project Requirements",
  "Selected Platforms",
  "Project Budget (USD)",
  "Advertising Budget (USD)",
  "Expected Timeline",
  "Additional Message",
  "Enquiry Status",
  "Additional Details (JSON)"
];

/* ---------- small helpers ---------- */

function env(name) {
  return (process.env[name] || "").trim();
}

function config() {
  return {
    scriptUrl: env("GOOGLE_APPS_SCRIPT_URL"),
    secret: env("RJ_ENQUIRY_SHARED_SECRET"),
    adminEmail: env("ADMIN_NOTIFICATION_EMAIL"),
    emailKey: env("EMAIL_PROVIDER_API_KEY"),
    sender: env("EMAIL_SENDER_ADDRESS"),
    ack: env("CUSTOMER_ACK_ENABLED").toLowerCase() === "true",
    allowedOrigin: env("ENQUIRY_ALLOWED_ORIGIN")
  };
}

function sheetConfigured(cfg) {
  return /^https:\/\/script\.google\.com\//.test(cfg.scriptUrl) &&
    cfg.secret.length >= MIN_SECRET_LENGTH &&
    !!cfg.adminEmail && !!cfg.emailKey && !!cfg.sender;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* Strip control characters, collapse whitespace and cap the length. */
function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/* Spreadsheet formula injection: a cell starting with = + - @ tab or CR
   would be evaluated by Sheets, so prefix it with an apostrophe. */
function safeCell(value) {
  if (value == null) return "";
  if (typeof value === "number") return value;
  const s = String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function round(value, min, max) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n);
}

function enquiryId(idempotencyKey, now) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const digest = crypto
    .createHash("sha256")
    .update(String(idempotencyKey))
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return "RJ-" + day + "-" + digest;
}

function stamp(now) {
  const p = (n) => String(n).padStart(2, "0");
  return (
    now.getUTCFullYear() + "-" + p(now.getUTCMonth() + 1) + "-" + p(now.getUTCDate()) +
    " " + p(now.getUTCHours()) + ":" + p(now.getUTCMinutes()) + ":" + p(now.getUTCSeconds()) +
    " UTC"
  );
}

/* ---------- request handling ---------- */

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_MAX;
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("too_large");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw || "{}");
}

/* ---------- validation ---------- */

function validate(body) {
  const errors = {};
  const contact = body.contact && typeof body.contact === "object" ? body.contact : {};
  const project = body.project_details && typeof body.project_details === "object"
    ? body.project_details : {};

  const data = {
    category: clean(body.category, MAX_SHORT),
    service: clean(body.service, MAX_SHORT),
    serviceId: clean(body.service_id, MAX_SHORT),
    idempotencyKey: clean(body.idempotency_key, 80),
    fullName: clean(contact["Full Name"], MAX_SHORT),
    company: clean(contact["Business / Company Name"], MAX_SHORT),
    email: clean(contact["Email Address"], MAX_SHORT),
    phone: clean(contact["Phone / WhatsApp Number"], MAX_SHORT),
    country: clean(contact["Country"], MAX_SHORT),
    message: clean(contact["Additional Message"], MAX_TEXT),
    timeline: clean(body.timeline, MAX_SHORT),
    budget: round(body.budget_usd, 10, 100000),
    adSpend: round(body.advertising_spend_usd, 10, 100000),
    platforms: [],
    details: {}
  };

  if (!data.category) errors.category = "missing";
  if (!data.service) errors.service = "missing";
  if (!data.fullName) errors.full_name = "required";
  if (!data.email || !isValidEmail(data.email)) errors.email = "invalid";
  if (!data.phone) errors.phone = "required";
  if (!data.country) errors.country = "required";
  if (!data.timeline) errors.timeline = "required";

  if (Array.isArray(body.platforms)) {
    data.platforms = body.platforms
      .slice(0, 10)
      .map((p) => clean(p, 40))
      .filter(Boolean);
  }

  const keys = Object.keys(project).slice(0, MAX_DETAIL_KEYS);
  for (const key of keys) {
    const value = project[key];
    const flat = Array.isArray(value) ? value.map((v) => clean(v, 120)).join(", ") : clean(value, 1500);
    if (!flat) continue;
    data.details[clean(key, MAX_SHORT)] = flat;
  }

  return { data, errors };
}

/* ---------- Google Apps Script storage ----------
   The web app always answers HTTP 200 (ContentService cannot set a
   status), and may first redirect through script.googleusercontent.com,
   so the only trustworthy signal is a JSON body with success && saved.
   An HTML page - usually a Google sign-in screen - is a failure. */

async function saveToSheet(cfg, row, id) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS) : null;

  let res;
  try {
    res = await fetch(cfg.scriptUrl, {
      method: "POST",
      redirect: "follow",
      /* text/plain keeps the request body as a plain string and avoids
         any preflight; Apps Script reads it from e.postData.contents */
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        auth: cfg.secret,
        enquiryId: id,
        row: row
      }),
      signal: controller ? controller.signal : undefined
    });
  } catch (err) {
    throw new Error("apps_script_unreachable");
  } finally {
    if (timer) clearTimeout(timer);
  }

  const text = await res.text().catch(() => "");

  let payload = null;
  try {
    payload = JSON.parse(text);
  } catch (err) {
    /* redirect to a login page, an HTML error, or an empty body */
    throw new Error("apps_script_bad_response");
  }

  if (!payload || payload.success !== true || payload.saved !== true) {
    throw new Error("apps_script_rejected");
  }

  return {
    duplicate: payload.duplicate === true,
    enquiryId: payload.enquiryId || id
  };
}

function buildRow(data, id, at) {
  const requirements = Object.keys(data.details)
    .map((k) => k + ": " + data.details[k])
    .join("\n");

  return [
    safeCell(id),
    safeCell(at),
    safeCell(data.fullName),
    safeCell(data.email),
    safeCell(data.phone),
    safeCell(data.country),
    safeCell(data.category),
    safeCell(data.service),
    safeCell(requirements),
    safeCell(data.platforms.join(", ")),
    data.budget == null ? "" : data.budget,
    data.adSpend == null ? "" : data.adSpend,
    safeCell(data.timeline),
    safeCell(data.message),
    safeCell("New"),
    safeCell(JSON.stringify({ company: data.company, project_details: data.details }, null, 0))
  ];
}

/* ---------- email ---------- */

function money(n) {
  return n == null ? "Not specified" : "$" + Number(n).toLocaleString("en-US") + " USD";
}

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function row(label, value) {
  return '<tr><td style="padding:8px 16px 8px 0;color:#5b6675;font-size:13px;white-space:nowrap;vertical-align:top">' +
    esc(label) + '</td><td style="padding:8px 0;color:#2a3444;font-size:14px;font-weight:600">' +
    (value || "—") + "</td></tr>";
}

function adminHtml(d, id, at) {
  const details = Object.keys(d.details).map((k) => row(k, esc(d.details[k]))).join("");
  return '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#e3e9f0;padding:24px">' +
    '<div style="max-width:620px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 4px;color:#2a3444;font-size:22px">New project enquiry</h1>' +
    '<p style="margin:0 0 20px;color:#5b6675;font-size:13px">' + esc(id) + " · " + esc(at) + "</p>" +
    '<table style="width:100%;border-collapse:collapse">' +
    row("Client", esc(d.fullName)) +
    row("Email", esc(d.email)) +
    row("Phone", esc(d.phone)) +
    row("Country", esc(d.country)) +
    row("Category", esc(d.category)) +
    row("Service", esc(d.service)) +
    row("Platforms", esc(d.platforms.join(", "))) +
    row("Project budget", money(d.budget)) +
    (d.adSpend == null ? "" : row("Advertising budget", money(d.adSpend))) +
    row("Timeline", esc(d.timeline)) +
    "</table>" +
    (details
      ? '<h2 style="margin:24px 0 4px;color:#2a3444;font-size:15px">Project requirements</h2>' +
        '<table style="width:100%;border-collapse:collapse">' + details + "</table>"
      : "") +
    (d.message
      ? '<h2 style="margin:24px 0 4px;color:#2a3444;font-size:15px">Additional message</h2>' +
        '<p style="margin:0;color:#2a3444;font-size:14px;line-height:1.6">' + esc(d.message) + "</p>"
      : "") +
    "</div></div>";
}

function adminText(d, id, at) {
  const lines = [
    "New project enquiry - RJ Studio", "",
    "Enquiry ID: " + id,
    "Submitted: " + at,
    "Client: " + d.fullName,
    "Email: " + d.email,
    "Phone: " + d.phone,
    "Country: " + d.country,
    "Category: " + d.category,
    "Service: " + d.service,
    "Platforms: " + (d.platforms.join(", ") || "Not specified"),
    "Project budget: " + money(d.budget),
    "Advertising budget: " + money(d.adSpend),
    "Timeline: " + d.timeline,
    "", "Project requirements:"
  ];
  Object.keys(d.details).forEach((k) => lines.push("  " + k + ": " + d.details[k]));
  if (d.message) lines.push("", "Additional message:", "  " + d.message);
  return lines.join("\n");
}

async function sendEmail(cfg, payload) {
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + cfg.emailKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("email_" + res.status);
  return res.json().catch(() => ({}));
}

function ackHtml() {
  return '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#e3e9f0;padding:24px">' +
    '<div style="max-width:560px;margin:0 auto;background:#e3e9f0;border-radius:16px;padding:28px">' +
    '<p style="margin:0 0 6px;color:#156a47;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">RJ Studio</p>' +
    '<h1 style="margin:0 0 16px;color:#2a3444;font-size:22px">Thank you for reaching out</h1>' +
    '<p style="margin:0 0 12px;color:#2a3444;font-size:14px;line-height:1.6">' +
    "We've successfully received your project enquiry and appreciate your interest in working with us.</p>" +
    '<p style="margin:0 0 12px;color:#2a3444;font-size:14px;line-height:1.6">' +
    "Our team will review your requirements and get back to you.</p>" +
    '<p style="margin:20px 0 0;color:#5b6675;font-size:13px">Regards,<br />RJ Studio</p>' +
    "</div></div>";
}

/* ---------- handler ---------- */

module.exports = async function handler(req, res) {
  const cfg = config();

  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });

  if (cfg.allowedOrigin) {
    const origin = req.headers.origin;
    if (origin && origin !== cfg.allowedOrigin) return send(res, 403, { error: "forbidden" });
  }

  if (rateLimited(clientIp(req))) {
    return send(res, 429, { error: "rate_limited", message: "Too many submissions. Please try again later." });
  }

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return send(res, err.message === "too_large" ? 413 : 400, {
      error: err.message === "too_large" ? "too_large" : "bad_json"
    });
  }

  /* bot traps: a filled honeypot or a form completed impossibly fast */
  if (body.hp) return send(res, 400, { error: "rejected" });
  if (body.form_started_at && Date.now() - Number(body.form_started_at) < MIN_FILL_MS) {
    return send(res, 400, { error: "rejected" });
  }

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) {
    return send(res, 400, { error: "validation", fields: errors });
  }
  if (!data.idempotencyKey) {
    return send(res, 400, { error: "validation", fields: { idempotency_key: "required" } });
  }

  /* configuration check happens after validation so a misconfigured
     deployment still reports bad input honestly */
  if (!sheetConfigured(cfg)) {
    return send(res, 503, {
      error: "not_configured",
      message: "Enquiry storage is not configured yet."
    });
  }

  const now = new Date();
  const id = enquiryId(data.idempotencyKey, now);
  const at = stamp(now);

  /* the Apps Script side dedupes on the same ID, so a retry of the same
     submission can never create a second row */
  let save;
  try {
    save = await saveToSheet(cfg, buildRow(data, id, at), id);
  } catch (err) {
    console.error("enquiry: sheet save failed for " + id + " -", err && err.message);
    return send(res, 502, {
      error: "save_failed",
      message: "We could not save your enquiry, so nothing was sent."
    });
  }

  /* the row is saved - from here on failures are logged, never fatal,
     and never cause a second row */
  let emailState = "sent";
  try {
    await sendEmail(cfg, {
      from: cfg.sender,
      to: [cfg.adminEmail],
      subject: "New Project Enquiry Received - RJ Studio",
      html: adminHtml(data, id, at),
      text: adminText(data, id, at),
      reply_to: data.email
    });
  } catch (err) {
    emailState = "failed";
    console.error("enquiry: admin email failed for " + id + " -", err && err.message);
  }

  let ackState = "disabled";
  if (cfg.ack) {
    try {
      await sendEmail(cfg, {
        from: cfg.sender,
        to: [data.email],
        subject: "We Received Your Project Enquiry - RJ Studio",
        html: ackHtml(),
        text:
          "Thank you for reaching out to RJ Studio.\n\n" +
          "We've successfully received your project enquiry and appreciate your interest in working with us.\n\n" +
          "Our team will review your requirements and get back to you.\n\nRegards,\nRJ Studio"
      });
      ackState = "sent";
    } catch (err) {
      ackState = "failed";
      console.error("enquiry: client ack failed for " + id + " -", err && err.message);
    }
  }

  return send(res, 200, {
    ok: true,
    id: save.enquiryId || id,
    email: emailState,
    ack: ackState,
    duplicate: save.duplicate
  });
};

/* exposed for the local test harness */
module.exports.__test = {
  validate,
  buildRow,
  enquiryId,
  safeCell,
  clean,
  adminHtml,
  adminText,
  saveToSheet,
  sheetConfigured,
  HEADERS
};
