/* ============================================================
   Rj_Manage — Shared form helpers
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

/** Guard for unknown dynamic attributes. */
(function initShared() {
  document.addEventListener("submit", (e) => {
    // Handled per-form where needed.
  });
})();
