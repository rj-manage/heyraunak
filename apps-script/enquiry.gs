/**
 * RJ Studio - enquiry web app
 * ============================================================
 * Receives enquiries from the Vercel backend (api/enquiry.js) and
 * appends each one to the "Enquiries" tab of the RJ Studio
 * spreadsheet.
 *
 * SETUP (5 minutes)
 * ------------------------------------------------------------
 * 1. Open the spreadsheet "RJ Studio - Client Enquiries".
 * 2. Extensions -> Apps Script.
 * 3. Replace everything in Code.gs with this file.
 * 4. Put the spreadsheet ID in SPREADSHEET_ID below (the long id
 *    in the sheet URL, between /d/ and /edit).
 * 5. Project Settings (gear icon) -> Script Properties -> Add:
 *       RJ_ENQUIRY_SHARED_SECRET = <the same secret you put in Vercel>
 * 6. Save, then Deploy -> New deployment -> Web app.
 *       Execute as:      Me
 *       Who has access:  Anyone
 * 7. Authorise the permissions Google asks for.
 * 8. Copy the Web app URL (ends in /exec) and give it to the agent.
 *
 * SECURITY
 * ------------------------------------------------------------
 * - No secret is stored in this file. The shared secret lives in
 *   Script Properties and is compared on every request.
 * - Apps Script cannot read custom request headers, so the secret
 *   travels in the POST body as `auth`.
 * - Nothing is ever returned to the browser directly; only the
 *   Vercel backend calls this endpoint.
 *
 * RESPONSE
 * ------------------------------------------------------------
 * ContentService always answers HTTP 200, so success is signalled
 * in the JSON body. The backend treats anything without
 * { success: true, saved: true } as a failure.
 */

/* ---------- configuration ---------- */

var SPREADSHEET_ID = "PASTE_YOUR_SPREADSHEET_ID_HERE";
var SHEET_NAME = "Enquiries";

var SECRET_PROPERTY = "RJ_ENQUIRY_SHARED_SECRET";
var MIN_SECRET_LENGTH = 16;

var MAX_BODY_CHARS = 64 * 1024;
var LOCK_WAIT_MS = 20000;
var COLUMNS = 16;

var HEADERS = [
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

var ID_PATTERN = /^RJ-\d{8}-[0-9A-Z]{8}$/;

/* ---------- entry points ---------- */

function doPost(e) {
  try {
    if (!e || !e.postData || typeof e.postData.contents !== "string") {
      return json({ success: false, error: "Empty request" });
    }
    if (e.postData.contents.length > MAX_BODY_CHARS) {
      return json({ success: false, error: "Request too large" });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return json({ success: false, error: "Invalid JSON" });
    }

    if (!isAuthorised(body && body.auth)) {
      return json({ success: false, error: "Unauthorised" });
    }

    var enquiryId = String((body && body.enquiryId) || "").trim();
    if (!ID_PATTERN.test(enquiryId)) {
      return json({ success: false, error: "Invalid enquiry ID" });
    }

    var row = body.row;
    if (!Array.isArray(row) || row.length !== COLUMNS) {
      return json({ success: false, error: "Invalid row" });
    }
    if (!String(row[2] || "").trim() || !String(row[3] || "").trim()) {
      return json({ success: false, error: "Missing required fields" });
    }

    var sheet = getSheet();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_WAIT_MS)) {
      return json({ success: false, error: "Busy, please retry" });
    }

    try {
      if (existingRow(sheet, enquiryId) > 0) {
        return json({
          success: true,
          saved: true,
          duplicate: true,
          enquiryId: enquiryId
        });
      }

      var values = row.map(safeCell);
      values[0] = enquiryId;                 /* authoritative id   */
      values[14] = values[14] || "New";      /* default status     */

      sheet.appendRow(values);
      SpreadsheetApp.flush();

      return json({
        success: true,
        saved: true,
        duplicate: false,
        enquiryId: enquiryId
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error("enquiry failed: " + (error && error.message));
    return json({ success: false, error: "Unable to save enquiry" });
  }
}

/* A GET is never a submission - this keeps browsers from seeing HTML. */
function doGet() {
  return json({ success: false, error: "POST only" });
}

/* Run this once from the editor to confirm setup. */
function selfTest() {
  var sheet = getSheet();
  var secret = PropertiesService.getScriptProperties().getProperty(SECRET_PROPERTY);
  var report = {
    spreadsheet: SPREADSHEET_ID ? "set" : "MISSING",
    sheet: sheet.getName(),
    columns: sheet.getLastColumn(),
    secretConfigured: !!(secret && secret.length >= MIN_SECRET_LENGTH),
    rows: Math.max(0, sheet.getLastRow() - 1)
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

/* ---------- helpers ---------- */

function isAuthorised(given) {
  var expected = PropertiesService.getScriptProperties().getProperty(SECRET_PROPERTY);
  if (!expected || expected.length < MIN_SECRET_LENGTH) return false;
  if (typeof given !== "string" || given.length !== expected.length) return false;

  /* length-independent comparison */
  var diff = 0;
  for (var i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  }
  return diff === 0;
}

/* Treat every value as plain text so a leading = + - @ cannot run. */
function safeCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  var text = String(value);
  if (text.charAt(0) === "'") return text;   /* already escaped upstream */
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function spreadsheetId() {
  var override = PropertiesService.getScriptProperties().getProperty("RJ_SPREADSHEET_ID");
  return (override || SPREADSHEET_ID || "").trim();
}

function sheetName() {
  var override = PropertiesService.getScriptProperties().getProperty("RJ_SHEET_NAME");
  return (override || SHEET_NAME || "Enquiries").trim();
}

function getSheet() {
  var id = spreadsheetId();
  if (!id || id.indexOf("PASTE_") === 0) {
    throw new Error("SPREADSHEET_ID is not configured");
  }

  var book = SpreadsheetApp.openById(id);
  var sheet = book.getSheetByName(sheetName());

  if (!sheet) {
    sheet = book.insertSheet(sheetName());
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* 1-based row number of an existing enquiry id, or 0. */
function existingRow(sheet, enquiryId) {
  var last = sheet.getLastRow();
  if (last < 2) return 0;

  var ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === enquiryId) return i + 2;
  }
  return 0;
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
