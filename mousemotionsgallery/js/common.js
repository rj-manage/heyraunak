/* ============================================================
   RJ Motion Gallery — Shared helpers for all cursor demos
   ============================================================ */

/** Clamp a number into a range. */
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** Frame-rate independent exponential damping toward a target. */
function damp(current, target, lambda, dt) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Show the shared toast message. */
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

/** Scroll-reveal observer usable by every demo page. */
(function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      obs.unobserve(en.target);
    });
  }, { threshold: 0.12 });
  els.forEach((el) => obs.observe(el));
})();

/** Honour prefers-reduced-motion as a toggleable flag across demos. */
const prefersReducedMotion =
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;