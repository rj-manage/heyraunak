/* ============================================================
   RJ - service picker + selection popup
   ------------------------------------------------------------
   Shared by the service category pages (/services/<field>/).
   The service names are read straight from that page's .svc-grid
   cards, so the markup stays the single source of truth: the same
   list powers both the searchable dropdown and the clickable cards.
   Picking a service - from the dropdown or a card - opens the
   selection popup.

   NOTE: the popup is a placeholder for now. The real enquiry form,
   and saving it to Project Vault -> Enquiries, is to come.
   ============================================================ */
(function () {
  "use strict";

  var combo = document.querySelector("[data-svc-combo]");
  var grid = document.querySelector(".svc-grid");
  var modal = document.getElementById("svc-modal");
  if (!combo || !grid || !modal) return;

  var input = combo.querySelector(".svc-combo-input");
  var list = combo.querySelector(".svc-combo-list");
  var toggle = combo.querySelector(".svc-combo-toggle");
  var titleEl = modal.querySelector("#svc-modal-title");
  var CONTACT = combo.getAttribute("data-contact") || "../../contact/";

  /* ---------- service names, straight from the cards ---------- */

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".svc-card"));
  var names = [];

  cards.forEach(function (card) {
    var t = card.querySelector(".t");
    if (!t) return;
    var name = t.textContent.replace(/\s+/g, " ").trim();
    if (!name) return;

    names.push(name);
    card.setAttribute("data-service", name);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.addEventListener("click", function () { choose(name, card); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        choose(name, card);
      }
    });
  });

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* punctuation-free form so "e-commerce" meets "ecommerce" */
  function collapse(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  /* every word of the query must appear somewhere in the name */
  function matches(name, query) {
    var parts = String(query == null ? "" : query).toLowerCase()
      .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
    if (!parts.length) return true;
    var hay = collapse(name);
    for (var i = 0; i < parts.length; i++) {
      if (hay.indexOf(parts[i]) < 0) return false;
    }
    return true;
  }

  function rxEsc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /* wrap each matched word in <mark> */
  function highlight(text, query) {
    var parts = String(query == null ? "" : query).toLowerCase()
      .replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
    if (!parts.length) return esc(text);
    var re = new RegExp("(" + parts.map(rxEsc).join("|") + ")", "ig");
    var out = "", last = 0, m;
    while ((m = re.exec(text))) {
      out += esc(text.slice(last, m.index)) + "<mark>" + esc(m[0]) + "</mark>";
      last = m.index + m[0].length;
      if (m[0] === "") re.lastIndex++;
    }
    return out + esc(text.slice(last));
  }

  /* ---------- combobox ---------- */

  var isOpen = false;
  var active = -1;
  var visible = [];

  function setActive(i) {
    active = i;
    var opts = list.querySelectorAll(".svc-combo-opt");
    for (var n = 0; n < opts.length; n++) opts[n].classList.toggle("is-active", n === i);
    if (i >= 0 && opts[i]) {
      input.setAttribute("aria-activedescendant", opts[i].id);
      if (opts[i].scrollIntoView) opts[i].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function render(query) {
    visible = names.filter(function (n) { return matches(n, query); });

    if (!visible.length) {
      list.innerHTML = '<li class="svc-combo-empty" role="presentation">No service matches that. ' +
        'If your service is not listed, please <a href="' + esc(CONTACT) + '">contact us</a>.</li>';
      setActive(-1);
      return;
    }

    list.innerHTML = visible.map(function (n, i) {
      return '<li class="svc-combo-opt" role="option" id="svc-opt-' + i +
        '" data-i="' + i + '" aria-selected="false">' + highlight(n, query) + "</li>";
    }).join("");

    setActive(visible.length ? 0 : -1);
  }

  function openList() {
    if (isOpen) return;
    isOpen = true;
    combo.classList.add("open");
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    render(input.value);
  }

  function closeList() {
    if (!isOpen) return;
    isOpen = false;
    combo.classList.remove("open");
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }

  function move(delta) {
    if (!visible.length) return;
    var n = active + delta;
    if (n < 0) n = visible.length - 1;
    if (n >= visible.length) n = 0;
    setActive(n);
  }

  function choose(name, origin) {
    input.value = name;
    closeList();
    openModal(name, origin);
  }

  input.addEventListener("focus", openList);

  input.addEventListener("input", function () {
    openList();
    render(input.value);
  });

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
        choose(visible[active >= 0 ? active : 0], input);
      }
    } else if (e.key === "Escape") {
      if (isOpen) { e.preventDefault(); closeList(); }
    } else if (e.key === "Tab") {
      closeList();
    }
  });

  toggle.addEventListener("click", function (e) {
    e.preventDefault();
    if (isOpen) closeList();
    else { input.focus(); openList(); }
  });

  /* keep the option click from blurring the input before it lands */
  list.addEventListener("mousedown", function (e) { e.preventDefault(); });
  list.addEventListener("click", function (e) {
    var opt = e.target.closest ? e.target.closest(".svc-combo-opt") : null;
    if (!opt) return;
    var i = Number(opt.getAttribute("data-i"));
    if (visible[i]) choose(visible[i], input);
  });

  document.addEventListener("click", function (e) {
    if (isOpen && !combo.contains(e.target)) closeList();
  });

  /* ---------- selection popup ---------- */

  var lastFocus = null;

  function openModal(name, origin) {
    lastFocus = origin || document.activeElement;
    titleEl.textContent = name;
    modal.hidden = false;
    document.documentElement.classList.add("svc-locked");
    var x = modal.querySelector(".svc-modal-x");
    if (x) x.focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove("svc-locked");
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
  }

  modal.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-svc-close]")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) {
      e.preventDefault();
      closeModal();
    }
  });
})();
