/* ============================================================
   Hero brand-mark — cursor-driven liquid distortion
   ------------------------------------------------------------
   Raw WebGL, no libraries (matches the rest of the site: no
   build step, no dependencies).

   Scoped to the single image in the home-page "The studio"
   card (`.brand-tile .brand-mark`).

   While the effect runs the canvas is the only thing drawn over
   that spot — the original <img> is hidden, so the sharp artwork
   never ghosts underneath the warped one. The image is baked into
   the texture at exactly the canvas' pixel size, so the canvas
   reproduces it faithfully and handing over is invisible.

   At rest the canvas is hidden and the untouched <img> is shown,
   perfectly sharp.

   Nothing is created up front — the WebGL context is built on the
   first real hover, so a device that never hovers never pays for
   it. The plain <img> remains the fallback when WebGL is missing,
   the pointer is coarse (touch), prefers-reduced-motion is set,
   or the image fails to load.
   ============================================================ */
(function () {
  "use strict";

  var img = document.querySelector(".brand-tile .brand-mark");
  if (!img) return;

  var card = img.closest(".screen-card");
  if (!card) return;

  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  /* no hover + coarse pointer === touch device -> leave the <img> alone */
  var touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

  /* ---------- shaders ---------- */

  var VERT = [
    "attribute vec2 aPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = aPos * 0.5 + 0.5;",
    "  gl_Position = vec4(aPos, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform vec2  uMouse;",      // smoothed pointer, uv space (y up)
    "uniform vec2  uVel;",        // smoothed pointer velocity, uv / second
    "uniform float uTime;",
    "uniform float uInfluence;",  // 0 at rest, 1 fully engaged
    "uniform float uAspect;",
    "",
    "float hash(vec2 p) {",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "",
    "float noise(vec2 p) {",
    "  vec2 i = floor(p);",
    "  vec2 f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  float a = hash(i);",
    "  float b = hash(i + vec2(1.0, 0.0));",
    "  float c = hash(i + vec2(0.0, 1.0));",
    "  float d = hash(i + vec2(1.0, 1.0));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
    "}",
    "",
    "float fbm(vec2 p) {",
    "  float v = 0.0;",
    "  float a = 0.5;",
    "  for (int i = 0; i < 4; i++) {",
    "    v += a * noise(p);",
    "    p = p * 2.03 + 11.7;",
    "    a *= 0.5;",
    "  }",
    "  return v;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = vUv;",
    "",
    "  /* distance to the cursor, corrected for the box aspect */",
    "  vec2 d = uv - uMouse;",
    "  d.x *= uAspect;",
    "  float r = length(d);",
    "",
    "  /* a tight bulge plus a wider, softer swell -> organic falloff */",
    "  float fall = exp(-r * r * 20.0) + 0.45 * exp(-r * r * 5.5);",
    "  fall = min(fall, 1.5);",
    "",
    "  /* drifting liquid field */",
    "  vec2 q = uv * 3.6;",
    "  float n1 = fbm(q + vec2(uTime * 0.17, -uTime * 0.12));",
    "  float n2 = fbm(q + vec2(7.3 - uTime * 0.10, 2.1 + uTime * 0.15) + n1 * 0.8);",
    "  vec2 flow = vec2(n1, n2) - 0.5;",
    "",
    "  /* outward push from the cursor + drag along the direction of travel */",
    "  vec2 dir = d / max(r, 1e-4);",
    "  vec2 disp = flow * 0.155 + dir * 0.034 + uVel * 0.021;",
    "",
    "  uv -= disp * fall * uInfluence;",
    "",
    "  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {",
    "    gl_FragColor = vec4(0.0);",
    "    return;",
    "  }",
    "  gl_FragColor = texture2D(uTex, uv);",
    "}"
  ].join("\n");

  /* ---------- state ---------- */

  var canvas = null;
  var gl = null;
  var source = null;      // offscreen 2D canvas the texture is baked from
  var sourceCtx = null;
  var ready = false;
  var armed = false;

  var box = { aspect: 1 };

  var target = [0.5, 0.5];
  var mouse = [0.5, 0.5];
  var vel = [0, 0];
  var influence = 0;
  var wantInfluence = 0;
  var hovering = false;

  var uLoc = {};

  var raf = 0;
  var last = 0;
  var clock = 0;

  /* ---------- gl helpers ---------- */

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initGL() {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    var s = canvas.style;
    s.position = "absolute";
    s.pointerEvents = "none";
    s.opacity = "0";
    s.zIndex = "2";

    gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power"
    });
    if (!gl) return false;

    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
    gl.useProgram(program);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    var aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.clearColor(0, 0, 0, 0);
    gl.disable(gl.BLEND);

    uLoc.uTex = gl.getUniformLocation(program, "uTex");
    uLoc.uMouse = gl.getUniformLocation(program, "uMouse");
    uLoc.uVel = gl.getUniformLocation(program, "uVel");
    uLoc.uTime = gl.getUniformLocation(program, "uTime");
    uLoc.uInfluence = gl.getUniformLocation(program, "uInfluence");
    uLoc.uAspect = gl.getUniformLocation(program, "uAspect");

    source = document.createElement("canvas");
    sourceCtx = source.getContext("2d");
    if (sourceCtx.imageSmoothingQuality) {
      sourceCtx.imageSmoothingQuality = "high";
    }

    card.appendChild(canvas);
    return true;
  }

  /* ---------- layout ---------- */

  /* The artwork is drawn into an offscreen canvas at the exact pixel size of
     the GL buffer, using the same object-fit: contain box the <img> uses.
     GL then samples it 1:1, so the canvas is a faithful copy of the original. */
  function syncGeometry() {
    var cr = card.getBoundingClientRect();
    var r = img.getBoundingClientRect();
    var w = r.width;
    var h = r.height;
    if (!w || !h) return false;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.left = r.left - cr.left + "px";
    canvas.style.top = r.top - cr.top + "px";
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    var bw = Math.round(w * dpr);
    var bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      gl.viewport(0, 0, bw, bh);

      var nw = img.naturalWidth || bw;
      var nh = img.naturalHeight || bh;
      var scale = Math.min(bw / nw, bh / nh);
      var dw = nw * scale;
      var dh = nh * scale;
      source.width = bw;
      source.height = bh;
      sourceCtx.clearRect(0, 0, bw, bh);
      sourceCtx.drawImage(img, (bw - dw) / 2, (bh - dh) / 2, dw, dh);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source
      );
    }

    box.aspect = w / h;
    return true;
  }

  function pointerUv(e, out) {
    var r = img.getBoundingClientRect();
    out[0] = (e.clientX - r.left) / r.width;
    out[1] = 1 - (e.clientY - r.top) / r.height;
  }

  /* ---------- render loop ---------- */

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(uLoc.uTex, 0);
    gl.uniform2f(uLoc.uMouse, mouse[0], mouse[1]);
    gl.uniform2f(uLoc.uVel, vel[0], vel[1]);
    gl.uniform1f(uLoc.uTime, clock);
    gl.uniform1f(uLoc.uInfluence, influence);
    gl.uniform1f(uLoc.uAspect, box.aspect);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function loop(now) {
    raf = 0;
    if (!last) last = now;
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;

    /* the pointer follows the cursor with a short, springy lag */
    var follow = 1 - Math.exp(-dt / 0.075);
    var px = mouse[0];
    var py = mouse[1];
    mouse[0] += (target[0] - px) * follow;
    mouse[1] += (target[1] - py) * follow;

    /* smoothed velocity, in uv per second, clamped so flicks cannot blow up */
    var vx = (mouse[0] - px) / Math.max(dt, 1e-3);
    var vy = (mouse[1] - py) / Math.max(dt, 1e-3);
    var vk = 1 - Math.exp(-dt / 0.12);
    vel[0] += (vx - vel[0]) * vk;
    vel[1] += (vy - vel[1]) * vk;
    if (vel[0] > 5) vel[0] = 5; else if (vel[0] < -5) vel[0] = -5;
    if (vel[1] > 5) vel[1] = 5; else if (vel[1] < -5) vel[1] = -5;

    /* ease in quickly, ease out slowly */
    var tau = wantInfluence > influence ? 0.11 : 0.30;
    influence += (wantInfluence - influence) * (1 - Math.exp(-dt / tau));

    if (!hovering && influence < 0.002) {
      influence = 0;
      render();                      /* exactly the undistorted image */
      canvas.style.opacity = "0";    /* hand the spot back to the <img> */
      img.style.opacity = "";
      last = 0;
      return;
    }

    render();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf || !ready) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  /* ---------- pointer ---------- */

  function onEnter(e) {
    if (!ready || !syncGeometry()) return;
    pointerUv(e, target);
    mouse[0] = target[0];
    mouse[1] = target[1];
    vel[0] = vel[1] = 0;
    hovering = true;
    wantInfluence = 1;

    /* paint the untouched image, then take over from the <img> in the same
       frame — identical pixels, so nothing flickers. The <img> is kept
       hoverable (opacity, not visibility) so it stays the pointer target. */
    influence = 0;
    render();
    canvas.style.opacity = "1";
    img.style.opacity = "0";
    start();
  }

  function onMove(e) {
    if (!ready) return;
    if (!hovering) { onEnter(e); return; }
    pointerUv(e, target);
  }

  function onLeave() {
    hovering = false;
    wantInfluence = 0;
    start();
  }

  function onResize() {
    if (ready) syncGeometry();
  }

  function onContextLost(e) {
    e.preventDefault();
    release();
    if (enabled()) arm();
  }

  /* ---------- lifecycle ---------- */

  function detachInteraction() {
    img.removeEventListener("pointermove", onMove);
    img.removeEventListener("pointerleave", onLeave);
    img.removeEventListener("pointercancel", onLeave);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onResize);
  }

  /* drop the canvas and the loop -> the plain, sharp <img> again */
  function release() {
    hovering = false;
    wantInfluence = 0;
    influence = 0;
    vel[0] = vel[1] = 0;
    last = 0;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    if (canvas) {
      canvas.style.opacity = "0";
      canvas.removeEventListener("webglcontextlost", onContextLost, false);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
    detachInteraction();
    img.style.opacity = "";
    canvas = null;
    gl = null;
    source = null;
    sourceCtx = null;
    ready = false;
  }

  function disarm() {
    if (!armed) return;
    img.removeEventListener("pointerenter", onFirstEnter);
    armed = false;
  }

  function arm() {
    disarm();
    img.addEventListener("pointerenter", onFirstEnter);
    armed = true;
  }

  function attachInteraction() {
    img.addEventListener("pointermove", onMove);
    img.addEventListener("pointerleave", onLeave);
    img.addEventListener("pointercancel", onLeave);
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, { passive: true });
  }

  /* the WebGL context is built here — on the first real hover only */
  function onFirstEnter(e) {
    if (ready) return;
    if (!enabled() || !initGL() || !syncGeometry()) {
      disarm();
      return;
    }
    ready = true;
    disarm();                 /* one-shot: never build a second context */
    attachInteraction();
    onEnter(e);
  }

  function enabled() {
    return !reduceQuery.matches && !touchQuery.matches;
  }

  function onPreferenceChange() {
    if (!enabled()) {
      release();
      disarm();
    } else if (!ready) {
      arm();
    }
  }

  if (reduceQuery.addEventListener) {
    reduceQuery.addEventListener("change", onPreferenceChange);
    touchQuery.addEventListener("change", onPreferenceChange);
  }

  if (enabled()) {
    if (img.complete && img.naturalWidth) arm();
    else img.addEventListener("load", arm, { once: true });
  }
})();
