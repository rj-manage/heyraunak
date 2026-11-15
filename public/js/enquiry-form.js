/* ============================================================
   RJ - dynamic service enquiry form
   ------------------------------------------------------------
   Fetches the field list for the chosen service from
   /api/enquiry/schema, renders it inside the service popup, validates
   it and posts the submission to /api/enquiry. Opened by services.js
   via window.RJEnquiry.mount(name, host).
   ============================================================ */
(function () {
  "use strict";

  var modal = document.getElementById("svc-modal");
  var host = document.getElementById("svc-form-host");
  if (!modal || !host) return;

  var CONTACT_IDS = ["full_name", "whatsapp", "company"];
  var PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;
  var URL_RE = /^https?:\/\/[^\s]+$/i;
  var SCHEMA_CACHE = {};

  var COUNTRY_CODES = [
    ["+91", "India +91"], ["+1", "USA / Canada +1"], ["+44", "UK +44"], ["+61", "Australia +61"],
    ["+971", "UAE +971"], ["+966", "Saudi Arabia +966"], ["+974", "Qatar +974"], ["+965", "Kuwait +965"],
    ["+968", "Oman +968"], ["+973", "Bahrain +973"], ["+65", "Singapore +65"], ["+60", "Malaysia +60"],
    ["+62", "Indonesia +62"], ["+63", "Philippines +63"], ["+66", "Thailand +66"], ["+84", "Vietnam +84"],
    ["+86", "China +86"], ["+81", "Japan +81"], ["+82", "South Korea +82"], ["+880", "Bangladesh +880"],
    ["+92", "Pakistan +92"], ["+94", "Sri Lanka +94"], ["+977", "Nepal +977"], ["+49", "Germany +49"],
    ["+33", "France +33"], ["+39", "Italy +39"], ["+34", "Spain +34"], ["+31", "Netherlands +31"],
    ["+41", "Switzerland +41"], ["+46", "Sweden +46"], ["+48", "Poland +48"], ["+90", "Turkey +90"],
    ["+7", "Russia +7"], ["+20", "Egypt +20"], ["+27", "South Africa +27"], ["+234", "Nigeria +234"],
    ["+254", "Kenya +254"], ["+55", "Brazil +55"], ["+52", "Mexico +52"], ["+54", "Argentina +54"],
    ["+64", "New Zealand +64"], ["+353", "Ireland +353"]
  ];

  var current = null; // { name, fields, idem, startedAt }

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
  }

  function rowEl(id) {
    return host.querySelector('[data-row="' + id + '"]');
  }

  function isWide(f) {
    return f.type === "textarea" || f.type === "multi" || f.type === "file";
  }

  /* ---------- field rendering ---------- */

  function controlHTML(f) {
    var id = "enq-" + f.id;
    var ph = f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "";
    var req = f.required ? ' required aria-required="true"' : "";

    switch (f.type) {
      case "textarea":
        return '<textarea class="enq-input" id="' + id + '" rows="3"' + ph + req + "></textarea>";

      case "select":
      case "budget": {
        var opts = '<option value="">Select…</option>';
        (f.options || []).forEach(function (o) {
          opts += '<option value="' + esc(o) + '">' + esc(o) + "</option>";
        });
        return '<select class="enq-input" id="' + id + '"' + req + ">" + opts + "</select>";
      }

      case "radio": {
        var radios = (f.options || []).map(function (o) {
          return '<label class="enq-radio"><input type="radio" name="f_' + f.id + '" value="' + esc(o) + '" />' +
            "<span>" + esc(o) + "</span></label>";
        }).join("");
        return '<div class="enq-radios">' + radios + "</div>";
      }

      case "multi": {
        var chips = (f.options || []).map(function (o) {
          return '<label class="enq-chip"><input type="checkbox" value="' + esc(o) + '" />' +
            "<span>" + esc(o) + "</span></label>";
        }).join("");
        return '<div class="enq-chips">' + chips + "</div>";
      }

      case "phone": {
        var cc = COUNTRY_CODES.map(function (c) {
          return '<option value="' + esc(c[0]) + '">' + esc(c[1]) + "</option>";
        }).join("");
        return '<div class="enq-phone"><select class="enq-input enq-cc" aria-label="Country code">' + cc +
          '</select><input class="enq-input" id="' + id + '" type="tel"' + ph + ' /></div>';
      }

      case "file":
        return '<input class="enq-file" id="' + id + '" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" />';

      case "number":
        return '<input class="enq-input" id="' + id + '" type="number" min="' + (f.min != null ? f.min : 0) + '"' + ph + req + " />";

      case "date":
        return '<input class="enq-input" id="' + id + '" type="date"' + req + " />";

      case "url":
        return '<input class="enq-input" id="' + id + '" type="url" inputmode="url"' + ph + req + " />";

      default:
        return '<input class="enq-input" id="' + id + '" type="text"' + ph + req + " />";
    }
  }

  function fieldHTML(f) {
    var show = "";
    if (f.showIf) {
      show = ' data-show-field="' + esc(f.showIf.field) + '" data-show-equals="' + esc(f.showIf.equals) + '"';
    }
    var mark = f.required ? ' <span class="enq-req">*</span>' : ' <span class="enq-opt">optional</span>';
    return (
      '<div class="enq-row' + (isWide(f) ? " wide" : "") + '" data-row="' + esc(f.id) + '"' + show + ">" +
      '<label class="enq-label" for="enq-' + esc(f.id) + '">' + esc(f.label) + mark + "</label>" +
      (f.help ? '<p class="enq-help">' + esc(f.help) + "</p>" : "") +
      controlHTML(f) +
      '<p class="enq-err" hidden></p>' +
      "</div>"
    );
  }

  /* ---------- conditional visibility ---------- */

  function rawValue(id) {
    var row = rowEl(id);
    if (!row) return "";
    var radio = row.querySelector('input[type="radio"]:checked');
    if (radio) return radio.value;
    var ctrl = row.querySelector(".enq-input");
    return ctrl ? ctrl.value : "";
  }

  function applyConditionals() {
    Array.prototype.forEach.call(host.querySelectorAll("[data-row]"), function (row) {
      var field = row.getAttribute("data-show-field");
      if (!field) return;
      var equals = row.getAttribute("data-show-equals") || "";
      var show = rawValue(field) === equals;
      row.hidden = !show;
      if (!show) {
        // drop answers of hidden fields so stale values are never submitted
        var ctrl = row.querySelector(".enq-input");
        if (ctrl) ctrl.value = "";
      }
    });
  }

  /* ---------- reading, validating, submitting ---------- */

  function readField(f) {
    var row = rowEl(f.id);
    if (!row || row.hidden) return undefined;
    if (f.type === "multi") {
      var checked = row.querySelectorAll('input[type="checkbox"]:checked');
      return Array.prototype.map.call(checked, function (i) { return i.value; });
    }
    if (f.type === "radio") {
      var r = row.querySelector('input[type="radio"]:checked');
      return r ? r.value : "";
    }
    if (f.type === "phone") {
      var cc = row.querySelector(".enq-cc");
      var num = row.querySelector('input[type="tel"]');
      var n = num ? num.value.trim() : "";
      return n ? ((cc ? cc.value : "") + " " + n).trim() : "";
    }
    if (f.type === "file") return undefined;
    var ctrl = row.querySelector(".enq-input");
    return ctrl ? ctrl.value.trim() : "";
  }

  function setError(id, message) {
    var row = rowEl(id);
    if (!row) return;
    var err = row.querySelector(".enq-err");
    if (err) {
      err.textContent = message || "";
      err.hidden = !message;
    }
    if (message) row.classList.add("invalid");
    else row.classList.remove("invalid");
  }

  function clearErrors() {
    Array.prototype.forEach.call(host.querySelectorAll("[data-row]"), function (row) {
      setError(row.getAttribute("data-row"), "");
    });
  }

  function collectFiles() {
    var out = [];
    current.fields.forEach(function (f) {
      if (f.type !== "file") return;
      var row = rowEl(f.id);
      if (!row) return;
      var input = row.querySelector(".enq-file");
      if (!input || !input.files) return;
      Array.prototype.forEach.call(input.files, function (file) { out.push(file); });
    });
    return out;
  }

  function validate() {
    clearErrors();
    var ok = true;
    var firstBad = null;
    var files = collectFiles();

    current.fields.forEach(function (f) {
      if (f.type === "file") return;
      var row = rowEl(f.id);
      if (!row || row.hidden) return;
      var v = readField(f);
      var str = v == null ? "" : String(v).trim();

      if (f.required && (str === "" || (Array.isArray(v) && !v.length))) {
        setError(f.id, "This field is required.");
        ok = false;
        if (!firstBad) firstBad = row;
        return;
      }
      if (str && f.type === "url" && !URL_RE.test(str)) {
        setError(f.id, "Enter a valid URL (starting with http).");
        ok = false;
        if (!firstBad) firstBad = row;
      }
      if (str && f.type === "phone" && !PHONE_RE.test(str)) {
        setError(f.id, "Enter a valid phone number with country code.");
        ok = false;
        if (!firstBad) firstBad = row;
      }
    });

    // client-side attachment checks
    var tooBig = files.some(function (fi) { return fi.size > 10 * 1024 * 1024; });
    var wrongType = files.some(function (fi) {
      return !/\.(pdf|doc|docx|xls|xlsx)$/i.test(fi.name);
    });
    if (files.length > 5) { alertFile("You can attach up to 5 files."); ok = false; }
    else if (tooBig) { alertFile("Each file must be 10 MB or smaller."); ok = false; }
    else if (wrongType) { alertFile("Only PDF, Word and Excel files are allowed."); ok = false; }

    if (firstBad) {
      firstBad.scrollIntoView({ block: "center" });
      var input = firstBad.querySelector(".enq-input");
      if (input) input.focus();
    }
    return ok;
  }

  function alertFile(message) {
    // attach the message to the file field itself
    current.fields.forEach(function (f) {
      if (f.type === "file") setError(f.id, message);
    });
  }

  function showAlert(message) {
    var box = host.querySelector(".enq-alert");
    if (!box) {
      box = document.createElement("div");
      box.className = "enq-alert";
      box.setAttribute("role", "alert");
      host.querySelector(".enq-form").insertBefore(box, host.querySelector(".enq-form").firstChild);
    }
    box.textContent = message;
  }

  function success(ref) {
    host.innerHTML =
      '<div class="enq-done">' +
      '<span class="enq-done-ico">✓</span>' +
      "<h3>Your enquiry has been received</h3>" +
      "<p>Thank you — we&rsquo;ve got your requirements and will get back to you on WhatsApp soon.</p>" +
      (ref ? '<p class="enq-help">Reference: <b>' + esc(ref) + "</b></p>" : "") +
      "</div>";
  }

  function submit(ev) {
    ev.preventDefault();
    if (!current || !validate()) return;

    var answers = {};
    current.fields.forEach(function (f) {
      if (f.type === "file") return;
      var v = readField(f);
      if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) return;
      answers[f.id] = v;
    });

    var hp = host.querySelector(".enq-hp-input");
    var fd = new FormData();
    fd.append("payload", JSON.stringify({
      service: current.name,
      idempotency_key: current.idem,
      started_at: current.startedAt,
      hp: hp ? hp.value : "",
      answers: answers
    }));
    collectFiles().forEach(function (file) { fd.append("files", file); });

    setBusy(true);
    fetch("/api/enquiry", { method: "POST", body: fd })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (json) {
          return { ok: res.ok, status: res.status, json: json || {} };
        });
      })
      .then(function (res) {
        setBusy(false);
        if (res.ok && res.json.ok) { success(res.json.ref); return; }
        if (res.json && res.json.errors) {
          clearErrors();
          Object.keys(res.json.errors).forEach(function (key) { setError(key, res.json.errors[key]); });
          showAlert(res.json.message || "Please check the highlighted fields.");
          return;
        }
        showAlert(res.json.message || "Something went wrong. Please try again.");
      })
      .catch(function () {
        setBusy(false);
        showAlert("We could not reach the server. Please check your connection and try again.");
      });
  }

  function setBusy(on) {
    var btn = host.querySelector(".enq-submit");
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? "Sending…" : "Submit Enquiry";
  }

  /* ---------- bootstrap ---------- */

  function render(name, fields) {
    current = { name: name, fields: fields, idem: uuid(), startedAt: Date.now() };

    var html = '<form class="enq-form" novalidate>';
    html += fields.map(fieldHTML).join("");
    html += '<div class="enq-hp" aria-hidden="true"><label for="enq-hp">Leave this field empty</label>' +
      '<input id="enq-hp" type="text" class="enq-hp-input" name="website" tabindex="-1" autocomplete="off" /></div>';
    html += '<div class="enq-actions"><button class="soft-btn enq-submit" type="submit">Submit Enquiry</button>' +
      '<button class="soft-btn ghost" type="button" data-svc-close>Cancel</button></div>';
    html += "</form>";

    host.innerHTML = html;
    var form = host.querySelector(".enq-form");
    form.addEventListener("submit", submit);
    form.addEventListener("input", applyConditionals);
    form.addEventListener("change", applyConditionals);
    applyConditionals();

    var first = host.querySelector(".enq-input");
    if (first && first.focus) first.focus();
  }

  function mount(name) {
    if (name !== current || !host.querySelector(".enq-form")) {
      // show a quick loading state while the schema is fetched
      host.innerHTML = '<p class="enq-help">Loading form…</p>';
      loadSchema(name)
        .then(function (fields) { render(name, fields); })
        .catch(function () {
          host.innerHTML = '<p class="enq-alert">Sorry — we could not load the form right now. Please use the contact page.</p>';
        });
    }
  }

  function loadSchema(name) {
    if (SCHEMA_CACHE[name]) return Promise.resolve(SCHEMA_CACHE[name]);
    return fetch("/api/enquiry/schema?service=" + encodeURIComponent(name), { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("schema_" + res.status);
        return res.json();
      })
      .then(function (data) {
        SCHEMA_CACHE[name] = data.fields || [];
        return SCHEMA_CACHE[name];
      });
  }

  window.RJEnquiry = { mount: mount };
})();
