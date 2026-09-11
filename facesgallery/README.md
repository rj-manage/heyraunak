# RJ Web Faces — Website UI/UX Design Gallery

A gallery of **20 complete website-interface designs** by **RJ_MANAGE** — from simple, static layouts to 3D, animated and cinematic web experiences. Every "face" is a full, standalone demo page built by hand with pure HTML, CSS and vanilla JS (no frameworks, no images — every visual is CSS art).

## Getting started

Open `index.html` in any browser, or serve the folder. Two VS Code-friendly ways:

1. **Live Server** (recommended): right-click `index.html` → *Open with Live Server*.
2. Terminal:
   ```bash
   cd "13. rj-web-faces-gallery"
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

## The 20 faces, grouped by category

### Category 01 · Classic & Minimal
| # | Face | Level | Concept |
|---|------|-------|---------|
| 01 | Classic Corporate | Starter | Timeless professional-services site: nav, hero, services grid, contact band |
| 02 | Minimal Portfolio | Beginner | Paper-light designer portfolio: huge type, filterable work grid |
| 03 | Split Landing | Beginner | Two-panel product landing with signup card |

### Category 02 · Modern & Business
| # | Face | Level | Concept |
|---|------|-------|---------|
| 04 | Startup SaaS | Intermediate | Full marketing page: animated stats, real monthly/yearly pricing toggle, FAQ |
| 05 | Restaurant & Bar | Intermediate | Dark, fire-lit dining: menu filters, steam, computing reservation form |
| 06 | Analytics Dashboard | Intermediate | Soft-UI workspace: collapsible sidebar, SVG charts with real tabs, live KPIs |

### Category 03 · Glass & Immersive
| # | Face | Level | Concept |
|---|------|-------|---------|
| 07 | Glassmorphism Web3 | Advanced | Frosted wallet site over living aurora; cursor glow, live-ticking prices |
| 08 | Neumorphic Finance App | Intermediate | Soft-extruded savings app: working toggle, slider, animated ring |
| 09 | Aurora Parallax Glass | Advanced | Day-to-night scroll story with true multi-speed depth layers |

### Category 04 · Luxury & Premium
| # | Face | Level | Concept |
|---|------|-------|---------|
| 10 | Luxury Gold Maison | Expert | Haute-jewellery: shimmer gold on black, magnetic CTAs, VIP form |
| 11 | Editorial Agency | Advanced | Huge-type brand studio; work rows unfold on hover, marquee rhythm |
| 12 | Hotel & Resort | Advanced | Coastal resort: horizon hero, suites, booking bar with night math |

### Category 05 · High-Tech & Dark
| # | Face | Level | Concept |
|---|------|-------|---------|
| 13 | Neon Cyber Esports | Advanced | Esports arena: glitch type, typewriter hero, watch-live modal |
| 14 | Holographic AR Product | Advanced | AR-glasses launch: surfaces hue-shift with cursor, tier preorder |
| 15 | Particle Network AI | Expert | Canvas particle constellation reacting to cursor; count-up stats |
| 16 | Circuit HUD Console | Expert | Mission control: boot sequence, live telemetry meters, streaming logs |

### Category 06 · 3D, Kinetic & Futuristic (the finale)
| # | Face | Level | Concept |
|---|------|-------|---------|
| 17 | 3D Product Showcase | Advanced | CSS-3D earbuds that tilt with the cursor; swatch recolor, playable EQ |
| 18 | Kinetic Typography | Expert | Festival site where letters dance per character; multi-speed marquees |
| 19 | Synthwave Radio | Expert | Retrowave FM: striped sun, scrolling grid, spinning vinyl, live requests |
| 20 | Immersive 3D Scroll | Expert | Scroll-driven spatial deck: rotating 3D ring of scenes with copy beats |

## Structure

```
13. rj-web-faces-gallery/
├── index.html          # Gallery landing page (6 categories, CSS-art thumbnails)
├── face-1.html … 20    # Individual website demos (face-1.html … face-20.html)
├── css/common.css      # Shared tokens, controls, reveal + reduced-motion support
├── js/common.js        # Shared helpers (collectForm, showToast, scroll reveal)
└── assets/img/
    ├── RJ_Logo.png          # White RJ monogram (dark demo pages)
    └── RJ_Logo_Black.png    # Black RJ monogram (light pages, favicon)
```

No build step, no dependencies, no external images — everything is hand-written CSS art and vanilla JS. Open and explore.
