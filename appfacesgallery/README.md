# RJ App Faces — Mobile App UI Design Gallery

A gallery of **20 mobile-app faces** by **RJ_MANAGE**, each with its own front screen and its own set of inside screens. Every face is a standalone page built by hand with pure HTML, CSS and vanilla JS — no frameworks, no images, no chart libraries. Every visual is CSS art.

Structured like the [RJ Web Faces Gallery](../facesgallery/): one page per face, plus a categorised index that links out to them.

## Getting started

Open `index.html` in any browser, or serve the folder. Two VS Code-friendly ways:

1. **Live Server** (recommended): right-click `index.html` → *Open with Live Server*.
2. Terminal:
   ```bash
   cd "appfacesgallery"
   python3 -m http.server 8000
   # then visit http://localhost:8000
   ```

## The 20 faces, grouped by category

### Category 01 · Finance & Commerce
| # | Face | Level | Concept |
|---|------|-------|---------|
| 01 | Wallet | Intermediate | Dark-glass banking: gradient balance card, quick actions, card stack, activity ledger |
| 08 | Shop | Starter | Minimal monochrome commerce: lettered masthead, product frame, size selector, cart |
| 09 | Crypto | Advanced | Trading terminal: bordered panels, candlestick bars, monospace price rows, trade switch |
| 19 | Coffee | Beginner | Kraft café loyalty: roast card, dashed stamp grid, reward rows |
| 20 | Analytics | Advanced | Dark dashboard: KPI cards with deltas, bar chart, conic donut, tracker rows |

### Category 02 · Media & Social
| # | Face | Level | Concept |
|---|------|-------|---------|
| 02 | Music Player | Intermediate | Neon synthwave: grooved album art, live waveform, gradient transport controls |
| 05 | Messages | Starter | Clean chat: conversation rows, unread badges, real bubble thread, composer |
| 11 | Podcast | Intermediate | Retro warm: vinyl with real grooves, amber waveform, scrubber, episode rows |
| 14 | Camera | Advanced | Pro-black viewfinder: rule-of-thirds, focus reticle, EV scale, shutter |
| 16 | Social Feed | Intermediate | Story rings: conic-gradient avatars, post photo, engagement bar, notifications |

### Category 03 · Life & Utility
| # | Face | Level | Concept |
|---|------|-------|---------|
| 06 | Weather | Starter | Sky-gradient forecast: hero temperature, CSS sun and cloud, hourly and weekly bars |
| 07 | Travel | Beginner | Editorial serif booking: photo hero, three-up strip, fare rows |
| 12 | Maps | Advanced | Map-first: CSS canvas of roads, parks and water, location puck, bottom sheet |
| 13 | Calendar | Beginner | Paper planner: serif month grid, ringed today, event dots, day agenda |
| 17 | Notes | Starter | Legal pad: ruled paper, red margin, checkbox tasks, tag chips |

### Category 04 · Health & Movement
| # | Face | Level | Concept |
|---|------|-------|---------|
| 03 | Fitness | Beginner | Brutalist: offset hard shadows, giant calorie numeral, weekly bar chart |
| 04 | Food Delivery | Beginner | Warm ordering: pill search, category chips, gradient dish thumbnails |
| 10 | Meditation | Intermediate | Pastel calm: blur blobs, conic progress ring, session cards, week dots |
| 15 | Health | Intermediate | Clinical vitals: bordered cards, sparklines, real SVG ECG polyline |
| 18 | Ride | Advanced | Night sheet: street-grid map, route and car marker, driver sheet, ETA metrics |

Each of the twenty is also annotated with a skill level — **Starter**, **Beginner**, **Intermediate**, **Advanced** or **Expert**.

## Structure

```
appfacesgallery/
├── index.html              # Gallery landing — 4 categories, live device thumbnails
├── app-face-1.html … 20    # One standalone page per face (stage + its four screens)
├── css/appfaces.css        # Device chrome, shared atoms, all 20 app themes, page layout
└── js/appfaces.js          # The APPS registry + the 80 screen builders + both renderers
```

### How it fits together

- **`js/appfaces.js`** is the single source of truth. It holds the `APPS` table (name, style, category, level, copy, components, palette) and a screen builder for every app. `V.wallet[0]` is Wallet's front screen, `V.wallet[1]` its second screen, and so on — 20 apps × 4 screens.
- **`css/appfaces.css`** carries one token block per app (`[data-app="wallet"]{…}`). The same components restyle themselves from those tokens, which is why no two faces look alike.
- **`index.html`** renders the catalogue: four categories, a sticky category rail, and twenty cards whose thumbnails are the apps' real front screens.
- **Each `app-face-N.html`** sets `data-face="N"` on `<body>` and boots the same registry into a stage, a four-screen rail and a side panel.

## Adding or changing a face

Everything lives in the registry, so a face is edited in one place:

1. Add or edit the entry in the `APPS` array in `js/appfaces.js`.
2. Add its theme tokens to `css/appfaces.css` (`[data-app="your-id"]{…}`).
3. Write its four screen builders into `V['your-id']`.
4. Add the id to the right category in `CATS`.
5. Add the matching `app-face-N.html` page (copy an existing one — only `data-face` and the prose change).

No build step, no dependencies, no external images — open and explore.
