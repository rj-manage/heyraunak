/* ============================================================
   RJ Web Faces — Shared helpers for all face demos
   ============================================================ */

/** Collect visible [data-field] inputs inside a form into an object. */
function collectForm(form) {
  const data = {};
  form.querySelectorAll("[data-field]").forEach((el) => {
    if (el.closest("[data-step]") && !el.closest("[data-step].active")) return; // hidden wizard steps
    data[el.getAttribute("data-field")] = el.value.trim();
  });
  return data;
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

/** Scroll-reveal observer usable by every face page. */
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
