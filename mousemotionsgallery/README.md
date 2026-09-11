# RJ Motion Gallery — Cursor Interaction Experiments

A gallery of **10 mouse-driven interaction experiments** by **RJ_MANAGE** — from simple parallax to liquid physics, magnetic typography and a full gravity field. Every "experiment" is a full, standalone demo page built by hand with pure HTML, CSS and vanilla JS (no frameworks, no images — every visual is CSS art, and even the WebGL demo uses raw WebGL with no three.js).

> Built to sit side-by-side with the **RJ Web Faces Gallery** — same design language, same typography (Sora + Inter), same light-indigo branding — so both sites clearly belong to the same company.

## Getting started

Open `index.html` in any browser, or serve the folder. Two VS Code-friendly ways:

1. **Live Server** (recommended): right-click `index.html` → *Open with Live Server*.
2. Terminal:
   ```bash
   cd "5. mouse-motion-lab"
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

## The 10 experiments, grouped by category

### Category 01 · Basics & Motion
| # | Experiment | Level | Concept |
|---|------------|-------|---------|
| 01 | Mouse Parallax | Starter | Layered DOM planes drifting at different depths from cursor position |
| 02 | Magnetic Elements | Beginner | Buttons that lean toward the pointer and spring back (custom integrator) |
| 03 | Cursor Follower | Beginner | A heavy orb with lag, momentum, rotation and squash & stretch |

### Category 02 · Physics & Particles
| # | Experiment | Level | Concept |
|---|------------|-------|---------|
| 04 | Image Reveal | Intermediate | A CSS-art figure that detaches from a project list and trails the cursor |
| 05 | Spotlight | Intermediate | A masked radial cone of light that reveals hidden typography |
| 06 | Particle Field | Intermediate | A canvas grid of springs that part around the pointer and settle back |

### Category 03 · 3D & Depth
| # | Experiment | Level | Concept |
|---|------------|-------|---------|
| 07 | 3D Tilt | Advanced | A glass card that leans into the pointer in real 3D with floating layers |
| 08 | Liquid Distortion | Advanced | A raw-WebGL fbm surface with radial ripples and swirl around the cursor |

### Category 04 · High-Tech & Field (the finale)
| # | Experiment | Level | Concept |
|---|------------|-------|---------|
| 09 | Magnetic Typography | Expert | Per-letter magnetism, each one leaning toward you with its own strength |
| 10 | Cursor Gravity | Expert | A tiny solar system where the cursor is the sun and bodies orbit by mass |

## Structure

```
5. mouse-motion-lab/
├── index.html          # Gallery landing page (4 categories, CSS-art thumbnails)
├── experiment-1.html … # Individual demos (experiment-1.html … experiment-10.html)
├── css/common.css      # Shared design tokens, buttons, reveal + reduced-motion support
├── js/common.js        # Shared helpers (clamp, damp, showToast, scroll reveal)
└── assets/img/
    ├── RJ_Logo.png          # White RJ monogram (dark demo pages)
    └── RJ_Logo_Black.png    # Black RJ monogram (light pages, favicon)
```

No build step, no dependencies, no external images — everything is hand-written CSS art and vanilla JS. Open and explore.

## Performance choices

- Every demo writes only `transform` / `opacity` / canvas — no layout reads per frame (element rects are cached and measured on enter / resize).
- Pointer handlers update refs only — no re-renders per move.
- Animation loops run only while the section is near the viewport and respect `prefers-reduced-motion`.
- The WebGL demo uses raw WebGL (a fullscreen-triangle + one fragment shader) — no three.js bundle.
- Physics use dt-scaled integration (frame-rate independent), not per-frame constants.

## Accessibility

- `prefers-reduced-motion` disables tracking and particles; content stays fully visible and usable.
- All controls are real `<button>`s with focus styles; decorative elements are `aria-hidden`.
- Demos use pointer events with mouse/touch/pen fallbacks.