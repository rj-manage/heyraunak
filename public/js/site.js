/* ============================================================
   RJ - shared site behaviour
   nav · reveal-on-scroll
   ============================================================ */
(function () {
  "use strict";

  /* ---------------- mobile nav ---------------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      menu.classList.toggle("open");
      burger.setAttribute(
        "aria-expanded",
        menu.classList.contains("open") ? "true" : "false"
      );
    });
  }

  /* highlight the nav item that matches the current path.
     Both the current path and each link target are normalised by dropping a
     trailing "index.html", so the home link ("index.html" → "/") matches when
     the site is served from the root instead of never matching at all. */
  (function markActive() {
    function normalise(p) {
      p = p.replace(/index\.html$/, "");
      return p === "" ? "/" : p;
    }

    var path = normalise(window.location.pathname);
    var links = document.querySelectorAll(".nav-links a[data-nav]");
    var best = null;
    var bestLen = -1;

    Array.prototype.forEach.call(links, function (a) {
      var target = normalise(
        new URL(a.getAttribute("href"), window.location.href).pathname
      );
      var hit =
        target === "/"
          ? path === "/"
          : path.indexOf(target.replace(/\/$/, "")) === 0;
      if (hit && target.length > bestLen) {
        best = a;
        bestLen = target.length;
      }
    });

    if (best) best.classList.add("active");
  })();

  /* ---------------- mobile jump-to-end arrow ---------------- */
  (function scrollEnd() {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scroll-end";
    btn.setAttribute("aria-label", "Scroll to the end of the page");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    btn.addEventListener("click", function () {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    });
    document.body.appendChild(btn);

    /* hide it once the reader has reached the very bottom (and on pages that
       cannot scroll at all) */
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var atBottom = max <= 8 || window.scrollY >= max - 8;
      btn.classList.toggle("is-hidden", atBottom);
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        update();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  })();

  /* ---------------- reveal on scroll ---------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    Array.prototype.forEach.call(revealEls, function (el) {
      io.observe(el);
    });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add("in");
    });
  }
})();
