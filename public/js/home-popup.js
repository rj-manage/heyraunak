/* ============================================================
   RJ - home page popup (student projects ad)
   ------------------------------------------------------------
   Opens the student-projects banner popup on the home page a
   moment after load. Dismissed by the close button, the backdrop
   or Escape, and remembered for the rest of the browser session
   so it never nags on a refresh. The markup lives in index.html
   so the banner and links stay editable without touching JS.
   ============================================================ */
(function () {
  "use strict";

  var pop = document.getElementById("home-pop");
  if (!pop) return;

  var KEY = "rj-home-pop-seen";
  var open = false;
  var lastFocus = null;

  function seen() {
    try {
      return window.sessionStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markSeen() {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch (e) {
      /* private mode - just show it again next load */
    }
  }

  function show() {
    if (open || seen()) return;
    lastFocus = document.activeElement;
    pop.hidden = false;
    open = true;
    document.documentElement.classList.add("pop-locked");
    var x = pop.querySelector(".home-pop-x");
    if (x) x.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    pop.hidden = true;
    document.documentElement.classList.remove("pop-locked");
    markSeen();
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) lastFocus.focus();
  }

  pop.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-pop-close]")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
    }
  });

  /* keep keyboard focus inside the popup while it is open */
  pop.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !open) return;
    var focusables = pop.querySelectorAll("a[href], button:not([disabled])");
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.setTimeout(show, 900);
})();
