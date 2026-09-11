# Rj_Manage — Forms Design Gallery

A gallery of **20 different form designs** — from simple classic layouts to high-tech 3D animated experiences. Every form is fully interactive with working validation and a submit toast, and is ready to use.

## Getting started

Open `index.html` in any browser, or serve the folder:

```bash
cd Rj_Manage
python3 -m http.server 8000
# then visit http://localhost:8000
```

## The 20 designs, grouped by category

### Category 01 · Classic & Minimal
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 01 | Classic Simple | Contact | Clean single-column layout, timeless & fast |
| 02 | Modern Minimal | Signup | Floating labels, pill chips, soft focus rings |
| 03 | Split Screen | Appointment | Brand panel + side form, campaign feel |

### Category 02 · Glass & Soft UI
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 04 | Glassmorphism | Feedback | Frosted glass over animated aurora blobs |
| 05 | Neumorphism | Preferences | Soft-extruded controls on pastel canvas |

### Category 03 · Guided & Immersive
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 06 | Step Wizard | Application | 4-step flow, progress bar, per-step validation, review screen |
| 07 | Neon Cyber | Access | Terminal header, glowing inputs, scanlines |
| 08 | 3D Tilt Card | RSVP | Cursor-tracking perspective + parallax glare |

### Category 04 · Luxury & Premium
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 09 | Premium Animated | Membership | Gold shimmer border, magnetic button, scroll reveal |
| 10 | Expert Showcase | Order | Confetti on submit, live counter, localStorage autosave, typewriter copy |

### Category 05 · High-Tech (new)
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 11 | Holographic UI | Register | Iridescent surfaces that shift hue on mouse move |
| 12 | Particle Constellation | Connect | Canvas particle network, connecting nodes |
| 13 | Morph Hover | Job Application | Fields scale on hover, animated gradient ring on focus |
| 14 | Deep Glass Layers | Enrollment | Stacked translucent layers with scroll parallax |
| 15 | Circuit Board | API Access | Glowing circuit traces, hardware aesthetic |
| 16 | Liquid Fill | Waitlist | Fields fill like water on focus, rippling button |
| 17 | Stepper Flow | Onboarding | Animated multi-step flow with gradient progress |

### Category 06 · Synthwave, 3D & Kinetic (new)
| # | Design | Content | Highlights |
|---|--------|---------|-----------|
| 18 | Flip Card | Registration | 3D card flips between info and form |
| 19 | Synthwave Grid | Notify | Neon sun over a retro perspective grid |
| 20 | Kinetic Form | Subscribe | Tumbling headline, jitter button, dynamic fields |

## Structure

```
Rj_Manage/
├── index.html          # Gallery landing page (categorized, with thumbnails)
├── form-1.html … 20    # Individual design demos
├── css/common.css      # Shared tokens, controls, toast
└── js/common.js        # Shared helpers (collectForm, showToast)
```

No build step, no dependencies — just open and use.