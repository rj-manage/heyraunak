/* ============================================================
   RJ — Services · Category 01 enquiry system
   ------------------------------------------------------------
   One data structure drives everything: the 15 service
   definitions, their own field sets, and the four-step enquiry
   wizard. Adding a service or a field means editing SERVICES
   below and nothing else.

   SUBMISSION
   ----------
   This site has no backend: no API, no form endpoint, no email
   service, no database, no CRM. The only contact channel it has
   ever used is mailto:theprofessionalrj@gmail.com.

   So delivery is wired in two layers:

     1. ENQUIRY_ENDPOINT — if you set it to a URL, the enquiry is
        POSTed there as JSON and a success screen is shown only
        when the server answers OK. Nothing is ever reported as
        sent unless the backend actually confirms it.
     2. With no endpoint configured, the enquiry is handed to the
        visitor's email app, prefilled and addressed to
        CONTACT_EMAIL — the channel the site already uses.

   Set ENQUIRY_ENDPOINT to go live with a real endpoint.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- integration point (configure this) ---------- */

  var ENQUIRY_ENDPOINT = "";
  var CONTACT_EMAIL = "theprofessionalrj@gmail.com";
  var CATEGORY = "Web Design & Development";
  var MAX_MAILTO = 1800;

  /* ---------- shared option sets ---------- */

  var FEATURES = [
    "Contact Forms", "WhatsApp Integration", "Appointment Booking",
    "Customer Dashboard", "Blog", "Testimonials", "Gallery", "Live Chat",
    "Payment Integration", "Multi-language Support", "SEO Setup"
  ];
  var PLATFORMS = ["Shopify", "WooCommerce", "Custom Development", "Other / Not Sure"];
  var CMS_OPTIONS = ["WordPress", "Webflow", "Shopify", "Headless CMS", "Custom CMS", "Other / Not Sure"];

  var TIMELINES = [
    "As Soon As Possible", "Within 2 Weeks", "Within 1 Month",
    "Within 2–3 Months", "Flexible / No Fixed Deadline"
  ];

  var STEPS = [
    "Project Details",
    "Features & Requirements",
    "Budget & Timeline",
    "Contact Information"
  ];

  /* ---------- the 15 services ----------
     k key · l label · t type · req required · o options · s step (2 = Features) */

  var SERVICES = [
    {
      id: "business-corporate",
      name: "Business & Corporate Website",
      fields: [
        { k: "business_name", l: "Company / Business Name", t: "text", req: true },
        { k: "industry", l: "Industry / Business Type", t: "text" },
        { k: "purpose", l: "Website Purpose", t: "text" },
        { k: "pages", l: "Number of Pages Required", t: "text" },
        { k: "features", l: "Required Features", t: "multi", o: FEATURES, s: 2 },
        { k: "style", l: "Preferred Design Style", t: "text", s: 2 },
        { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "ecommerce",
      name: "E-commerce Website",
      fields: [
        { k: "brand_name", l: "Store / Brand Name", t: "text", req: true },
        { k: "category", l: "Product Category", t: "text" },
        { k: "product_count", l: "Approximate Number of Products", t: "text" },
        { k: "platform", l: "Preferred Platform", t: "select", o: PLATFORMS },
        { k: "gateways", l: "Required Payment Gateways", t: "text", s: 2 },
        { k: "shipping", l: "Shipping & Delivery Requirements", t: "textarea", s: 2 },
        { k: "inventory", l: "Inventory Management Requirements", t: "textarea", s: 2 },
        { k: "accounts", l: "Customer Account Requirements", t: "textarea", s: 2 },
        { k: "integrations", l: "Additional Integrations", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "portfolio",
      name: "Portfolio & Personal Website",
      fields: [
        { k: "name", l: "Name / Personal Brand", t: "text", req: true },
        { k: "profession", l: "Profession / Industry", t: "text" },
        { k: "purpose", l: "Website Purpose", t: "text" },
        { k: "project_count", l: "Number of Projects to Showcase", t: "text" },
        { k: "sections", l: "Required Sections", t: "textarea", s: 2 },
        { k: "gallery", l: "Portfolio Gallery Requirements", t: "textarea", s: 2 },
        { k: "resume", l: "Resume / CV Integration", t: "text", s: 2 },
        { k: "contact_form", l: "Contact Form Requirements", t: "text", s: 2 },
        { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "landing-page",
      name: "Landing Page Development",
      fields: [
        { k: "brand_name", l: "Brand / Business Name", t: "text", req: true },
        { k: "campaign", l: "Campaign Purpose", t: "text" },
        { k: "audience", l: "Target Audience", t: "text" },
        { k: "promoting", l: "Product / Service Being Promoted", t: "text" },
        { k: "cta", l: "Primary Call-to-Action", t: "text", s: 2 },
        { k: "sections", l: "Required Sections", t: "textarea", s: 2 },
        { k: "lead_capture", l: "Lead Capture Requirements", t: "textarea", s: 2 },
        { k: "ad_platform", l: "Advertising Platform", t: "text", s: 2 },
        { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "startup-saas",
      name: "Startup & SaaS Website",
      fields: [
        { k: "product_name", l: "Startup / Product Name", t: "text", req: true },
        { k: "industry", l: "Industry", t: "text" },
        { k: "product_desc", l: "Product Description", t: "textarea" },
        { k: "audience", l: "Target Audience", t: "text" },
        { k: "website_type", l: "Website Type", t: "text" },
        { k: "pages", l: "Required Pages", t: "textarea", s: 2 },
        { k: "pricing", l: "Pricing Page Requirements", t: "textarea", s: 2 },
        { k: "auth", l: "User Authentication Requirements", t: "textarea", s: 2 },
        { k: "dashboard", l: "Dashboard Requirements", t: "textarea", s: 2 },
        { k: "integrations", l: "Third-Party Integrations", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "agency-studio",
      name: "Agency & Studio Website",
      fields: [
        { k: "agency_name", l: "Agency / Studio Name", t: "text", req: true },
        { k: "niche", l: "Industry / Creative Niche", t: "text" },
        { k: "services", l: "Services to Showcase", t: "textarea" },
        { k: "portfolio", l: "Portfolio Requirements", t: "textarea", s: 2 },
        { k: "team", l: "Team Section Requirements", t: "textarea", s: 2 },
        { k: "clients", l: "Client Showcase Requirements", t: "textarea", s: 2 },
        { k: "leads", l: "Contact / Lead Generation Features", t: "textarea", s: 2 },
        { k: "blog", l: "Blog Requirements", t: "textarea", s: 2 },
        { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "educational",
      name: "Educational Website",
      fields: [
        { k: "org_name", l: "Institution / Organization Name", t: "text", req: true },
        { k: "education_type", l: "Education Type", t: "text" },
        { k: "course_count", l: "Number of Courses", t: "text" },
        { k: "registration", l: "Student Registration Requirements", t: "textarea", s: 2 },
        { k: "lms", l: "LMS Requirements", t: "textarea", s: 2 },
        { k: "classes", l: "Online Classes Requirements", t: "textarea", s: 2 },
        { k: "payment", l: "Payment Integration", t: "text", s: 2 },
        { k: "student_dashboard", l: "Student Dashboard", t: "text", s: 2 },
        { k: "certificates", l: "Certificate Generation", t: "text", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "real-estate",
      name: "Real Estate Website",
      fields: [
        { k: "agency_name", l: "Company / Agency Name", t: "text", req: true },
        { k: "property_type", l: "Property Type", t: "text" },
        { k: "listing_count", l: "Approximate Number of Listings", t: "text" },
        { k: "listings", l: "Property Listing Requirements", t: "textarea", s: 2 },
        { k: "search", l: "Property Search & Filters", t: "textarea", s: 2 },
        { k: "maps", l: "Location / Map Integration", t: "text", s: 2 },
        { k: "enquiry_forms", l: "Property Enquiry Forms", t: "text", s: 2 },
        { k: "agents", l: "Agent / Broker Profiles", t: "text", s: 2 },
        { k: "crm", l: "CRM Integration", t: "text", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "restaurant",
      name: "Restaurant & Hospitality Website",
      fields: [
        { k: "business_name", l: "Restaurant / Business Name", t: "text", req: true },
        { k: "business_type", l: "Business Type", t: "text" },
        { k: "menu", l: "Menu Management", t: "text", s: 2 },
        { k: "ordering", l: "Online Ordering Requirements", t: "textarea", s: 2 },
        { k: "reservations", l: "Table Reservation Requirements", t: "textarea", s: 2 },
        { k: "delivery", l: "Delivery Integration", t: "text", s: 2 },
        { k: "gallery", l: "Gallery Requirements", t: "textarea", s: 2 },
        { k: "maps", l: "Location & Map Integration", t: "text", s: 2 },
        { k: "whatsapp", l: "Contact / WhatsApp Integration", t: "text", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "booking",
      name: "Booking & Appointment Website",
      fields: [
        { k: "business_name", l: "Business Name", t: "text", req: true },
        { k: "booking_type", l: "Booking Type", t: "text" },
        { k: "categories", l: "Appointment Categories", t: "text" },
        { k: "staff_count", l: "Number of Staff / Providers", t: "text" },
        { k: "calendar", l: "Calendar Integration", t: "text", s: 2 },
        { k: "availability", l: "Availability Management", t: "textarea", s: 2 },
        { k: "payments", l: "Online Payment Requirements", t: "textarea", s: 2 },
        { k: "notifications", l: "Automated Notifications", t: "text", s: 2 },
        { k: "accounts", l: "Customer Accounts", t: "text", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "cms",
      name: "CMS-Based Website",
      fields: [
        { k: "business_name", l: "Business Name", t: "text", req: true },
        { k: "website_type", l: "Website Type", t: "text" },
        { k: "cms", l: "Preferred CMS", t: "select", o: CMS_OPTIONS },
        { k: "content_types", l: "Number of Content Types", t: "text" },
        { k: "content_mgmt", l: "Content Management Requirements", t: "textarea", s: 2 },
        { k: "admin_roles", l: "Admin Roles", t: "textarea", s: 2 },
        { k: "media", l: "Media Management Requirements", t: "textarea", s: 2 },
        { k: "publishing", l: "Blog / Publishing Requirements", t: "textarea", s: 2 },
        { k: "integrations", l: "Third-Party Integrations", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "custom-app",
      name: "Custom Web Application",
      fields: [
        { k: "app_name", l: "Application Name", t: "text", req: true },
        { k: "industry", l: "Business / Industry", t: "text" },
        { k: "app_purpose", l: "Application Purpose", t: "textarea" },
        { k: "problem", l: "Problem the Application Will Solve", t: "textarea" },
        { k: "target_users", l: "Target Users", t: "text" },
        { k: "roles", l: "User Roles & Permissions", t: "textarea", s: 2 },
        { k: "modules", l: "Required Modules", t: "textarea", s: 2 },
        { k: "database", l: "Database Requirements", t: "textarea", s: 2 },
        { k: "integrations", l: "API / Third-Party Integrations", t: "textarea", s: 2 },
        { k: "admin_dashboard", l: "Admin Dashboard Requirements", t: "textarea", s: 2 },
        { k: "security", l: "Security Requirements", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "redesign",
      name: "Website Redesign",
      fields: [
        { k: "website_url", l: "Existing Website URL", t: "url", req: true },
        { k: "business_name", l: "Business Name", t: "text", req: true },
        { k: "platform", l: "Current Website Platform", t: "text" },
        { k: "improve", l: "What Needs Improvement", t: "textarea" },
        { k: "style", l: "Desired Design Style", t: "text" },
        { k: "new_features", l: "Required New Features", t: "textarea", s: 2 },
        { k: "migration", l: "Content Migration Requirements", t: "textarea", s: 2 },
        { k: "seo", l: "SEO Preservation Requirements", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "ui-ux",
      name: "Website UI/UX Design",
      fields: [
        { k: "brand_name", l: "Brand / Product Name", t: "text", req: true },
        { k: "design_type", l: "Design Type", t: "text" },
        { k: "app_type", l: "Website / Application Type", t: "text" },
        { k: "screen_count", l: "Number of Pages / Screens", t: "text" },
        { k: "audience", l: "Target Audience", t: "text" },
        { k: "style", l: "Preferred Design Style", t: "text" },
        { k: "wireframes", l: "Wireframe Requirements", t: "textarea", s: 2 },
        { k: "prototype", l: "Interactive Prototype Requirements", t: "textarea", s: 2 },
        { k: "design_system", l: "Design System Requirements", t: "textarea", s: 2 },
        { k: "reference_designs", l: "Reference Designs", t: "textarea", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    },
    {
      id: "maintenance",
      name: "Website Maintenance & Optimization",
      fields: [
        { k: "website_url", l: "Existing Website URL", t: "url", req: true },
        { k: "platform", l: "Website Platform", t: "text" },
        { k: "hosting", l: "Current Hosting Provider", t: "text" },
        { k: "maintenance_services", l: "Required Maintenance Services", t: "textarea", s: 2 },
        { k: "issues", l: "Current Website Issues", t: "textarea", s: 2 },
        { k: "performance", l: "Performance Optimization Requirements", t: "textarea", s: 2 },
        { k: "security_backup", l: "Security & Backup Requirements", t: "textarea", s: 2 },
        { k: "frequency", l: "Frequency of Maintenance", t: "text", s: 2 },
        { k: "description", l: "Project Description", t: "textarea", s: 2 }
      ]
    }
  ];

  var CONTACT_FIELDS = [
    { k: "full_name", l: "Full Name", t: "text", req: true, auto: "name" },
    { k: "business_name", l: "Business / Company Name", t: "text", auto: "organization" },
    { k: "email", l: "Email Address", t: "email", req: true },
    { k: "phone", l: "Phone / WhatsApp Number", t: "tel", req: true },
    { k: "country", l: "Country", t: "text", req: true, auto: "country-name" },
    { k: "message", l: "Additional Message", t: "textarea", opt: true }
  ];

  /* ---------- budget scale ($10 – $100,000, logarithmic) ---------- */

  var SLIDER_MAX = 1000;

  function budgetFromSlider(v) {
    var raw = 10 * Math.pow(10000, v / SLIDER_MAX);
    if (raw <= 100) return Math.max(10, Math.round(raw / 5) * 5);
    if (raw <= 1000) return Math.round(raw / 25) * 25;
    if (raw <= 10000) return Math.round(raw / 250) * 250;
    return Math.round(raw / 1000) * 1000;
  }

  function money(n) {
    return "$" + n.toLocaleString("en-US");
  }

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(id) { return document.getElementById(id); }

  function svcById(id) {
    for (var i = 0; i < SERVICES.length; i++) if (SERVICES[i].id === id) return SERVICES[i];
    return null;
  }

  /* ---------- state ---------- */

  var store = {
    byService: {},     /* serviceId -> { fieldKey: value } */
    contact: {},       /* shared across services */
    budgetTouched: {}, /* serviceId -> true once the slider is moved */
    serviceId: null,
    step: 1,
    sending: false,
    lastFocus: null
  };

  function answers(svcId) {
    if (!store.byService[svcId]) store.byService[svcId] = {};
    return store.byService[svcId];
  }

  /* ============================================================
     Category controls — select + Let's Connect
     ============================================================ */

  function buildControls() {
    var select = el("enq-service");
    var btn = el("enq-connect");
    if (!select || !btn) return;

    var html = '<option value="" selected>Select a service…</option>';
    for (var i = 0; i < SERVICES.length; i++) {
      html += '<option value="' + SERVICES[i].id + '">' +
        String(i + 1 < 10 ? "0" : "") + (i + 1) + " · " + esc(SERVICES[i].name) + "</option>";
    }
    select.innerHTML = html;

    function sync() {
      var on = !!select.value;
      btn.disabled = !on;
      store.serviceId = select.value || null;
    }
    select.addEventListener("change", function () {
      sync();
      /* a small confirmation that the choice registered */
      select.classList.remove("picked");
      void select.offsetWidth;
      select.classList.add("picked");
    });
    sync();

    btn.addEventListener("click", function () {
      if (!select.value) return;
      store.lastFocus = btn;
      open(select.value);
    });
  }

  /* ============================================================
     Modal
     ============================================================ */

  var modal, dialog, titleEl, stepsEl, bodyEl, footEl, backBtn, nextBtn, statusEl, closeBtn;

  function cacheModal() {
    modal = el("enq-modal");
    dialog = el("enq-dialog");
    titleEl = el("enq-title");
    stepsEl = el("enq-steps");
    bodyEl = el("enq-body");
    footEl = el("enq-foot");
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
    var first = f[0];
    var last = f[f.length - 1];
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
      return n.offsetParent !== null && !n.hasAttribute("hidden");
    });
  }

  var opened = false;

  function open(svcId) {
    var svc = svcById(svcId);
    if (!svc || !modal) return;

    if (!opened) {
      modal.hidden = false;
      document.documentElement.classList.add("enq-locked");
      opened = true;
      requestAnimationFrame(function () { modal.classList.add("in"); });
    }

    titleEl.textContent = svc.name;
    store.step = 1;
    store.sending = false;
    bodyEl.scrollTop = 0;
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

  function onNext() {
    if (store.sending) return;
    if (store.step < STEPS.length) {
      if (!validate(store.step)) return;
      go(store.step + 1);
    } else {
      submit();
    }
  }

  function go(step) {
    if (step < 1 || step > STEPS.length) return;
    store.step = step;
    statusEl.textContent = "";
    paint();
    bodyEl.scrollTop = 0;
    bodyEl.scrollIntoView && bodyEl.scrollIntoView({ block: "nearest" });
    var firstField = bodyEl.querySelector("select, input, textarea");
    if (firstField && step > 1) firstField.focus();
  }

  /* ---------- rendering ---------- */

  function paint() {
    var svc = svcById(store.serviceId);
    if (!svc) return;

    stepsEl.innerHTML = STEPS.map(function (label, i) {
      var n = i + 1;
      var cls = n === store.step ? "on" : (n < store.step ? "done" : "");
      return '<li class="' + cls + '"><i>' + n + "</i><span>" + esc(label) + "</span></li>";
    }).join("");

    bodyEl.innerHTML = store.step === 3 ? budgetStep() : formStep(svc, store.step);

    backBtn.hidden = store.step === 1;
    nextBtn.textContent = store.step === STEPS.length ? "Send enquiry" : "Continue";
    bindFields();
  }

  function fieldHTML(f, svcId) {
    var v = svcId === "__contact" ? store.contact[f.k] : answers(svcId)[f.k];
    var id = "f-" + svcId + "-" + f.k;
    var name = svcId + "." + f.k;
    var req = f.req ? ' required aria-required="true"' : "";
    var lbl = '<label for="' + id + '">' + esc(f.l) +
      (f.req ? "" : ' <span class="opt">(optional)</span>') + "</label>";
    var val = v == null ? "" : v;

    if (f.t === "textarea") {
      return '<div class="f-field wide">' + lbl +
        '<textarea class="f-input" id="' + id + '" data-key="' + esc(name) + '" rows="3"' + req +
        ' placeholder="' + esc(f.ph || "") + '">' + esc(val) + "</textarea>" +
        '<p class="f-err" data-err="' + esc(name) + '" hidden></p></div>';
    }
    if (f.t === "select") {
      var opts = '<option value="">Select…</option>';
      for (var i = 0; i < f.o.length; i++) {
        var o = f.o[i];
        opts += '<option value="' + esc(o) + '"' + (val === o ? " selected" : "") + ">" + esc(o) + "</option>";
      }
      return '<div class="f-field">' + lbl +
        '<select class="f-input f-select" id="' + id + '" data-key="' + esc(name) + '"' + req + ">" + opts + "</select>" +
        '<p class="f-err" data-err="' + esc(name) + '" hidden></p></div>';
    }
    if (f.t === "multi") {
      var chosen = Array.isArray(val) ? val : [];
      var chips = f.o.map(function (o) {
        var on = chosen.indexOf(o) > -1;
        return '<label class="f-chip' + (on ? " on" : "") + '"><input type="checkbox" value="' + esc(o) +
          '" data-key="' + esc(name) + '"' + (on ? " checked" : "") + " /><span>" + esc(o) + "</span></label>";
      }).join("");
      return '<div class="f-field wide"><span class="f-lbl">' + esc(f.l) +
        ' <span class="opt">(select any)</span></span>' +
        '<div class="f-chips">' + chips + "</div></div>";
    }
    var type = f.t === "email" ? "email" : f.t === "tel" ? "tel" : f.t === "url" ? "url" : "text";
    var autocomplete = f.auto ? ' autocomplete="' + f.auto + '"' : "";
    return '<div class="f-field">' + lbl +
      '<input class="f-input" type="' + type + '" id="' + id + '" data-key="' + esc(name) + '"' + req +
      autocomplete + ' value="' + esc(val) + '" placeholder="' + esc(f.ph || "") + '" />' +
      '<p class="f-err" data-err="' + esc(name) + '" hidden></p></div>';
  }

  function formStep(svc, step) {
    var list = step === 4 ? CONTACT_FIELDS
      : svc.fields.filter(function (f) { return (f.s || 1) === step; });
    var owner = step === 4 ? "__contact" : svc.id;
    if (!list.length) {
      return '<p class="f-empty">Nothing else needed here — continue to the next step.</p>';
    }
    return '<div class="f-grid">' + list.map(function (f) {
      return fieldHTML(f, owner);
    }).join("") + "</div>";
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

  /* inverse of budgetFromSlider, for restoring a previously chosen value */
  function sliderFor(dollars) {
    var t = Math.log(dollars / 10) / Math.log(10000);
    return Math.max(0, Math.min(SLIDER_MAX, Math.round(t * SLIDER_MAX)));
  }

  /* ---------- field binding ---------- */

  function bindFields() {
    var list = bodyEl.querySelectorAll("[data-key]");
    Array.prototype.forEach.call(list, function (node) {
      var evt = node.type === "checkbox" ? "change" : "input";
      node.addEventListener(evt, function () { write(node); });
      if (node.tagName === "SELECT") node.addEventListener("change", function () { write(node); });
    });

    var range = el("enq-budget");
    if (range) range.addEventListener("input", function () { onBudget(range); });
  }

  function write(node) {
    var parts = node.getAttribute("data-key").split(".");
    var owner = parts[0];
    var key = parts[1];

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

    var val = node.value;
    if (owner === "__contact") store.contact[key] = val;
    else answers(owner)[key] = val;
    clearError(node.getAttribute("data-key"));
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

  /* ---------- validation ---------- */

  function clearError(name) {
    var e = bodyEl.querySelector('[data-err="' + name + '"]');
    if (e) { e.hidden = true; e.textContent = ""; }
  }

  function setError(name, msg) {
    var e = bodyEl.querySelector('[data-err="' + name + '"]');
    if (e) { e.hidden = false; e.textContent = msg; }
  }

  function validate(step) {
    var svc = svcById(store.serviceId);
    var firstBad = null;

    if (step === 3) {
      var tKey = svc.id + ".__timeline";
      if (!answers(svc.id).__timeline) {
        setError(tKey, "Please choose an expected timeline.");
        firstBad = bodyEl.querySelector("#f-timeline");
      }
      if (firstBad) { firstBad.focus(); return false; }
      return true;
    }

    var list = step === 4 ? CONTACT_FIELDS : svc.fields.filter(function (f) { return (f.s || 1) === step; });
    var owner = step === 4 ? "__contact" : svc.id;

    list.forEach(function (f) {
      var name = owner + "." + f.k;
      var v = owner === "__contact" ? store.contact[f.k] : answers(owner)[f.k];
      var s = v == null ? "" : String(v).trim();
      clearError(name);

      if (f.req && !s) {
        setError(name, "This field is required.");
        if (!firstBad) firstBad = bodyEl.querySelector('[data-key="' + name + '"]');
        return;
      }
      if (f.t === "email" && s && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) {
        setError(name, "Please enter a valid email address.");
        if (!firstBad) firstBad = bodyEl.querySelector('[data-key="' + name + '"]');
      }
    });

    if (firstBad) { firstBad.focus(); return false; }
    return true;
  }

  /* ---------- payload + submission ---------- */

  function payload() {
    var svc = svcById(store.serviceId);
    var a = answers(svc.id);
    var project = {};
    svc.fields.forEach(function (f) {
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
      category: CATEGORY,
      service: svc.name,
      service_id: svc.id,
      project_details: project,
      budget_usd: typeof a.__budget === "number" ? a.__budget : null,
      timeline: a.__timeline || null,
      contact: contact,
      submitted_at: new Date().toISOString(),
      page: window.location.href
    };
  }

  function submit() {
    if (!validate(4)) return;
    var data = payload();
    store.sending = true;
    setBusy(true);

    if (!ENQUIRY_ENDPOINT) {
      /* no backend configured — hand the enquiry to the site's existing
         contact channel instead of pretending it was sent */
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
    nextBtn.textContent = on ? "Sending…" : (store.step === STEPS.length ? "Send enquiry" : "Continue");
  }

  function summaryText(d) {
    var lines = ["New project enquiry — RJ", "", "Category: " + d.category, "Service: " + d.service, ""];
    lines.push("— Project details —");
    Object.keys(d.project_details).forEach(function (k) {
      lines.push(k + ": " + d.project_details[k]);
    });
    lines.push("", "— Budget & timeline —");
    lines.push("Estimated Project Budget: " + (d.budget_usd == null ? "Not specified" : money(d.budget_usd) + " USD"));
    lines.push("Expected Project Timeline: " + (d.timeline || "Not specified"));
    lines.push("", "— Contact —");
    Object.keys(d.contact).forEach(function (k) { lines.push(k + ": " + d.contact[k]); });
    lines.push("", "Submitted: " + d.submitted_at);
    return lines.join("\n");
  }

  function handoff(d) {
    var body = summaryText(d);
    var truncated = body.length > MAX_MAILTO;
    if (truncated) body = body.slice(0, MAX_MAILTO) + "\n\n[Truncated — full details available on request]";

    var href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Project enquiry — " + d.service) +
      "&body=" + encodeURIComponent(body);

    setBusy(false);
    store.sending = false;

    success({
      handedOff: true,
      truncated: truncated,
      mailto: href
    });
  }

  function failed(msg) {
    bodyEl.insertAdjacentHTML("afterbegin",
      '<div class="f-alert" role="alert">Couldn’t send your enquiry — ' + esc(msg) +
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
        "<p>Thanks — your enquiry for <b>" + esc(d.service) + "</b> has reached us. We usually reply within one to two business days.</p>" +
        "<p class=\"f-hint\">Reference: " + esc(d.submitted_at) + "</p>" +
        "</div>";
      statusEl.textContent = "Enquiry sent successfully.";
      return;
    }

    bodyEl.innerHTML =
      '<div class="f-done">' +
      '<span class="f-done-ico">✉</span>' +
      "<h3>Your enquiry is ready</h3>" +
      "<p>Online submission isn’t connected on this site yet, so we’ll hand your enquiry to your email app — it’s already filled in and addressed to <b>" + CONTACT_EMAIL + "</b>. Just press send.</p>" +
      (opts.truncated ? '<p class="f-hint">The summary was shortened to fit an email link — reply and we’ll ask for anything missing.</p>' : "") +
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

  /* ---------- boot ---------- */

  function boot() {
    if (!cacheModal()) return;
    buildControls();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* exposed for testing */
  window.RJEnquiry = {
    services: SERVICES,
    budgetFromSlider: budgetFromSlider,
    sliderFor: sliderFor,
    money: money,
    open: open,
    close: close,
    payload: payload,
    store: store,
    endpoint: ENQUIRY_ENDPOINT
  };
})();
