/* ============================================================
   RJ - Services enquiry engine (shared by every service category)
   ------------------------------------------------------------
   This file holds no content. Categories register themselves via
   RJEnquiry.define({...}) - see enquiry-web.js and
   enquiry-software.js. The engine then builds the category's
   service dropdown, its multi-step modal, validation and payload.

   A category config:
     {
       id: "software",
       label: "Software & Product Development",
       dedupeOrg: true,                  // skip the contact company
                                         // field when the service
                                         // already collects one
       steps: [
         { title, kind: "fields", fieldStep: 1 },
         { title, kind: "platform" },
         { title, kind: "budget" },
         { title, kind: "contact" }
       ],
       platforms: {                      // optional
         heading, lead, options: [...], extras: [...], unsure
       },
       services: [
         { id, name, group?, note?, fields: [
             { k, l, t: text|textarea|number|url|email|tel|select|multi,
               req?, o?: [...], s?: 1|2, ph?, auto? }
         ] }
       ]
     }

   SUBMISSION
   ----------
   This site has no backend: no API, no form endpoint, no email
   service, no database, no CRM. The only contact channel it has
   ever used is mailto:theprofessionalrj@gmail.com.

   Set ENQUIRY_ENDPOINT to a URL and enquiries POST there as JSON;
   a success screen then appears only when the server answers OK.
   With no endpoint configured the enquiry is handed to the
   visitor's email app instead - never reported as "sent".
   ============================================================ */
(function () {
  "use strict";

  /* ---------- integration point (configure this) ---------- */

  var ENQUIRY_ENDPOINT = "";
  var CONTACT_EMAIL = "theprofessionalrj@gmail.com";
  var MAX_MAILTO = 1800;

  /* ---------- shared option sets ---------- */

  var TIMELINES = [
    "As Soon As Possible", "Within 2 Weeks", "Within 1 Month",
    "Within 2–3 Months", "Flexible / No Fixed Deadline"
  ];

  var CONTACT_FIELDS = [
    { k: "full_name", l: "Full Name", t: "text", req: true, auto: "name" },
    { k: "business_name", l: "Business / Company Name", t: "text", auto: "organization" },
    { k: "email", l: "Email Address", t: "email", req: true },
    { k: "phone", l: "Phone / WhatsApp Number", t: "tel", req: true },
    { k: "country", l: "Country", t: "text", req: true, auto: "country-name" },
    { k: "message", l: "Additional Message", t: "textarea", opt: true }
  ];

  /* service field keys that already capture the organisation's name */
  var ORG_KEYS = [
    "business_name", "company_name", "org_name", "organization_name",
    "institution_name", "agency_name", "marketplace_name",
    "restaurant_name", "healthcare_org", "software_name"
  ];

  /* ---------- registry ---------- */

  var CATEGORIES = [];
  var INDEX = {};

  function define(cfg) {
    if (!cfg || !cfg.id || indexOfCategory(cfg.id) > -1) return;
    CATEGORIES.push(cfg);
    (cfg.services || []).forEach(function (svc) {
      INDEX[svc.id] = { cat: cfg, svc: svc, no: -1 };
    });
    /* number services continuously within their category */
    cfg.services.forEach(function (svc, i) { INDEX[svc.id].no = i + 1; });
  }

  function indexOfCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return i;
    return -1;
  }

  function getCategory(id) {
    var i = indexOfCategory(id);
    return i < 0 ? null : CATEGORIES[i];
  }

  /* ---------- budget scale ($10 – $100,000, logarithmic) ---------- */

  var SLIDER_MAX = 1000;

  function budgetFromSlider(v) {
    var raw = 10 * Math.pow(10000, v / SLIDER_MAX);
    if (raw <= 100) return Math.max(10, Math.round(raw / 5) * 5);
    if (raw <= 1000) return Math.round(raw / 25) * 25;
    if (raw <= 10000) return Math.round(raw / 250) * 250;
    return Math.round(raw / 1000) * 1000;
  }

  function sliderFor(dollars) {
    var t = Math.log(dollars / 10) / Math.log(10000);
    return Math.max(0, Math.min(SLIDER_MAX, Math.round(t * SLIDER_MAX)));
  }

  function money(n) {
    return "$" + Number(n).toLocaleString("en-US");
  }

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(id) { return document.getElementById(id); }

  /* ---------- state ---------- */

  var store = {
    catId: null,
    serviceId: null,
    step: 1,
    byService: {},
    contact: {},
    budgetTouched: {},
    sending: false,
    lastFocus: null
  };

  function answers(svcId) {
    if (!store.byService[svcId]) store.byService[svcId] = {};
    return store.byService[svcId];
  }

  /* ============================================================
     Category controls - dropdown + Let's Connect
     ============================================================ */

  function buildControls() {
    var hosts = document.querySelectorAll("[data-enq-category]");

    Array.prototype.forEach.call(hosts, function (host) {
      var cat = getCategory(host.getAttribute("data-enq-category"));
      var select = host.querySelector("select");
      var btn = host.querySelector("button");
      if (!cat || !select || !btn) return;

      select.innerHTML = optionsHTML(cat);

      function sync() {
        btn.disabled = !select.value;
      }

      select.addEventListener("change", function () {
        sync();
        select.classList.remove("picked");
        void select.offsetWidth;
        select.classList.add("picked");
      });

      btn.addEventListener("click", function () {
        if (!select.value) return;
        store.lastFocus = btn;
        open(cat.id, select.value);
      });

      sync();
    });
  }

  function optionsHTML(cat) {
    var html = '<option value="" selected>Select a service…</option>';
    var openGroup = null;

    cat.services.forEach(function (svc) {
      if (svc.group && svc.group !== openGroup) {
        if (openGroup !== null) html += "</optgroup>";
        html += '<optgroup label="' + esc(svc.group) + '">';
        openGroup = svc.group;
      } else if (!svc.group && openGroup !== null) {
        html += "</optgroup>";
        openGroup = null;
      }
      html += '<option value="' + esc(svc.id) + '">' + esc(svc.name) + "</option>";
    });

    if (openGroup !== null) html += "</optgroup>";
    return html;
  }

  /* ============================================================
     Modal
     ============================================================ */

  var modal, dialog, catEl, titleEl, stepsEl, bodyEl, backBtn, nextBtn, statusEl, closeBtn;

  function cacheModal() {
    modal = el("enq-modal");
    dialog = el("enq-dialog");
    catEl = el("enq-cat");
    titleEl = el("enq-title");
    stepsEl = el("enq-steps");
    bodyEl = el("enq-body");
    backBtn = el("enq-back");
    nextBtn = el("enq-next");
    statusEl = el("enq-status");
    closeBtn = el("enq-close");
    if (!modal || !dialog) return false;

    modal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
    });
    closeBtn.addEventListener("click", close);
    backBtn.addEventListener("click", function () { go(store.step - 1); });
    nextBtn.addEventListener("click", onNext);
    document.addEventListener("keydown", onKeydown);
    return true;
  }

  function onKeydown(e) {
    if (!modal || modal.hidden) return;
    if (e.key === "Escape") {
      if (store.sending) return;
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function focusables() {
    var sel = 'a[href], button:not([disabled]), select, textarea, input, [tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(dialog.querySelectorAll(sel), function (n) {
      return n.offsetParent !== null;
    });
  }

  var opened = false;

  function open(catId, svcId) {
    var hit = INDEX[svcId];
    if (!hit || hit.cat.id !== catId || !modal) return;

    store.catId = catId;
    store.serviceId = svcId;

    if (!opened) {
      modal.hidden = false;
      document.documentElement.classList.add("enq-locked");
      opened = true;
      requestAnimationFrame(function () { modal.classList.add("in"); });
    }

    catEl.textContent = hit.cat.label;
    titleEl.textContent = hit.svc.name;
    store.step = 1;
    store.sending = false;
    paint();
    var firstField = dialog.querySelector("select, input, textarea");
    if (firstField) firstField.focus();
  }

  function close() {
    if (!modal || modal.hidden || store.sending) return;
    modal.classList.remove("in");
    modal.hidden = true;
    document.documentElement.classList.remove("enq-locked");
    opened = false;
    statusEl.textContent = "";
    if (store.lastFocus && document.contains(store.lastFocus)) store.lastFocus.focus();
  }

  function cat() { return getCategory(store.catId); }
  function svc() { return INDEX[store.serviceId].svc; }
  function steps() { return cat().steps; }

  function onNext() {
    if (store.sending) return;
    if (store.step < steps().length) {
      if (!validate(store.step)) return;
      go(store.step + 1);
    } else {
      submit();
    }
  }

  function go(step) {
    if (step < 1 || step > steps().length) return;
    store.step = step;
    statusEl.textContent = "";
    paint();
    bodyEl.scrollTop = 0;
    var firstField = bodyEl.querySelector("select, input, textarea");
    if (firstField && step > 1) firstField.focus();
  }

  /* ============================================================
     Rendering
     ============================================================ */

  function paint() {
    var c = cat();
    if (!c) return;

    stepsEl.innerHTML = c.steps.map(function (s, i) {
      var n = i + 1;
      var cls = n === store.step ? "on" : (n < store.step ? "done" : "");
      return '<li class="' + cls + '"><i>' + n + "</i><span>" + esc(s.title) + "</span></li>";
    }).join("");

    var kind = c.steps[store.step - 1].kind;
    bodyEl.innerHTML =
      kind === "budget" ? budgetStep() :
      kind === "contact" ? contactStep() :
      kind === "platform" ? platformStep() :
      fieldsStep(c.steps[store.step - 1]);

    backBtn.hidden = store.step === 1;
    nextBtn.hidden = false;
    nextBtn.textContent = store.step === steps().length ? "Send enquiry" : "Continue";
    bindFields();
  }

  function fieldHTML(f, owner) {
    var v = owner === "__contact" ? store.contact[f.k] : answers(owner)[f.k];
    var id = "f-" + owner + "-" + f.k;
    var name = owner + "." + f.k;
    var req = f.req ? ' required aria-required="true"' : "";
    var lbl = '<label for="' + id + '">' + esc(f.l) +
      (f.req ? "" : ' <span class="opt">(optional)</span>') + "</label>";
    var val = v == null ? "" : v;
    var err = '<p class="f-err" data-err="' + esc(name) + '" hidden></p>';

    if (f.t === "textarea") {
      return '<div class="f-field wide">' + lbl +
        '<textarea class="f-input" id="' + id + '" data-key="' + esc(name) + '" rows="3"' + req +
        ' placeholder="' + esc(f.ph || "") + '">' + esc(val) + "</textarea>" + err + "</div>";
    }

    if (f.t === "select") {
      var opts = '<option value="">Select…</option>';
      for (var i = 0; i < f.o.length; i++) {
        var o = f.o[i];
        opts += '<option value="' + esc(o) + '"' + (val === o ? " selected" : "") + ">" + esc(o) + "</option>";
      }
      return '<div class="f-field">' + lbl +
        '<select class="f-input f-select" id="' + id + '" data-key="' + esc(name) + '"' + req + ">" + opts + "</select>" +
        err + "</div>";
    }

    if (f.t === "multi") {
      var chosen = Array.isArray(val) ? val : [];
      var chips = f.o.map(function (o) {
        var on = chosen.indexOf(o) > -1;
        return '<label class="f-chip' + (on ? " on" : "") + '"><input type="checkbox" value="' + esc(o) +
          '" data-key="' + esc(name) + '"' + (on ? " checked" : "") + " /><span>" + esc(o) + "</span></label>";
      }).join("");
      return '<div class="f-field wide"><span class="f-lbl">' + esc(f.l) +
        ' <span class="opt">(select any)</span></span><div class="f-chips">' + chips + "</div></div>";
    }

    var type = f.t === "number" ? "number" : f.t === "email" ? "email" : f.t === "tel" ? "tel" : f.t === "url" ? "url" : "text";
    var auto = f.auto ? ' autocomplete="' + f.auto + '"' : "";
    return '<div class="f-field">' + lbl +
      '<input class="f-input" type="' + type + '" id="' + id + '" data-key="' + esc(name) + '"' + req + auto +
      ' value="' + esc(val) + '" placeholder="' + esc(f.ph || "") + '" />' + err + "</div>";
  }

  function fieldsStep(stepCfg) {
    var s = svc();
    var want = stepCfg.fieldStep || 1;
    var list = s.fields.filter(function (f) { return (f.s || 1) === want; });
    var note = (want === 1 && s.note) ? '<p class="f-note">' + esc(s.note) + "</p>" : "";

    if (!list.length) {
      return note + '<p class="f-empty">Nothing else needed here - continue to the next step.</p>';
    }
    return note + '<div class="f-grid">' + list.map(function (f) {
      return fieldHTML(f, s.id);
    }).join("") + "</div>";
  }

  function contactStep() {
    var c = cat();
    var s = svc();
    var list = CONTACT_FIELDS.slice();

    /* never ask for the organisation twice */
    if (c.dedupeOrg) {
      var already = s.fields.some(function (f) { return ORG_KEYS.indexOf(f.k) > -1; });
      if (already) {
        list = list.filter(function (f) { return f.k !== "business_name"; });
      }
    }
    return '<div class="f-grid">' + list.map(function (f) {
      return fieldHTML(f, "__contact");
    }).join("") + "</div>";
  }

  function platformStep() {
    var c = cat();
    var p = c.platforms;
    if (!p) return "";
    var chosen = answers(store.serviceId).__platforms || [];

    function chips(list) {
      return list.map(function (o) {
        var on = chosen.indexOf(o) > -1;
        return '<label class="f-chip' + (on ? " on" : "") + '"><input type="checkbox" value="' + esc(o) +
          '" data-plat="1"' + (on ? " checked" : "") + " /><span>" + esc(o) + "</span></label>";
      }).join("");
    }

    var html = '<div class="f-field wide">' +
      '<span class="f-lbl">' + esc(p.heading) + "</span>" +
      '<p class="f-hint">' + esc(p.lead) + "</p>" +
      '<div class="f-chips">' + chips(p.options) + "</div>";

    if (p.extras && p.extras.length) {
      html += '<p class="f-hint f-hint-gap">Also available</p>' +
        '<div class="f-chips">' + chips(p.extras) + "</div>";
    }

    if (p.unsure) {
      html += '<div class="f-chips f-chips-unsure">' + chips([p.unsure]) + "</div>";
    }

    return html + "</div>";
  }

  function budgetStep() {
    var svcId = store.serviceId;
    var touched = !!store.budgetTouched[svcId];
    var val = answers(svcId).__budget;
    var out = touched && typeof val === "number" ? money(val) : "Not specified";
    var sliderPos = touched && typeof val === "number" ? sliderFor(val) : 0;
    var timeline = answers(svcId).__timeline || "";
    var tKey = svcId + ".__timeline";

    var opts = '<option value="">Select a timeline…</option>' + TIMELINES.map(function (t) {
      return '<option value="' + esc(t) + '"' + (timeline === t ? " selected" : "") + ">" + esc(t) + "</option>";
    }).join("");

    return '<div class="f-field">' +
      '<span class="f-lbl">Estimated Project Budget</span>' +
      '<p class="f-hint">Select the approximate budget you have allocated for this project.</p>' +
      '<div class="bg-wrap">' +
      '<output class="bg-out' + (touched ? "" : " idle") + '" id="enq-budget-out" for="enq-budget">' + esc(out) + "</output>" +
      '<input class="bg-range" type="range" id="enq-budget" min="0" max="' + SLIDER_MAX + '" step="1" value="' + sliderPos + '"' +
      ' aria-label="Estimated project budget in US dollars" />' +
      '<div class="bg-ends"><span>' + money(10) + "</span><span>" + money(100000) + "</span></div>" +
      "</div></div>" +
      '<div class="f-field">' +
      '<label for="f-timeline">Expected Project Timeline</label>' +
      '<select class="f-input f-select" id="f-timeline" data-key="' + esc(tKey) + '" required aria-required="true">' + opts + "</select>" +
      '<p class="f-err" data-err="' + esc(tKey) + '" hidden></p></div>';
  }

  /* ============================================================
     Field binding
     ============================================================ */

  function bindFields() {
    Array.prototype.forEach.call(bodyEl.querySelectorAll("[data-key]"), function (node) {
      var evt = node.type === "checkbox" ? "change" : "input";
      node.addEventListener(evt, function () { write(node); });
      if (node.tagName === "SELECT") node.addEventListener("change", function () { write(node); });
    });

    Array.prototype.forEach.call(bodyEl.querySelectorAll("[data-plat]"), function (box) {
      box.addEventListener("change", function () { writePlatform(box); });
    });

    var range = el("enq-budget");
    if (range) range.addEventListener("input", function () { onBudget(range); });
  }

  function splitKey(name) {
    var i = name.indexOf(".");
    return { owner: name.slice(0, i), key: name.slice(i + 1) };
  }

  function write(node) {
    var ref = splitKey(node.getAttribute("data-key"));
    var owner = ref.owner, key = ref.key;

    if (node.type === "checkbox") {
      var arr = answers(owner)[key];
      if (!Array.isArray(arr)) arr = [];
      var i = arr.indexOf(node.value);
      if (node.checked && i < 0) arr.push(node.value);
      if (!node.checked && i > -1) arr.splice(i, 1);
      answers(owner)[key] = arr;
      var chip = node.closest(".f-chip");
      if (chip) chip.classList.toggle("on", node.checked);
      return;
    }

    if (owner === "__contact") store.contact[key] = node.value;
    else answers(owner)[key] = node.value;
    clearError(node.getAttribute("data-key"));
  }

  function writePlatform(box) {
    var a = answers(store.serviceId);
    var unsure = cat().platforms && cat().platforms.unsure;
    var list = Array.isArray(a.__platforms) ? a.__platforms.slice() : [];
    var v = box.value;

    if (box.checked) {
      if (unsure && v === unsure) {
        list = [unsure];
      } else {
        list = list.filter(function (x) { return x !== unsure; });
        if (list.indexOf(v) < 0) list.push(v);
      }
    } else {
      list = list.filter(function (x) { return x !== v; });
    }

    a.__platforms = list;

    Array.prototype.forEach.call(bodyEl.querySelectorAll("[data-plat]"), function (b) {
      var on = list.indexOf(b.value) > -1;
      b.checked = on;
      var chip = b.closest(".f-chip");
      if (chip) chip.classList.toggle("on", on);
    });
  }

  function onBudget(range) {
    var svcId = store.serviceId;
    var dollars = budgetFromSlider(Number(range.value));
    answers(svcId).__budget = dollars;
    store.budgetTouched[svcId] = true;
    var out = el("enq-budget-out");
    if (out) {
      out.textContent = money(dollars);
      out.classList.remove("idle");
    }
  }

  /* ============================================================
     Validation
     ============================================================ */

  function clearError(name) {
    var e = bodyEl.querySelector('[data-err="' + name + '"]');
    if (e) { e.hidden = true; e.textContent = ""; }
    var f = bodyEl.querySelector('[data-key="' + name + '"]');
    if (f) f.classList.remove("invalid");
  }

  function setError(name, msg) {
    var e = bodyEl.querySelector('[data-err="' + name + '"]');
    if (e) { e.hidden = false; e.textContent = msg; }
    var f = bodyEl.querySelector('[data-key="' + name + '"]');
    if (f) f.classList.add("invalid");
  }

  function validate(step) {
    var c = cat();
    var s = svc();
    var kind = c.steps[step - 1].kind;
    var firstBad = null;

    if (kind === "budget") {
      var tKey = s.id + ".__timeline";
      clearError(tKey);
      if (!answers(s.id).__timeline) {
        setError(tKey, "Please choose an expected timeline.");
        firstBad = bodyEl.querySelector("#f-timeline");
      }
      if (firstBad) { firstBad.focus(); return false; }
      return true;
    }

    if (kind === "platform") return true;   /* platforms are always optional */

    var list = kind === "contact" ? CONTACT_FIELDS.slice() : s.fields.filter(function (f) {
      return (f.s || 1) === (c.steps[step - 1].fieldStep || 1);
    });
    var owner = kind === "contact" ? "__contact" : s.id;

    if (kind === "contact" && c.dedupeOrg) {
      var already = s.fields.some(function (f) { return ORG_KEYS.indexOf(f.k) > -1; });
      if (already) list = list.filter(function (f) { return f.k !== "business_name"; });
    }

    list.forEach(function (f) {
      var name = owner + "." + f.k;
      var v = owner === "__contact" ? store.contact[f.k] : answers(owner)[f.k];
      var str = v == null ? "" : String(v).trim();
      clearError(name);

      if (f.req && !str) {
        setError(name, "This field is required.");
        if (!firstBad) firstBad = bodyEl.querySelector('[data-key="' + name + '"]');
        return;
      }
      if (f.t === "email" && str && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str)) {
        setError(name, "Please enter a valid email address.");
        if (!firstBad) firstBad = bodyEl.querySelector('[data-key="' + name + '"]');
      }
    });

    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ============================================================
     Payload + submission
     ============================================================ */

  function payload() {
    var c = cat();
    var s = svc();
    var a = answers(s.id);

    var project = {};
    s.fields.forEach(function (f) {
      var v = a[f.k];
      if (v == null || v === "" || (Array.isArray(v) && !v.length)) return;
      project[f.l] = v;
    });

    var contact = {};
    CONTACT_FIELDS.forEach(function (f) {
      var v = store.contact[f.k];
      if (v == null || v === "") return;
      contact[f.l] = v;
    });

    return {
      category: c.label,
      service: s.name,
      service_id: s.id,
      project_details: project,
      platforms: Array.isArray(a.__platforms) ? a.__platforms.slice() : [],
      budget_usd: typeof a.__budget === "number" ? a.__budget : null,
      timeline: a.__timeline || null,
      contact: contact,
      submitted_at: new Date().toISOString(),
      page: window.location.href
    };
  }

  function submit() {
    if (!validate(store.step)) return;
    var data = payload();
    store.sending = true;
    setBusy(true);

    if (!ENQUIRY_ENDPOINT) {
      handoff(data);
      return;
    }

    fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("Server responded " + res.status);
      return res.json().catch(function () { return {}; });
    }).then(function () {
      setBusy(false);
      store.sending = false;
      success();
    }).catch(function (err) {
      setBusy(false);
      store.sending = false;
      failed(err && err.message ? err.message : "The request could not be completed.");
    });
  }

  function setBusy(on) {
    dialog.classList.toggle("busy", on);
    nextBtn.disabled = on;
    backBtn.disabled = on;
    closeBtn.disabled = on;
    nextBtn.textContent = on ? "Sending…" : (store.step === steps().length ? "Send enquiry" : "Continue");
  }

  function summaryText(d) {
    var lines = ["New project enquiry - RJ", "", "Category: " + d.category, "Service: " + d.service, ""];
    lines.push("- Project details -");
    Object.keys(d.project_details).forEach(function (k) {
      lines.push(k + ": " + d.project_details[k]);
    });
    lines.push("", "- Platforms -");
    lines.push(d.platforms.length ? d.platforms.join(", ") : "Not specified");
    lines.push("", "- Budget & timeline -");
    lines.push("Estimated Project Budget: " + (d.budget_usd == null ? "Not specified" : money(d.budget_usd) + " USD"));
    lines.push("Expected Project Timeline: " + (d.timeline || "Not specified"));
    lines.push("", "- Contact -");
    Object.keys(d.contact).forEach(function (k) { lines.push(k + ": " + d.contact[k]); });
    lines.push("", "Submitted: " + d.submitted_at);
    return lines.join("\n");
  }

  function handoff(d) {
    var body = summaryText(d);
    var truncated = body.length > MAX_MAILTO;
    if (truncated) body = body.slice(0, MAX_MAILTO) + "\n\n[Truncated - full details available on request]";

    var href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Project enquiry - " + d.service) +
      "&body=" + encodeURIComponent(body);

    setBusy(false);
    store.sending = false;
    success({ handedOff: true, truncated: truncated, mailto: href });
  }

  function failed(msg) {
    bodyEl.insertAdjacentHTML("afterbegin",
      '<div class="f-alert" role="alert">Couldn’t send your enquiry - ' + esc(msg) +
      ". Please try again, or email <a href=\"mailto:" + CONTACT_EMAIL + "\">" + CONTACT_EMAIL + "</a>.</div>");
  }

  function success(opts) {
    opts = opts || {};
    var d = payload();
    var sent = !opts.handedOff;

    stepsEl.innerHTML = "";
    backBtn.hidden = true;
    nextBtn.hidden = true;

    if (sent) {
      bodyEl.innerHTML =
        '<div class="f-done">' +
        '<span class="f-done-ico">✓</span>' +
        "<h3>Enquiry sent</h3>" +
        "<p>Thanks - your enquiry for <b>" + esc(d.service) + "</b> has reached us. We usually reply within one to two business days.</p>" +
        '<p class="f-hint">Reference: ' + esc(d.submitted_at) + "</p>" +
        "</div>";
      statusEl.textContent = "Enquiry sent successfully.";
      return;
    }

    bodyEl.innerHTML =
      '<div class="f-done">' +
      '<span class="f-done-ico">✉</span>' +
      "<h3>Your enquiry is ready</h3>" +
      "<p>Online submission isn’t connected on this site yet, so we’ll hand your enquiry to your email app - it’s already filled in and addressed to <b>" + CONTACT_EMAIL + "</b>. Just press send.</p>" +
      (opts.truncated ? '<p class="f-hint">The summary was shortened to fit an email link - reply and we’ll ask for anything missing.</p>' : "") +
      '<div class="f-done-actions">' +
      '<a class="soft-btn" href="' + esc(opts.mailto) + '">Open in email app</a>' +
      '<button class="soft-btn ghost" type="button" id="f-copy">Copy enquiry</button>' +
      "</div>" +
      '<p class="f-hint">Prefer to write yourself? Email <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + "</a>.</p>" +
      "</div>";

    var copy = el("f-copy");
    if (copy) copy.addEventListener("click", function () {
      var text = summaryText(payload());
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copy.textContent = "Copied ✓";
        }, function () { copy.textContent = "Copy failed"; });
      } else {
        copy.textContent = "Copy unavailable";
      }
    });

    statusEl.textContent = "Enquiry prepared. Open it in your email app to send.";
  }

  /* ============================================================
     Boot
     ============================================================ */

  function boot() {
    if (!cacheModal()) return;
    buildControls();
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else setTimeout(fn, 0);
  }
  ready(boot);

  /* public API - categories register themselves against this */
  window.RJEnquiry = {
    define: define,
    categories: CATEGORIES,
    index: INDEX,
    open: open,
    close: close,
    payload: payload,
    money: money,
    budgetFromSlider: budgetFromSlider,
    sliderFor: sliderFor,
    store: store,
    endpoint: ENQUIRY_ENDPOINT
  };
})();
