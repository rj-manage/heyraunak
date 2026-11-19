/* ============================================================
   RJ - service screenshot slider
   ------------------------------------------------------------
   Turns each [data-slider] block into a swipeable carousel:
   - left / right arrow buttons
   - pointer (mouse + touch) drag with a swipe threshold
   - keyboard left / right arrows while the slider is focused
   - autoplay every 5 seconds - paused on hover, on focus, when
     the slider is off screen and when the browser tab is hidden
   - autoplay is off for prefers-reduced-motion

   Markup lives in the service category pages; styles in site.css.
   ============================================================ */
(function () {
  "use strict";

  var sliders = document.querySelectorAll("[data-slider]");
  if (!sliders.length) return;

  var DELAY = 5000;
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  Array.prototype.forEach.call(sliders, function (slider) {
    var track = slider.querySelector("[data-track]");
    var slides = Array.prototype.slice.call(slider.querySelectorAll("[data-slide]"));
    var prevBtn = slider.querySelector("[data-prev]");
    var nextBtn = slider.querySelector("[data-next]");
    var dotsHost = slider.parentNode
      ? slider.parentNode.querySelector("[data-dots]")
      : null;
    if (!track || slides.length < 2) return;

    var index = 0;
    var timer = null;
    var onScreen = true;
    var paused = false;
    var dots = [];

    if (dotsHost) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "shot-dot";
        dot.setAttribute("aria-label", "Show screenshot " + (i + 1) + " of " + slides.length);
        dot.addEventListener("click", function () { go(i, true); });
        dotsHost.appendChild(dot);
        dots.push(dot);
      });
    }

    function paint(offsetPx) {
      var shift = -index * 100;
      track.style.transform = offsetPx
        ? "translateX(calc(" + shift + "% + " + offsetPx + "px))"
        : "translateX(" + shift + "%)";
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle("is-active", i === index);
      }
      for (var s = 0; s < slides.length; s++) {
        slides[s].setAttribute("aria-hidden", s === index ? "false" : "true");
      }
    }

    function go(i, manual) {
      index = ((i % slides.length) + slides.length) % slides.length;
      paint(0);
      if (manual) restart();
    }

    function start() {
      if (reduce || timer || !onScreen || paused) return;
      timer = window.setInterval(function () { go(index + 1); }, DELAY);
    }
    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }
    function restart() {
      stop();
      start();
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { go(index - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { go(index + 1, true); });

    slider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1, true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1, true);
      }
    });

    slider.addEventListener("pointerenter", function () { paused = true; stop(); });
    slider.addEventListener("pointerleave", function () { paused = false; start(); });
    slider.addEventListener("focusin", function () { paused = true; stop(); });
    slider.addEventListener("focusout", function () { paused = false; start(); });

    /* drag / swipe */
    var dragging = false;
    var startX = 0;
    var dx = 0;

    slider.addEventListener("dragstart", function (e) { e.preventDefault(); });

    slider.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest && e.target.closest(".shot-nav")) return;
      dragging = true;
      startX = e.clientX;
      dx = 0;
      slider.classList.add("is-dragging");
      if (slider.setPointerCapture) {
        try { slider.setPointerCapture(e.pointerId); } catch (err) {}
      }
    });

    slider.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      dx = e.clientX - startX;
      paint(dx);
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      slider.classList.remove("is-dragging");
      var threshold = Math.max(40, slider.clientWidth * 0.12);
      if (dx <= -threshold) go(index + 1, true);
      else if (dx >= threshold) go(index - 1, true);
      else paint(0);
      dx = 0;
    }
    slider.addEventListener("pointerup", endDrag);
    slider.addEventListener("pointercancel", endDrag);

    /* only autoplay while the slider is on screen */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          onScreen = entries[0].isIntersecting;
          if (onScreen) start();
          else stop();
        },
        { threshold: 0.25 }
      ).observe(slider);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    paint(0);
    start();
  });
})();
