/* ============================================================
   RJ — shared site behaviour
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
