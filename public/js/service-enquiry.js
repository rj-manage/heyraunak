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
   Enquiries POST to /api/enquiry (api/enquiry.js), which stores the
   row in Google Sheets and emails the administrator. Success is only
   shown when that endpoint confirms it saved the enquiry.

   If the endpoint replies that it is not configured (503), or fails,
   the visitor sees an error plus a "Send by email instead" fallback -
   never a false success.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- integration point ---------- */

  var ENQUIRY_ENDPOINT = "/api/enquiry";
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
    "restaurant_name", "healthcare_org", "software_name", "brand_name"
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
    adSpendTouched: {},
    sending: false,
    startedAt: 0,
    lastFocus: null
  };

  function answers(svcId) {
    if (!store.byService[svcId]) store.byService[svcId] = {};
    return store.byService[svcId];
  }

  /* ============================================================
     Searchable service picker (combobox)
     ------------------------------------------------------------
     One component drives both the global search above the cards and
     the dropdown inside each category card. It is a text input that
     filters the centralized catalog as the visitor types. The card
     controls and the global search both call the same open() above,
     so no enquiry form or payload is duplicated.
     ============================================================ */

  var comboSeq = 0;

  function normText(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
  }

  /* punctuation-free form, so "e-commerce" is reachable as "ecom" or
     "ecommerce" and "web site" meets "Website" */
  function collapse(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  /* every word of the query must appear in the haystack - partial,
     case-insensitive and order-independent */
  function matches(haystack, query) {
    var parts = String(query == null ? "" : query)
      .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ")
      .filter(Boolean);
    if (!parts.length) return true;
    var hay = collapse(haystack);
    for (var i = 0; i < parts.length; i++) {
      if (hay.indexOf(parts[i]) < 0) return false;
    }
    return true;
  }

  function rxEsc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* escape the service name, wrapping every matched word in <mark> */
  function highlight(text, query) {
    var str = String(text == null ? "" : text);
    var parts = normText(query).split(" ").filter(Boolean);
    if (!parts.length) return esc(str);
    var re = new RegExp("(" + parts.map(rxEsc).join("|") + ")", "ig");
    var out = "", last = 0, m;
    while ((m = re.exec(str))) {
      out += esc(str.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
      if (m[0] === "") re.lastIndex++;
    }
    return out + esc(str.slice(last));
  }

  /* the flat, per-category item shape both searches use */
  function serviceItems(cat) {
    return cat.services.map(function (svc, i) {
      return {
        catId: cat.id,
        catLabel: cat.label,
        svcId: svc.id,
        name: svc.name,
        group: svc.group || "",
        no: i + 1
      };
    });
  }

  function createCombo(cfg) {
    var uid = "enq-combo-" + (++comboSeq);
    var root = cfg.root;
    var items = cfg.items || [];
    var subLabel = cfg.subLabel || null;

    root.classList.add("enq-combo");
    root.innerHTML =
      '<div class="enq-combo-field">' +
        '<svg class="enq-combo-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/></svg>' +
        '<input class="enq-combo-input" id="' + uid + '-input" type="text" role="combobox" autocomplete="off" autocapitalize="off" spellcheck="false" aria-haspopup="listbox" aria-expanded="false" aria-autocomplete="list" aria-controls="' + uid + '-list" aria-label="' + esc(cfg.ariaLabel || "Search services") + '" placeholder="' + esc(cfg.placeholder || "") + '" />' +
        '<button class="enq-combo-clear" type="button" tabindex="-1" aria-label="Clear selection" hidden>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        "</button>" +
        '<button class="enq-combo-toggle" type="button" tabindex="-1" aria-label="Show options">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
        "</button>" +
      "</div>" +
      '<ul class="enq-combo-list" id="' + uid + '-list" role="listbox" aria-label="' + esc(cfg.ariaLabel || "Services") + '" hidden></ul>' +
      '<p class="enq-combo-status sr-only" role="status" aria-live="polite"></p>';

    var input = root.querySelector(".enq-combo-input");
    var list = root.querySelector(".enq-combo-list");
    var clearBtn = root.querySelector(".enq-combo-clear");
    var toggleBtn = root.querySelector(".enq-combo-toggle");
    var statusEl = root.querySelector(".enq-combo-status");

    var chosen = null;
    var isOpen = false;
    var dirty = false;
    var active = -1;
    var visible = [];

    function syncClear() {
      clearBtn.hidden = !(chosen || input.value);
    }

    function indexOfChosen() {
      if (!chosen) return -1;
      for (var i = 0; i < visible.length; i++) {
        if (visible[i].svcId === chosen.svcId) return i;
      }
      return -1;
    }

    function setActive(i) {
      active = i;
      var opts = list.querySelectorAll(".enq-combo-opt");
      for (var n = 0; n < opts.length; n++) opts[n].classList.toggle("is-active", n === i);
      if (i >= 0 && opts[i]) {
        input.setAttribute("aria-activedescendant", opts[i].id);
        if (opts[i].scrollIntoView) opts[i].scrollIntoView({ block: "nearest" });
      } else {
        input.removeAttribute("aria-activedescendant");
      }
    }

    function optHTML(item, i, query) {
      var sub = subLabel ? subLabel(item) : "";
      var isSel = chosen && item.svcId === chosen.svcId;
      return '<li class="enq-combo-opt" role="option" id="' + uid + "-opt-" + i +
        '" data-i="' + i + '" aria-selected="' + (isSel ? "true" : "false") + '">' +
        '<span class="enq-combo-name">' + highlight(item.name, query) + "</span>" +
        (sub ? '<span class="enq-combo-sub">' + esc(sub) + "</span>" : "") +
        "</li>";
    }

    function render(query) {
      visible = items.filter(function (it) {
        return matches(it.name + " " + (it.group || "") + " " + (it.catLabel || ""), query);
      });

      if (!visible.length) {
        list.innerHTML = '<li class="enq-combo-empty" role="presentation">' +
          (query
            ? "No services match \u201C" + esc(query) + "\u201D."
            : "No services available.") +
          "</li>";
        statusEl.textContent = "No services found.";
        setActive(-1);
        return;
      }

      list.innerHTML = visible.map(function (it, i) {
        return optHTML(it, i, query);
      }).join("");

      statusEl.textContent = visible.length +
        (visible.length === 1 ? " service found." : " services found.");
      setActive(indexOfChosen());
    }

    function openList() {
      if (isOpen) return;
      isOpen = true;
      root.classList.add("open");
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      render(dirty ? input.value : "");
    }

    function syncInput() {
      input.value = chosen ? chosen.name : "";
      syncClear();
    }

    function closeList(revert) {
      if (!isOpen) {
        if (revert !== false) syncInput();
        return;
      }
      isOpen = false;
      root.classList.remove("open");
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      if (revert !== false) syncInput();
    }

    function choose(item) {
      chosen = item;
      dirty = false;
      syncInput();
      closeList(false);
      if (cfg.onSelect) cfg.onSelect(item);
    }

    function clearSelection(fire) {
      chosen = null;
      dirty = false;
      input.value = "";
      syncClear();
      if (fire !== false && cfg.onClear) cfg.onClear();
    }

    function move(delta) {
      if (!visible.length) return;
      var n = active + delta;
      if (n < 0) n = visible.length - 1;
      if (n >= visible.length) n = 0;
      setActive(n);
    }

    input.addEventListener("input", function () {
      dirty = true;
      syncClear();
      openList();
      render(input.value);
    });

    input.addEventListener("focus", function () { openList(); });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) openList();
        move(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) openList();
        move(-1);
      } else if (e.key === "Enter") {
        if (isOpen && visible.length) {
          e.preventDefault();
          choose(visible[active >= 0 ? active : 0]);
        }
      } else if (e.key === "Escape") {
        if (isOpen) { e.preventDefault(); closeList(true); }
      } else if (e.key === "Home" && isOpen) {
        e.preventDefault();
        setActive(0);
      } else if (e.key === "End" && isOpen) {
        e.preventDefault();
        setActive(visible.length - 1);
      } else if (e.key === "Tab") {
        closeList(true);
      }
    });

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (isOpen) closeList(false);
      else { input.focus(); openList(); }
    });

    /* keep focus on the input so the option click lands before blur */
    clearBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
    clearBtn.addEventListener("click", function () {
      clearSelection(true);
      if (isOpen) render("");
    });

    list.addEventListener("mousedown", function (e) { e.preventDefault(); });
    list.addEventListener("click", function (e) {
      var opt = e.target.closest ? e.target.closest(".enq-combo-opt") : null;
      if (!opt) return;
      var i = Number(opt.getAttribute("data-i"));
      if (visible[i]) choose(visible[i]);
    });

    document.addEventListener("click", function (e) {
      if (isOpen && !root.contains(e.target)) closeList(true);
    });

    return {
      root: root,
      selection: function () { return chosen; },
      select: function (item) { if (item) choose(item); },
      clear: function () { clearSelection(false); syncInput(); },
      open: openList,
      close: closeList
    };
  }

  /* ============================================================
     Category controls - searchable dropdown + Let's Connect
     ============================================================ */

  var cards = {};

  function buildControls() {
    var hosts = document.querySelectorAll("[data-enq-category]");

    Array.prototype.forEach.call(hosts, function (host) {
      var cat = getCategory(host.getAttribute("data-enq-category"));
      if (!cat) return;
      var comboRoot = host.querySelector("[data-enq-combo]");
      var btn = host.querySelector("[data-enq-connect]");
      if (!comboRoot || !btn) return;

      var combo = createCombo({
        root: comboRoot,
        items: serviceItems(cat),
        placeholder: "Select a service\u2026",
        ariaLabel: "Choose a " + cat.label + " service",
        subLabel: function (it) { return it.group; },
        onSelect: function () {
          btn.disabled = false;
          comboRoot.classList.remove("picked");
          void comboRoot.offsetWidth;
          comboRoot.classList.add("picked");
        },
        onClear: function () { btn.disabled = true; }
      });

      btn.addEventListener("click", function () {
        var it = combo.selection();
        if (!it) return;
        store.lastFocus = btn;
        open(cat.id, it.svcId);
      });

      cards[cat.id] = { combo: combo, btn: btn };
    });
  }

  /* ============================================================
     Global service search - same catalog, same open()
     ============================================================ */

  var globalCombo = null;

  function catalogItems() {
    var out = [];
    var seen = {};
    CATEGORIES.forEach(function (cat) {
      serviceItems(cat).forEach(function (it) {
        var key = it.catId + "::" + it.svcId;
        if (seen[key]) return;
        seen[key] = true;
        out.push(it);
      });
    });
    return out;
  }

  function buildGlobalSearch() {
    var host = document.querySelector("[data-global-search]");
    if (!host) return;
    var comboRoot = host.querySelector("[data-enq-combo]");
    var btn = host.querySelector("[data-enq-connect]");
    if (!comboRoot || !btn) return;

    globalCombo = createCombo({
      root: comboRoot,
      items: catalogItems(),
      placeholder: "Search for a service\u2026",
      ariaLabel: "Search all RJ services",
      subLabel: function (it) { return it.catLabel; },
      onSelect: function (it) {
        btn.disabled = false;
        /* keep the matching category card in step with the global pick */
        if (cards[it.catId]) cards[it.catId].combo.select(it);
      },
      onClear: function () { btn.disabled = true; }
    });

    btn.addEventListener("click", function () {
      var it = globalCombo.selection();
      if (!it) return;
      store.lastFocus = btn;
      open(it.catId, it.svcId);
    });
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
    store.startedAt = Date.now();
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
      var label = (n < 10 ? "0" : "") + n;
      return '<li class="' + cls + '"><i>' + label + "</i><span>" + esc(s.title) + "</span></li>";
    }).join("");

    var kind = c.steps[store.step - 1].kind;
    bodyEl.innerHTML =
      kind === "budget" ? budgetStep() :
      kind === "contact" ? contactStep() :
      fieldsStep(c.steps[store.step - 1]);

    backBtn.hidden = store.step === 1;
    nextBtn.hidden = false;
    nextBtn.textContent = store.step === steps().length ? "Submit Enquiry" : "Continue";
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
    var html = (want === 1 && s.note) ? '<p class="f-note">' + esc(s.note) + "</p>" : "";

    if (list.length) {
      html += '<div class="f-grid">' + list.map(function (f) {
        return fieldHTML(f, s.id);
      }).join("") + "</div>";
    }

    /* categories that need a platform answer show it inside the
       requirements step rather than as a step of its own */
    html += platformBlock();

    return html || '<p class="f-empty">Nothing else needed here - continue to the next step.</p>';
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
    }).join("") + "</div>" +
      /* honeypot: hidden from people, filled by naive bots */
      '<div class="f-hp" aria-hidden="true">' +
      '<label for="f-hp">Leave this field empty</label>' +
      '<input type="text" id="f-hp" name="website" tabindex="-1" autocomplete="off" />' +
      "</div>";
  }

  function platformBlock() {
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

  function sliderBlock(id, label, hint, touched, value, aria) {
    var out = touched && typeof value === "number" ? money(value) : "Not specified";
    var pos = touched && typeof value === "number" ? sliderFor(value) : 0;
    return '<div class="f-field">' +
      '<span class="f-lbl">' + esc(label) + "</span>" +
      '<p class="f-hint">' + esc(hint) + "</p>" +
      '<div class="bg-wrap">' +
      '<output class="bg-out' + (touched ? "" : " idle") + '" id="' + id + '-out" for="' + id + '">' + esc(out) + "</output>" +
      '<input class="bg-range" type="range" id="' + id + '" min="0" max="' + SLIDER_MAX + '" step="1" value="' + pos + '"' +
      ' aria-label="' + esc(aria) + '" />' +
      '<div class="bg-ends"><span>' + money(10) + "</span><span>" + money(100000) + "</span></div>" +
      "</div></div>";
  }

  function budgetStep() {
    var svcId = store.serviceId;
    var s = svc();
    var a = answers(svcId);
    var paidAds = !!s.adSpend;

    var html = sliderBlock(
      "enq-budget",
      paidAds ? "RJ Service Fee Budget" : "Project Budget",
      paidAds
        ? "What you are allocating for RJ's work. This is separate from what you spend on the ad platform."
        : "Select the approximate budget you have allocated for this project.",
      !!store.budgetTouched[svcId], a.__budget,
      "Project budget in US dollars"
    );

    var tKey = svcId + ".__timeline";
    var timeline = a.__timeline || "";
    var opts = '<option value="">Select a timeline…</option>' + TIMELINES.map(function (t) {
      return '<option value="' + esc(t) + '"' + (timeline === t ? " selected" : "") + ">" + esc(t) + "</option>";
    }).join("");

    html += '<div class="f-field">' +
      '<label for="f-timeline">Expected Project Timeline</label>' +
      '<select class="f-input f-select" id="f-timeline" data-key="' + esc(tKey) + '" required aria-required="true">' + opts + "</select>" +
      '<p class="f-err" data-err="' + esc(tKey) + '" hidden></p></div>';

    /* paid advertising: a second, clearly separate platform spend */
    if (paidAds) {
      html += sliderBlock(
        "enq-adspend",
        "Advertising Spend Budget",
        "Optional - the monthly amount you plan to put into the ad platform itself.",
        !!store.adSpendTouched[svcId], a.__adspend,
        "Advertising spend budget in US dollars"
      );
    }

    return html;
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

    ["enq-budget", "enq-adspend"].forEach(function (id) {
      var range = el(id);
      if (range) range.addEventListener("input", function () { onSlider(id); });
    });
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

  function onSlider(id) {
    var range = el(id);
    if (!range) return;
    var svcId = store.serviceId;
    var dollars = budgetFromSlider(Number(range.value));

    if (id === "enq-adspend") {
      answers(svcId).__adspend = dollars;
      store.adSpendTouched[svcId] = true;
    } else {
      answers(svcId).__budget = dollars;
      store.budgetTouched[svcId] = true;
    }

    var out = el(id + "-out");
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
      advertising_spend_usd: typeof a.__adspend === "number" ? a.__adspend : null,
      timeline: a.__timeline || null,
      contact: contact,
      submitted_at: new Date().toISOString(),
      page: window.location.href
    };
  }

  /* ---------- idempotency key ----------
     One key per service, reused while a submission is unresolved, so a
     retry after a network error can never create a second sheet row. */

  var KEYS = {};

  function keyFor(svcId) {
    if (KEYS[svcId]) return KEYS[svcId];
    var k = null;
    try { k = window.sessionStorage.getItem("rj-enq-" + svcId); } catch (e) {}
    if (!k) {
      k = (window.crypto && window.crypto.randomUUID)
        ? window.crypto.randomUUID()
        : "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { window.sessionStorage.setItem("rj-enq-" + svcId, k); } catch (e) {}
    }
    KEYS[svcId] = k;
    return k;
  }

  function keyUsed(svcId) {
    delete KEYS[svcId];
    try { window.sessionStorage.removeItem("rj-enq-" + svcId); } catch (e) {}
  }

  function envelope() {
    var data = payload();
    var hp = el("f-hp");
    data.idempotency_key = keyFor(store.serviceId);
    data.form_started_at = store.startedAt || 0;
    data.hp = hp ? hp.value : "";
    return data;
  }

  function submit() {
    if (store.sending) return;
    if (!validate(store.step)) return;

    var data = envelope();
    store.sending = true;
    setBusy(true);

    fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (json) {
        return { ok: res.ok, status: res.status, json: json || {} };
      });
    }).then(function (r) {
      setBusy(false);
      store.sending = false;
      if (r.ok && r.json.ok) {
        keyUsed(store.serviceId);
        success({ id: r.json.id });
        return;
      }
      failed(r.json.message, r.status);
    }).catch(function () {
      setBusy(false);
      store.sending = false;
      failed(null, 0);
    });
  }

  function setBusy(on) {
    dialog.classList.toggle("busy", on);
    nextBtn.disabled = on;
    backBtn.disabled = on;
    closeBtn.disabled = on;
    nextBtn.textContent = on ? "Sending…" : (store.step === steps().length ? "Submit Enquiry" : "Continue");
  }

  function summaryText(d) {
    var lines = ["New project enquiry - RJ", "", "Category: " + d.category, "Service: " + d.service, ""];
    lines.push("- Project details -");
    Object.keys(d.project_details).forEach(function (k) {
      lines.push(k + ": " + d.project_details[k]);
    });
    if (d.platforms.length) {
      lines.push("", "- Platforms -");
      lines.push(d.platforms.join(", "));
    }
    lines.push("", "- Budget & timeline -");
    lines.push("Project Budget: " + (d.budget_usd == null ? "Not specified" : money(d.budget_usd) + " USD"));
    if (d.advertising_spend_usd != null) {
      lines.push("Advertising Spend Budget: " + money(d.advertising_spend_usd) + " USD");
    }
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

  function clearAlert() {
    var a = bodyEl.querySelector(".f-alert");
    if (a && a.parentNode) a.parentNode.removeChild(a);
  }

  function failed(msg, status) {
    clearAlert();

    var text = msg || "Something went wrong while sending your enquiry.";
    if (status === 503) {
      text = "Our enquiry form is not connected yet, so your message was not saved.";
    } else if (status === 429) {
      text = "Too many submissions from this connection. Please try again in a few minutes.";
    } else if (status === 0) {
      text = "We could not reach the server. Check your connection and try again.";
    }

    bodyEl.insertAdjacentHTML("afterbegin",
      '<div class="f-alert" role="alert">' +
      "<b>Your enquiry was not sent.</b> " + esc(text) +
      '<div class="f-alert-actions">' +
      '<button class="soft-btn sm" type="button" id="f-retry">Try again</button>' +
      '<button class="soft-btn ghost sm" type="button" id="f-email">Send by email instead</button>' +
      "</div></div>");

    var retry = el("f-retry");
    if (retry) retry.addEventListener("click", function () { clearAlert(); submit(); });

    var mail = el("f-email");
    if (mail) mail.addEventListener("click", function () { clearAlert(); handoff(payload()); });

    statusEl.textContent = "Your enquiry was not sent.";
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
        "<h3>Your enquiry has been received!</h3>" +
        "<p>Thank you for considering RJ Studio. We&rsquo;ve received your project details and will get back to you soon.</p>" +
        (opts.id ? '<p class="f-hint">Reference: <b>' + esc(opts.id) + "</b></p>" : "") +
        "</div>";
      statusEl.textContent = "Your enquiry has been received.";
      return;
    }

    bodyEl.innerHTML =
      '<div class="f-done">' +
      '<span class="f-done-ico">✉</span>' +
      "<h3>Your enquiry is ready</h3>" +
      "<p>So you don’t have to retype anything, we’ve prepared your enquiry for <b>" + esc(d.service) + "</b> and addressed it to <b>" + CONTACT_EMAIL + "</b>. Open it and press send.</p>" +
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
    buildGlobalSearch();
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
    cards: cards,
    catalog: catalogItems,
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
