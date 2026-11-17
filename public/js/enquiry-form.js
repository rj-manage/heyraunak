/* ============================================================
   RJ - dynamic service enquiry form
   ------------------------------------------------------------
   Fetches the field list for the chosen service from
   /api/enquiry/schema, renders it inside the service popup as a
   three-step wizard (contact -> requirements -> budget), validates
   each step and posts the submission to /api/enquiry. Opened by
   services.js via window.RJEnquiry.mount(name, host).
   ============================================================ */
(function () {
  "use strict";

  var modal = document.getElementById("svc-modal");
  var host = document.getElementById("svc-form-host");
  if (!modal || !host) return;

  var PHONE_RE = /^\+?[0-9][0-9 ()-]{6,19}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var URL_RE = /^https?:\/\/[^\s]+$/i;
  var NOT_SURE = "Not sure yet";
  var STEP_TITLES = { 1: "Your details", 2: "Requirements", 3: "Budget & timeline" };
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

  var current = null; // { name, fields, steps, step, idem, startedAt }

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

  function tiersOf(f) {
    return (f.options || []).filter(function (o) { return o !== NOT_SURE; });
  }

  function stepIndex(n) {
    for (var i = 0; i < current.steps.length; i++) {
      if (current.steps[i].step === n) return i;
    }
    return 0;
  }

  /* group the ordered field list into the wizard steps (empty steps dropped) */
  function groupSteps(fields) {
    var byStep = {};
    fields.forEach(function (f) {
      var s = f.step || 2;
      (byStep[s] = byStep[s] || []).push(f);
    });
    var order = Object.keys(byStep).map(Number).sort(function (a, b) { return a - b; });
    return order.map(function (s) {
      return { step: s, title: STEP_TITLES[s] || "Step " + s, fields: byStep[s] };
    });
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

      case "slider": {
        var tiers = tiersOf(f);
        var max = Math.max(0, tiers.length - 1);
        var ends =
          '<div class="enq-slider-ends"><span>' + esc(tiers[0] || "") + "</span><span>" +
          esc(tiers[tiers.length - 1] || "") + "</span></div>";
        var notSure = (f.options || []).indexOf(NOT_SURE) !== -1
          ? '<label class="enq-ns"><input type="checkbox" class="enq-notsure" /> <span>' + esc(NOT_SURE) + "</span></label>"
          : "";
        return (
          '<div class="enq-slider">' +
          '<input class="enq-range" id="' + id + '" type="range" min="0" max="' + max + '" step="1" value="0" aria-label="' +
          esc(f.label) + '" />' +
          ends +
          '<output class="enq-slider-out">Drag to choose</output>' +
          notSure +
          "</div>"
        );
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

      case "email":
        return '<input class="enq-input" id="' + id + '" type="email" inputmode="email"' + ph + req + " />";

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

  /* ---------- wizard chrome ---------- */

  function stepperItems(steps, activeStep) {
    return steps.map(function (s, i) {
      var state = s.step === activeStep ? " on" : (s.step < activeStep ? " done" : "");
      return (
        '<li class="enq-stepdot' + state + '"' + (s.step === activeStep ? ' aria-current="step"' : "") + ">" +
        "<i>" + (i + 1) + "</i><span>" + esc(s.title) + "</span></li>"
      );
    }).join("");
  }

  function showStep(n) {
    if (!current) return;
    var idx = stepIndex(n);
    var s = current.steps[idx];
    if (!s) return;
    current.step = s.step;

    Array.prototype.forEach.call(host.querySelectorAll(".enq-step"), function (el) {
      el.hidden = Number(el.getAttribute("data-step")) !== s.step;
    });

    var dots = host.querySelector(".enq-steps");
    if (dots) dots.innerHTML = stepperItems(current.steps, s.step);

    var back = host.querySelector(".enq-back");
    if (back) back.hidden = idx === 0;

    var next = host.querySelector(".enq-next");
    if (next) next.textContent = idx === current.steps.length - 1 ? "Submit Enquiry" : "Next";

    var card = host.closest ? host.closest(".svc-modal-card") : null;
    if (card) card.scrollTop = 0;

    syncSliders();
  }

  function gotoPrev() {
    var idx = stepIndex(current.step);
    if (idx > 0) {
      clearErrors();
      showStep(current.steps[idx - 1].step);
    }
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

  /* ---------- budget slider ---------- */

  function syncSlider(row, f) {
    var range = row.querySelector(".enq-range");
    var out = row.querySelector(".enq-slider-out");
    if (!range || !out) return;
    var box = row.querySelector(".enq-notsure");
    if (box && box.checked) {
      range.disabled = true;
      out.textContent = NOT_SURE;
      return;
    }
    range.disabled = false;
    var tiers = tiersOf(f);
    var idx = parseInt(range.value, 10);
    out.textContent = row.getAttribute("data-touched") ? tiers[idx] || "" : "Drag to choose";
  }

  function syncSliders() {
    current.fields.forEach(function (f) {
      if (f.type !== "slider") return;
      var row = rowEl(f.id);
      if (row) syncSlider(row, f);
    });
  }

  function onSliderChange(ev) {
    var t = ev.target;
    if (!t || !t.closest) return;
    var row = t.closest(".enq-row");
    if (!row || !row.querySelector(".enq-range")) return;
    if (t.classList.contains("enq-range")) {
      row.setAttribute("data-touched", "1");
      var box = row.querySelector(".enq-notsure");
      if (box) box.checked = false;
    }
    var id = row.getAttribute("data-row");
    var field = current.fields.filter(function (f) { return f.id === id; })[0];
    if (field) syncSlider(row, field);
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
    if (f.type === "slider") {
      var nsBox = row.querySelector(".enq-notsure");
      if (nsBox && nsBox.checked) return NOT_SURE;
      var range = row.querySelector(".enq-range");
      var tiers = tiersOf(f);
      var idx = range ? parseInt(range.value, 10) : 0;
      if (!Number.isFinite(idx) || idx < 0 || idx >= tiers.length) idx = 0;
      return tiers[idx] || "";
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

  function focusRow(row) {
    if (!row) return;
    row.scrollIntoView({ block: "center" });
    var input = row.querySelector(".enq-input, .enq-range, .enq-file");
    if (input && input.focus) input.focus();
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

  /* validates one group of fields; returns { ok, firstBad } (no clear/focus here) */
  function validateFields(fields) {
    var ok = true;
    var firstBad = null;

    fields.forEach(function (f) {
      if (f.type === "file") return;
      var row = rowEl(f.id);
      if (!row || row.hidden) return;
      var v = readField(f);
      var str = v == null ? "" : String(v).trim();

      // a slider always carries a value, so require an actual choice
      if (f.type === "slider" && f.required) {
        var nsBox = row.querySelector(".enq-notsure");
        var chosen = (nsBox && nsBox.checked) || row.getAttribute("data-touched");
        if (!chosen) {
          setError(f.id, "Please choose an estimated budget.");
          ok = false;
          if (!firstBad) firstBad = row;
          return;
        }
      }

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
      if (str && f.type === "email" && !EMAIL_RE.test(str)) {
        setError(f.id, "Enter a valid email address.");
        ok = false;
        if (!firstBad) firstBad = row;
      }
    });

    return { ok: ok, firstBad: firstBad };
  }

  function checkFiles() {
    var files = collectFiles();
    var msg = null;
    if (files.length > 5) msg = "You can attach up to 5 files.";
    else if (files.some(function (fi) { return fi.size > 10 * 1024 * 1024; })) msg = "Each file must be 10 MB or smaller.";
    else if (files.some(function (fi) { return !/\.(pdf|doc|docx|xls|xlsx)$/i.test(fi.name); })) {
      msg = "Only PDF, Word and Excel files are allowed.";
    }
    if (!msg) return { ok: true };

    var firstBad = null;
    var fileField = null;
    current.fields.forEach(function (f) {
      if (f.type !== "file") return;
      if (!fileField) fileField = f;
      setError(f.id, msg);
      if (!firstBad) firstBad = rowEl(f.id);
    });
    return { ok: false, firstBad: firstBad, step: fileField ? fileField.step || 3 : 3 };
  }

  function showAlert(message) {
    var form = host.querySelector(".enq-form");
    if (!form) return;
    var box = host.querySelector(".enq-alert");
    if (!box) {
      box = document.createElement("div");
      box.className = "enq-alert";
      box.setAttribute("role", "alert");
      form.insertBefore(box, form.firstChild);
    }
    box.textContent = message;
  }

  function success(ref) {
    host.innerHTML =
      '<div class="enq-done">' +
      '<span class="enq-done-ico">✓</span>' +
      "<h3>Your enquiry has been received</h3>" +
      "<p>Thank you - we&rsquo;ve got your requirements and will get back to you on WhatsApp soon.</p>" +
      (ref ? '<p class="enq-help">Reference: <b>' + esc(ref) + "</b></p>" : "") +
      "</div>";
  }

  function submit(ev) {
    ev.preventDefault();
    if (!current) return;

    var idx = stepIndex(current.step);
    var last = current.steps.length - 1;

    // mid-wizard: validate just this step, then advance
    if (idx < last) {
      clearErrors();
      var stepRes = validateFields(current.steps[idx].fields);
      if (!stepRes.ok) { focusRow(stepRes.firstBad); return; }
      showStep(current.steps[idx + 1].step);
      return;
    }

    // final step: validate every step + attachments, jump to the first problem
    clearErrors();
    var bad = null;
    var badStep = null;
    current.steps.forEach(function (s) {
      var res = validateFields(s.fields);
      if (!res.ok && !bad) { bad = res.firstBad; badStep = s.step; }
    });
    var fileRes = checkFiles();
    if (!fileRes.ok && !bad) { bad = fileRes.firstBad; badStep = fileRes.step; }
    if (bad) { showStep(badStep || current.step); focusRow(bad); return; }

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
          var errors = res.json.errors;
          Object.keys(errors).forEach(function (key) { setError(key, errors[key]); });
          // jump to the lowest step carrying an error
          var jump = null;
          current.steps.forEach(function (s) {
            if (jump !== null) return;
            var has = false;
            s.fields.forEach(function (f) { if (errors[f.id]) has = true; });
            if (has) jump = s.step;
          });
          if (jump !== null) showStep(jump);
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
    var back = host.querySelector(".enq-back");
    if (btn) {
      btn.disabled = on;
      var lastIdx = current ? current.steps.length - 1 : 0;
      btn.textContent = on ? "Sending…" : (stepIndex(current.step) === lastIdx ? "Submit Enquiry" : "Next");
    }
    if (back) back.disabled = on;
  }

  /* ---------- bootstrap ---------- */

  function render(name, fields) {
    current = { name: name, fields: fields, steps: groupSteps(fields), step: null, idem: uuid(), startedAt: Date.now() };

    var html = '<form class="enq-form" novalidate>';
    html += '<ol class="enq-steps" aria-label="Form progress"></ol>';
    html += current.steps.map(function (s, i) {
      return (
        '<div class="enq-step" data-step="' + s.step + '"' + (i === 0 ? "" : " hidden") + ">" +
        s.fields.map(fieldHTML).join("") +
        "</div>"
      );
    }).join("");
    html += '<div class="enq-hp" aria-hidden="true"><label for="enq-hp">Leave this field empty</label>' +
      '<input id="enq-hp" type="text" class="enq-hp-input" name="website" tabindex="-1" autocomplete="off" /></div>';
    html += '<div class="enq-actions">' +
      '<button class="soft-btn ghost enq-back" type="button" hidden>Back</button>' +
      '<button class="soft-btn enq-next enq-submit" type="submit">Next</button>' +
      '<button class="soft-btn ghost" type="button" data-svc-close>Cancel</button>' +
      "</div>";
    html += "</form>";

    host.innerHTML = html;
    var form = host.querySelector(".enq-form");
    form.addEventListener("submit", submit);
    form.addEventListener("click", function (ev) {
      var t = ev.target;
      if (t && t.closest && t.closest(".enq-back")) {
        ev.preventDefault();
        gotoPrev();
      }
    });
    form.addEventListener("input", applyConditionals);
    form.addEventListener("change", applyConditionals);
    form.addEventListener("input", onSliderChange);
    form.addEventListener("change", onSliderChange);
    applyConditionals();
    showStep(current.steps[0].step);

    var first = host.querySelector('.enq-step:not([hidden]) .enq-input');
    if (first && first.focus) first.focus();
  }

  function mount(name) {
    if (name !== current || !host.querySelector(".enq-form")) {
      // show a quick loading state while the schema is fetched
      host.innerHTML = '<p class="enq-help">Loading form…</p>';
      loadSchema(name)
        .then(function (fields) { render(name, fields); })
        .catch(function () {
          host.innerHTML = '<p class="enq-alert">Sorry - we could not load the form right now. Please use the contact page.</p>';
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
