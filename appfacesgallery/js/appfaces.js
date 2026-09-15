/* ============================================================
   RJ App Faces Gallery — shared registry
   One APPS table, one screen builder per app, two renderers:
   the gallery index and the single-face pages.
   ============================================================ */
(function (window, document) {
  "use strict";

  /* ============================================================
     0 · icon sprite — injected once per page
     ============================================================ */
  var SPRITE =
    '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">' +
    '<symbol id="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></symbol>' +
    '<symbol id="i-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/></symbol>' +
    '<symbol id="i-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.5S4.5 16 4.5 11A4.1 4.1 0 0 1 12 8.4 4.1 4.1 0 0 1 19.5 11c0 5-7.5 9.5-7.5 9.5Z"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></symbol>' +
    '<symbol id="i-play" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5.3v13.4l11.2-6.7z"/></symbol>' +
    '<symbol id="i-prev" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 5.3v13.4L8.6 12z"/><path d="M6 5v14" stroke="currentColor" stroke-width="2"/></symbol>' +
    '<symbol id="i-next" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M6 5.3v13.4L15.4 12z"/><path d="M18 5v14" stroke="currentColor" stroke-width="2"/></symbol>' +
    '<symbol id="i-cart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5h2.2l2.1 10.6h10.3L20 8H6"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17.5" cy="19.5" r="1.4"/></symbol>' +
    '<symbol id="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16v11H9.5L4 20.5Z"/></symbol>' +
    '<symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10.2h18"/><circle cx="16.8" cy="14.8" r="1.2"/></symbol>' +
    '<symbol id="i-star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3.6 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6L3.3 9.8l6.1-.6Z"/></symbol>' +
    '<symbol id="i-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12 20.5 3.5 13 20.5l-2.4-6.1Z"/></symbol>' +
    '<symbol id="i-coffee" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5h13V14a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 9.6h1.8a2.4 2.4 0 0 1 0 4.9H17"/><path d="M7 3.5c0 1 1 1.1 1 2.2M11 3.5c0 1 1 1.1 1 2.2"/></symbol>' +
    '<symbol id="i-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-13.7-5.6L4 7.5"/><path d="M4 4v3.5h3.5"/><path d="M4 13a8 8 0 0 0 13.7 5.6L20 16.5"/><path d="M20 20v-3.5h-3.5"/></symbol>' +
    '<symbol id="i-chevleft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5 8 12l7 7"/></symbol>' +
    '<symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3.5l1.8 4.4-2.2 1.7a12 12 0 0 0 5.8 5.8l1.7-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.4 20 4 13.6 3.5 5.6A1.5 1.5 0 0 1 5 4Z"/></symbol>' +
    '<symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5h16"/><path d="M7 19.5V11M12 19.5V5.5M17 19.5v-5"/></symbol>' +
    "</svg>";

  function injectSprite() {
    if (document.getElementById("appface-sprite")) return;
    var host = document.createElement("div");
    host.id = "appface-sprite";
    host.innerHTML = SPRITE;
    document.body.insertBefore(host, document.body.firstChild);
  }

  /* ============================================================
     1 · tiny helpers
     ============================================================ */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function ic(n) {
    return '<svg viewBox="0 0 24 24"><use href="#i-' + n + '"/></svg>';
  }
  function st() {
    return (
      '<span class="notch"></span><div class="st"><span>9:41</span>' +
      '<span class="r"><span class="sig"><i></i><i></i><i></i></span><span class="bat"></span></span></div>'
    );
  }
  function hb() {
    return '<span class="hb"></span>';
  }
  function nav(a, i) {
    return (
      '<nav class="tnav">' +
      a.pages
        .map(function (p, j) {
          return (
            '<span class="tni' +
            (j === i ? " on" : "") +
            '" data-page="' +
            j +
            '">' +
            esc(p) +
            "</span>"
          );
        })
        .join("") +
      "</nav>"
    );
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* ============================================================
     2 · categories
     ============================================================ */
  var CATS = [
    {
      id: "fin",
      icon: "▦",
      name: "Finance & Commerce",
      tag: "Money, receipts and the numbers behind them.",
      ids: ["wallet", "shop", "crypto", "coffee", "analytics"]
    },
    {
      id: "media",
      icon: "✦",
      name: "Media & Social",
      tag: "Sound, pictures and the people you share them with.",
      ids: ["music", "messages", "podcast", "camera", "social"]
    },
    {
      id: "life",
      icon: "▤",
      name: "Life & Utility",
      tag: "The everyday tools — sky, maps, dates and paper.",
      ids: ["weather", "travel", "maps", "calendar", "notes"]
    },
    {
      id: "health",
      icon: "✚",
      name: "Health & Movement",
      tag: "Body, mind, food and getting across town.",
      ids: ["fitness", "food", "meditation", "health", "ride"]
    }
  ];

  /* ============================================================
     3 · the twenty faces
     ============================================================ */
  var APPS = [
    {
      id: "wallet",
      name: "Wallet",
      style: "Finance · Dark glass",
      dark: 1,
      cat: "fin",
      level: "m",
      levelName: "Intermediate",
      pages: ["Home", "Cards", "Activity", "Profile"],
      blurb:
        "Dark-glass banking — a gradient balance card, four quick actions, stacked cards and a running activity ledger.",
      parts: [
        "Balance card",
        "Quick actions",
        "Card stack",
        "Transaction rows",
        "Avatar header"
      ],
      notes: [
        "The balance card is one gradient plus a hairline border — no image, no blur.",
        "Card stack overlaps by negative margin, so three cards read as a deck."
      ],
      swatches: ["#48e0a8", "#12a37a", "#0d1522", "#e9effb"]
    },
    {
      id: "music",
      name: "Music Player",
      style: "Audio · Neon synthwave",
      dark: 1,
      cat: "media",
      level: "m",
      levelName: "Intermediate",
      pages: ["Playing", "Library", "Playlists", "Profile"],
      blurb:
        "Neon synthwave player — grooved album art, a live waveform, gradient transport controls and a tile library.",
      parts: [
        "Album art with grooves",
        "Waveform",
        "Progress bar",
        "Transport controls",
        "Tile grid"
      ],
      notes: [
        "The album art is a gradient under repeating diagonal stripes — the grooves come free.",
        "The waveform bars are inline heights, so the shape is data you can change."
      ],
      swatches: ["#ff4fd8", "#8b5cf6", "#22d3ee", "#1d0b33"]
    },
    {
      id: "fitness",
      name: "Fitness",
      style: "Health · Brutalist",
      cat: "health",
      level: "b",
      levelName: "Beginner",
      pages: ["Today", "Workouts", "Stats", "Profile"],
      blurb:
        "Brutalist training screen — offset black boxes, a huge calorie numeral and a hard-edged weekly bar chart.",
      parts: [
        "Giant numeral",
        "Slab header",
        "Offset boxes",
        "Weekly bar chart",
        "Monospace type"
      ],
      notes: [
        "Hard shadows are offset with box-shadow instead of blur, so nothing goes soft.",
        "Monospace carries the whole voice — no display font anywhere in this face."
      ],
      swatches: ["#ff5a1f", "#0d0d0d", "#f4f2ec", "#ff7a3d"]
    },
    {
      id: "food",
      name: "Food Delivery",
      style: "Ordering · Warm playful",
      cat: "health",
      level: "b",
      levelName: "Beginner",
      pages: ["Home", "Menu", "Orders", "Profile"],
      blurb:
        "Warm ordering flow — pill search, category chips, dish cards with gradient thumbnails and live order rows.",
      parts: [
        "Pill search",
        "Category chips",
        "Dish cards",
        "Order status rows",
        "Gradient thumbnails"
      ],
      notes: [
        "Thumbnails are gradients, so a new dish needs no photography.",
        "Status pills reuse one shape with different colour pairs."
      ],
      swatches: ["#ff7a1a", "#ffb35c", "#fff8f0", "#3d2416"]
    },
    {
      id: "messages",
      name: "Messages",
      style: "Social · Clean chat",
      cat: "media",
      level: "s",
      levelName: "Starter",
      pages: ["Chats", "Thread", "Contacts", "Profile"],
      blurb:
        "Clean chat — conversation rows with unread badges, a real thread of bubbles and a message composer.",
      parts: [
        "Conversation rows",
        "Unread badge",
        "Chat bubbles",
        "Composer field",
        "Round avatars"
      ],
      notes: [
        "In and out bubbles are one component flipped — corner radius does the talking.",
        "The thread has no bottom tabs; a conversation should not look like a menu."
      ],
      swatches: ["#0b84ff", "#4aa3ff", "#f2f7fd", "#0f172a"]
    },
    {
      id: "weather",
      name: "Weather",
      style: "Utility · Sky gradient",
      cat: "life",
      level: "s",
      levelName: "Starter",
      pages: ["Now", "Hourly", "Weekly", "Places"],
      blurb:
        "Sky-gradient forecast — the temperature as the whole hero, a CSS sun and cloud, hourly and weekly bars.",
      parts: [
        "Sky gradient",
        "Sun and cloud art",
        "Hero temperature",
        "Hourly strip",
        "Weekly range bars"
      ],
      notes: [
        "The whole mood is one background gradient — there is no weather imagery at all.",
        "Sun and cloud are two divs; the cloud is a rounded rectangle over a glowing disc."
      ],
      swatches: ["#2f9bff", "#ffd48c", "#ff9a63", "#1b4f7c"]
    },
    {
      id: "travel",
      name: "Travel",
      style: "Booking · Editorial serif",
      cat: "life",
      level: "b",
      levelName: "Beginner",
      pages: ["Discover", "Search", "Trips", "Profile"],
      blurb:
        "Editorial serif booking — a photo hero, a three-up destination strip and fare rows in old-style numerals.",
      parts: [
        "Serif masthead",
        "Photo hero",
        "Three-up strip",
        "Fare rows",
        "Trip cards"
      ],
      notes: [
        "Only two typefaces: one serif for everything, letterspaced caps for labels.",
        "Fares are set like a printed price list — ruled rows, nothing boxed."
      ],
      swatches: ["#7f9a86", "#fbfaf6", "#191919", "#a9713f"]
    },
    {
      id: "shop",
      name: "Shop",
      style: "Commerce · Minimal mono",
      cat: "fin",
      level: "s",
      levelName: "Starter",
      pages: ["Shop", "Item", "Bag", "Profile"],
      blurb:
        "Minimal monochrome commerce — a lettered masthead, product frame, size selector and a plain cart ledger.",
      parts: [
        "Lettered masthead",
        "Product frame",
        "Size selector",
        "Cart lines",
        "Hairline rules"
      ],
      notes: [
        "Zero border radius. Every corner is square and every divider is a hairline.",
        "The product is a grey rectangle — the layout is doing the selling."
      ],
      swatches: ["#0a0a0a", "#8a8a8a", "#f4f4f4", "#ededed"]
    },
    {
      id: "crypto",
      name: "Crypto",
      style: "Finance · Terminal",
      dark: 1,
      cat: "fin",
      level: "a",
      levelName: "Advanced",
      pages: ["Portfolio", "Markets", "Trade", "Profile"],
      blurb:
        "Terminal finance — a bordered net-worth block, candlestick bars, monospace price rows and a buy/sell switch.",
      parts: [
        "Terminal header",
        "Candlestick bars",
        "Net-worth block",
        "Segmented control",
        "Monospace rows"
      ],
      notes: [
        "Everything is 4px radius and 1px borders — a terminal, not an app-store listing.",
        "Candlesticks are flex bars with a down-day class, so the chart reads as real data."
      ],
      swatches: ["#4ade80", "#16a34a", "#070d09", "#a6ffcb"]
    },
    {
      id: "meditation",
      name: "Meditation",
      style: "Wellness · Pastel calm",
      cat: "health",
      level: "m",
      levelName: "Intermediate",
      pages: ["Breathe", "Sessions", "Progress", "Profile"],
      blurb:
        "Pastel calm — soft blur blobs behind a conic progress ring, session cards and a week of dots.",
      parts: [
        "Blur blobs",
        "Progress ring",
        "Session cards",
        "Week dots",
        "Fully round radius"
      ],
      notes: [
        "Pill-shaped everything; nothing in this face has a hard corner.",
        "The ring is a single conic-gradient with a punched-out centre."
      ],
      swatches: ["#8b5cf6", "#b79cff", "#ffc7dd", "#f3e8ff"]
    },
    {
      id: "podcast",
      name: "Podcast",
      style: "Audio · Retro warm",
      dark: 1,
      cat: "media",
      level: "m",
      levelName: "Intermediate",
      pages: ["Now", "Episodes", "Saved", "Profile"],
      blurb:
        "Retro warm audio — a vinyl with real grooves, episode rows, an amber waveform and a scrubber.",
      parts: [
        "Vinyl disc",
        "Amber waveform",
        "Scrubber",
        "Episode rows",
        "Serif headings"
      ],
      notes: [
        "The vinyl's grooves are a repeating radial gradient — nothing else is needed to sell the disc.",
        "Amber on near-black, with a serif that carries the retro warmth."
      ],
      swatches: ["#e8a33d", "#c9761f", "#2a1113", "#f7e8d6"]
    },
    {
      id: "maps",
      name: "Maps",
      style: "Utility · Map-first",
      cat: "life",
      level: "a",
      levelName: "Advanced",
      pages: ["Map", "Route", "Places", "Profile"],
      blurb:
        "Map-first utility — a real CSS map canvas of roads, parks and water, a search bar and a bottom sheet.",
      parts: [
        "Map canvas",
        "Roads & blocks",
        "Parks and water",
        "Location puck",
        "Bottom sheet"
      ],
      notes: [
        "The map is absolutely positioned divs — roads, blocks, parks and water, all CSS.",
        "The location puck is one dot with two spread shadows for the accuracy halo."
      ],
      swatches: ["#1a73e8", "#cfe0c2", "#c5e2ef", "#eef1e9"]
    },
    {
      id: "calendar",
      name: "Calendar",
      style: "Planner · Paper",
      cat: "life",
      level: "b",
      levelName: "Beginner",
      pages: ["Month", "Day", "Agenda", "Profile"],
      blurb:
        "Paper planner — a serif month grid, a ringed today, event dots and a day agenda.",
      parts: [
        "Month grid",
        "Today ring",
        "Event dots",
        "Agenda rows",
        "Serif dates"
      ],
      notes: [
        "Today is a ring drawn with an inset border, not a filled block.",
        "Event dots hang off the cell's bottom edge so a busy week reads at a glance."
      ],
      swatches: ["#d64533", "#fdfcf7", "#1b222c", "#e7e2d6"]
    },
    {
      id: "camera",
      name: "Camera",
      style: "Media · Pro black",
      dark: 1,
      cat: "media",
      level: "a",
      levelName: "Advanced",
      pages: ["Photo", "Modes", "Gallery", "Settings"],
      blurb:
        "Pro-black viewfinder — a rule-of-thirds grid, focus reticle, EV scale, shutter and a photo grid.",
      parts: [
        "Viewfinder",
        "Rule-of-thirds grid",
        "Focus reticle",
        "EV scale",
        "Shutter button"
      ],
      notes: [
        "The thirds grid is one div with two pseudo-elements — six hairlines from a single box.",
        "Chrome is amber on black; nothing else competes with the frame."
      ],
      swatches: ["#ffd60a", "#2a3140", "#05070a", "#ffffff"]
    },
    {
      id: "health",
      name: "Health",
      style: "Vitals · Clinical",
      cat: "health",
      level: "m",
      levelName: "Intermediate",
      pages: ["Vitals", "Trends", "Records", "Profile"],
      blurb:
        "Clinical vitals — bordered cards, sparklines, a real ECG polyline and record rows.",
      parts: [
        "Vitals cards",
        "Sparklines",
        "ECG polyline",
        "Record rows",
        "Teal accent"
      ],
      notes: [
        "The ECG is a real SVG polyline — change the points and the trace changes.",
        "White cards on a faint blue ground keep the clinical tone without harshness."
      ],
      swatches: ["#0ea5a0", "#38bdb8", "#f7fafd", "#0f172a"]
    },
    {
      id: "social",
      name: "Social Feed",
      style: "Social · Story rings",
      cat: "media",
      level: "m",
      levelName: "Intermediate",
      pages: ["Feed", "Story", "Activity", "Profile"],
      blurb:
        "Story rings — conic-gradient avatars, a post photo, an engagement bar and notification rows.",
      parts: [
        "Story rings",
        "Post photo",
        "Engagement bar",
        "Notification rows",
        "Serif wordmark"
      ],
      notes: [
        "Story rings are conic gradients with a padded inner ring — one element each.",
        "The story bar is a progress strip you can advance with a single class."
      ],
      swatches: ["#ee2a7b", "#f9ce34", "#6228d7", "#ffffff"]
    },
    {
      id: "notes",
      name: "Notes",
      style: "Productivity · Legal pad",
      cat: "life",
      level: "s",
      levelName: "Starter",
      pages: ["Notes", "Note", "Tags", "Profile"],
      blurb:
        "Legal pad — ruled paper with a red margin line, checkboxes that strike through and tag chips.",
      parts: [
        "Ruled paper",
        "Red margin",
        "Checkbox tasks",
        "Tag chips",
        "Serif headings"
      ],
      notes: [
        "The paper is a repeating linear gradient locked to a 16px line height.",
        "The margin rule is one absolutely positioned 1.5px line down the left."
      ],
      swatches: ["#8a7b4e", "#fffbe8", "#efa8a8", "#3a3320"]
    },
    {
      id: "ride",
      name: "Ride",
      style: "Transport · Night sheet",
      dark: 1,
      cat: "health",
      level: "a",
      levelName: "Advanced",
      pages: ["Ride", "Driver", "Trips", "Profile"],
      blurb:
        "Night sheet — a street-grid map with a route and car marker, a dark driver sheet and ETA metrics.",
      parts: [
        "Street-grid map",
        "Route line",
        "Car marker",
        "Driver sheet",
        "ETA metrics"
      ],
      notes: [
        "The route is a rotated gradient bar; the car is a dot with a yellow glow ring.",
        "The sheet is the darkest element on screen, so the map stays the subject."
      ],
      swatches: ["#ffcc00", "#ff9f1c", "#0d1b2a", "#cfd6d2"]
    },
    {
      id: "coffee",
      name: "Coffee",
      style: "Loyalty · Kraft café",
      cat: "fin",
      level: "b",
      levelName: "Beginner",
      pages: ["Card", "Stamps", "Rewards", "Profile"],
      blurb:
        "Kraft café loyalty — a dark roast card, a dashed stamp grid and reward rows.",
      parts: [
        "Roast card",
        "Dashed stamp grid",
        "Reward rows",
        "Serif headings",
        "Warm palette"
      ],
      notes: [
        "Stamps are dashed circles until earned, then solid with a filled coffee icon.",
        "The card's glow is a radial gradient inside a clipped pseudo-element."
      ],
      swatches: ["#5c4028", "#8a5c30", "#e8c48d", "#f5e9d6"]
    },
    {
      id: "analytics",
      name: "Analytics",
      style: "Business · Dark dashboard",
      dark: 1,
      cat: "fin",
      level: "a",
      levelName: "Advanced",
      pages: ["Overview", "Traffic", "Reports", "Settings"],
      blurb:
        "Dark dashboard — KPI cards with deltas, a stacked bar chart, a conic donut and tracker rows.",
      parts: [
        "KPI cards",
        "Delta pills",
        "Bar chart",
        "Conic donut",
        "Tracker rows"
      ],
      notes: [
        "Panels sit one shade above the canvas, separated by a 1px line rather than a shadow.",
        "The donut is a conic gradient with the middle punched out — no chart library."
      ],
      swatches: ["#3f7fd6", "#34d399", "#f5b041", "#12171e"]
    }
  ];

  /* ============================================================
     4 · the screens inside every app
     ============================================================ */
  var V = {};

  /* ---------------- 01 WALLET ---------------- */
  V.wallet = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Good morning</b><span>Priya Sharma</span></div><i class="av"></i></div>' +
        '<div class="wl-card"><i class="wl-chip"></i><span class="sub">Total balance</span><b>$12,480<i>.50</i></b><span class="wl-tag">+2.4% this month</span></div>' +
        '<div class="wl-acts">' +
        '<span>' + ic("send") + 'Send</span><span>' + ic("plus") + 'Top up</span><span>' + ic("cart") + 'Pay</span><span>' + ic("user") + 'More</span>' +
        '</div>' +
        '<div class="wl-row"><i class="wl-ic"></i><div class="g"><b>Coffee house</b><span>Today · 9:12</span></div><em>-$4.50</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Salary</b><span>Sep 12</span></div><em class="in">+$3,200</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Your cards</b><span>3 active</span></div></div>' +
        '<div class="wl-stack">' +
        '<div class="wl-mini c1"><b>Visa · 4821</b></div>' +
        '<div class="wl-mini c2"><b>Mastercard · 7710</b></div>' +
        '<div class="wl-mini c3"><b>Virtual · 2299</b></div>' +
        '</div>' +
        '<div class="wl-row"><i class="wl-ic"></i><div class="g"><b>Visa · 4821</b><span>Primary</span></div><em>Freeze</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Mastercard · 7710</b><span>Travel</span></div><em>Freeze</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Add a card</span><span class="btn o">Set limits</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Activity</b><span>Last 30 days</span></div></div>' +
        '<div class="wl-acts" style="grid-template-columns:repeat(3,1fr)">' +
        '<span>' + ic("chart") + 'In</span><span>' + ic("send") + 'Out</span><span>' + ic("wallet") + 'Saved</span></div>' +
        '<div class="wl-row"><i class="wl-ic"></i><div class="g"><b>Coffee house</b><span>Today · 9:12</span></div><em>-$4.50</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Salary</b><span>Sep 12</span></div><em class="in">+$3,200</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Electricity</b><span>Sep 08</span></div><em>-$86.20</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn o">Filter</span><span class="btn o">Export</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><i class="av" style="width:44px;height:44px"></i><div style="text-align:right"><b>Priya Sharma</b><span>Gold member</span></div></div>' +
        '<div class="wl-row"><i class="wl-ic"></i><div class="g"><b>Notifications</b><span>Alerts &amp; offers</span></div><em>On</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Currency</b><span>Display</span></div><em>USD</em></div>' +
        '<div class="wl-row"><i class="wl-ic p"></i><div class="g"><b>Linked bank</b><span>Primary</span></div><em>HDFC</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit profile</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 02 MUSIC ---------------- */
  V.music = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="pd-kick" style="letter-spacing:.26em">Now playing</span>' +
        '<div class="mu-art"><i></i></div>' +
        '<div><div class="ttl">Midnight Drive</div><span class="sub">Neon Coast</span></div>' +
        '<div class="mu-wave">' + [26, 52, 78, 44, 96, 62, 34, 84, 50, 70, 28, 58].map(function (h) { return '<i style="height:' + h + '%"></i>'; }).join("") + '</div>' +
        '<div class="mu-prog"><i></i></div>' +
        '<div class="hd" style="font-size:8px;font-weight:700;color:var(--mut)"><span>1:24</span><span>3:36</span></div>' +
        '<div class="mu-ctrl"><span>' + ic("prev") + '</span><span class="mu-play">' + ic("play") + '</span><span>' + ic("next") + '</span></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b class="ttl">Library</b><span class="sub">128 tracks</span></div></div>' +
        '<div class="mu-grid">' +
        '<div class="mu-tile"><span class="im" style="background:linear-gradient(135deg,#ff4fd8,#8b5cf6)"></span><b>Neon Coast</b><span>12 tracks</span></div>' +
        '<div class="mu-tile"><span class="im" style="background:linear-gradient(135deg,#22d3ee,#7c3aed)"></span><b>Deep Violet</b><span>9 tracks</span></div>' +
        '<div class="mu-tile"><span class="im" style="background:linear-gradient(135deg,#f472b6,#facc15)"></span><b>Sunset Run</b><span>14 tracks</span></div>' +
        '<div class="mu-tile"><span class="im" style="background:linear-gradient(135deg,#34d399,#0ea5e9)"></span><b>Night Walk</b><span>7 tracks</span></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Shuffle all</span><span class="btn o">Sort</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b class="ttl">Playlists</b><span class="sub">6 lists</span></div></div>' +
        '<div class="mu-row"><i class="sq"></i><div><b>Night drive</b><span>12 tracks</span></div><em>1h 04m</em></div>' +
        '<div class="mu-row"><i class="sq" style="background:linear-gradient(145deg,#22d3ee,#7c3aed)"></i><div><b>Focus</b><span>24 tracks</span></div><em>2h 18m</em></div>' +
        '<div class="mu-row"><i class="sq" style="background:linear-gradient(145deg,#facc15,#f472b6)"></i><div><b>Morning</b><span>9 tracks</span></div><em>38m</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">New playlist</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><i class="av" style="width:44px;height:44px"></i><div style="text-align:right"><b class="ttl">Raunak</b><span class="sub">Listener</span></div></div>' +
        '<div class="mu-row"><i class="sq"></i><div><b>Plan</b><span>Subscription</span></div><em>Premium</em></div>' +
        '<div class="mu-row"><i class="sq" style="background:linear-gradient(145deg,#22d3ee,#7c3aed)"></i><div><b>Downloads</b><span>Offline</span></div><em>36</em></div>' +
        '<div class="mu-row"><i class="sq" style="background:linear-gradient(145deg,#facc15,#f472b6)"></i><div><b>Devices</b><span>Signed in</span></div><em>2</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 03 FITNESS ---------------- */
  V.fitness = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="ft-kick">Today / Wed 15</span>' +
        '<div class="ft-huge">642</div>' +
        '<div class="ft-slab"><span>Kcal burned</span><span>+12%</span></div>' +
        '<div class="tiles3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px">' +
        '<div class="ft-box"><b>8.2k</b><span>Steps</span></div>' +
        '<div class="ft-box"><b>5.4</b><span>Km</span></div>' +
        '<div class="ft-box"><b>42</b><span>Min</span></div>' +
        '</div>' +
        '<span class="ft-kick" style="margin-top:2px">Week / Goal 80%</span>' +
        '<div class="ft-bars"><i style="height:34%"></i><i style="height:58%"></i><i style="height:46%"></i><i class="o" style="height:92%"></i><i style="height:52%"></i><i style="height:68%"></i><i style="height:40%"></i></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="ft-kick">This week</span>' +
        '<div class="ft-card"><div><b>Push day</b><span>Today · 45 min</span></div><span>Start</span></div>' +
        '<div class="ft-card"><div><b>Leg day</b><span>Thu · 50 min</span></div><span>Open</span></div>' +
        '<div class="ft-card"><div><b>Pull day</b><span>Sat · 40 min</span></div><span>Open</span></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Log workout</span><span class="btn o">Plan</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="ft-kick">Last 7 days</span>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">' +
        '<div class="ft-box"><b>38.2</b><span>Km</span></div><div class="ft-box"><b>4h12</b><span>Time</span></div>' +
        '<div class="ft-box"><b>9</b><span>Day streak</span></div><div class="ft-box"><b>72</b><span>Avg HR</span></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Export</span><span class="btn o">Goals</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="ft-kick">Athlete</span>' +
        '<div class="ft-huge" style="font-size:26px;text-transform:uppercase">Raunak</div>' +
        '<div class="ft-card"><div><b>Goal</b><span>Daily</span></div><span>2200 kcal</span></div>' +
        '<div class="ft-card"><div><b>Weight</b><span>Current</span></div><span>72 kg</span></div>' +
        '<div class="ft-card"><div><b>Plan</b><span>Subscription</span></div><span>Pro</span></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 04 FOOD ---------------- */
  V.food = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Deliver to</b><span>Home · 12 min</span></div><i class="fo-pin"></i></div>' +
        '<div class="fo-search">' + ic("search") + '<i></i></div>' +
        '<div class="fo-cats"><span class="on">Burgers</span><span>Pizza</span><span>Sushi</span></div>' +
        '<div class="fo-g2">' +
        '<div class="fo-card"><span class="fo-thumb" style="background:linear-gradient(145deg,#ffd08a,#f5a623)"></span><b>Smash Burger</b><span>$8.50 · 4.8★</span></div>' +
        '<div class="fo-card"><span class="fo-thumb" style="background:linear-gradient(145deg,#ffb3a7,#f8716a)"></span><b>Salmon Sushi</b><span>$14.00 · 4.9★</span></div>' +
        '<div class="fo-card"><span class="fo-thumb" style="background:linear-gradient(145deg,#5eead4,#14b8a6)"></span><b>Green Bowl</b><span>$9.20 · 4.7★</span></div>' +
        '<div class="fo-card"><span class="fo-thumb" style="background:linear-gradient(145deg,#c4b5fd,#8b5cf6)"></span><b>Truffle Pasta</b><span>$11.40 · 4.8★</span></div>' +
        '</div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Nearby menu</b><span>24 places · 2 km</span></div></div>' +
        '<div class="fo-cats"><span class="on">Top rated</span><span>Fast</span><span>Cheap</span></div>' +
        '<div class="fo-st"><i class="fo-pin" style="width:30px;height:30px;border-radius:12px"></i><div class="g"><b>Smash Burger</b><span>Burgers · 12 min</span></div><b>$8.50</b></div>' +
        '<div class="fo-st"><i class="fo-pin" style="width:30px;height:30px;border-radius:12px;background:linear-gradient(145deg,#ffb3a7,#f8716a)"></i><div class="g"><b>Salmon Sushi</b><span>Sushi · 18 min</span></div><b>$14.0</b></div>' +
        '<div class="fo-st"><i class="fo-pin" style="width:30px;height:30px;border-radius:12px;background:linear-gradient(145deg,#5eead4,#14b8a6)"></i><div class="g"><b>Green Bowl</b><span>Salads · 15 min</span></div><b>$9.20</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><div><b>Your orders</b><span>2 active</span></div></div>' +
        '<div class="fo-st"><div class="g"><b>#4821 · Smash Burger</b><span>Arriving in 12 min</span></div><span class="wl-tag" style="background:#ffe6cf;color:#c96a12">On the way</span></div>' +
        '<div class="fo-st"><div class="g"><b>#4790 · Salmon Sushi</b><span>Yesterday · $14.00</span></div><span class="wl-tag" style="background:#e8f7ef;color:#159a63">Delivered</span></div>' +
        '<div class="fo-st"><div class="g"><b>#4612 · Green Bowl</b><span>Sep 11 · $9.20</span></div><span class="wl-tag" style="background:#e8f7ef;color:#159a63">Delivered</span></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Track order</span><span class="btn o">Reorder</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><i class="av" style="width:44px;height:44px;background:linear-gradient(145deg,#ffb35c,#ff7a1a)"></i><div style="text-align:right"><b>Raunak</b><span>2 addresses</span></div></div>' +
        '<div class="fo-st"><div class="g"><b>Address</b><span>Home</span></div><b>Bandra</b></div>' +
        '<div class="fo-st"><div class="g"><b>Payment</b><span>Default</span></div><b>Visa 4821</b></div>' +
        '<div class="fo-st"><div class="g"><b>Plan</b><span>Free delivery</span></div><b>Plus</b></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 05 MESSAGES ---------------- */
  V.messages = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="ms-top"><b class="ttl">Chats</b>' + ic("search") + '</div>' +
        '<div class="ms-row"><i class="av"></i><div class="g"><b>Aarav Mehta</b><span>Did you see the new gallery?</span></div><em>2m</em><span class="ms-badge">2</span></div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#b8e0c8,#5f9e7a)"></i><div class="g"><b>Neha Kapoor</b><span>Sending the files now</span></div><em>14m</em></div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#e6c9f0,#a06fc0)"></i><div class="g"><b>Studio group</b><span>Meera: standup at 9:30</span></div><em>1h</em><span class="ms-badge">1</span></div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#f5d3a8,#c98b4a)"></i><div class="g"><b>Kabir Rao</b><span>Thanks!</span></div><em>1d</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="ms-top">' + ic("chevleft") + '<i class="av"></i><b class="ttl" style="text-align:center">Aarav</b>' + ic("phone") + '</div>' +
        '<div class="ms-thread">' +
        '<div class="ms-bub in">Hey! Did you see the new app faces gallery?</div>' +
        '<div class="ms-bub out">Just opened it — twenty screens now.</div>' +
        '<div class="ms-bub in">The dashboard one is my favourite.</div>' +
        '<div class="ms-bub out">Mine too. Sending the link.</div>' +
        '</div>' +
        '<div class="ms-composer"><span class="f">Message</span><span class="ms-snd">' + ic("send") + '</span></div>' +
        '</div>';
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="ms-top"><b class="ttl">Contacts</b>' + ic("plus") + '</div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#b8e0c8,#5f9e7a)"></i><div class="g"><b>Neha Kapoor</b><span>Design</span></div><em>Online</em></div>' +
        '<div class="ms-row"><i class="av"></i><div class="g"><b>Arjun Rao</b><span>Development</span></div><em>12m</em></div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#e6c9f0,#a06fc0)"></i><div class="g"><b>Meera Shah</b><span>Product</span></div><em>1h</em></div>' +
        '<div class="ms-row"><i class="av" style="background:linear-gradient(145deg,#f5d3a8,#c98b4a)"></i><div class="g"><b>Kabir Rao</b><span>Client</span></div><em>1d</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="ms-top"><b class="ttl">Profile</b></div>' +
        '<div style="display:grid;justify-items:center;gap:6px;padding:6px 0"><i class="av" style="width:56px;height:56px"></i><b style="font-size:11px">Raunak Raj</b><span class="sub">@raunak</span></div>' +
        '<div class="ms-row" style="border-top:1px solid var(--line)"><div class="g"><b>Status</b><span>Visible to contacts</span></div><em>Online</em></div>' +
        '<div class="ms-row"><div class="g"><b>Read receipts</b><span>Sent &amp; seen</span></div><em>On</em></div>' +
        '<div class="ms-row"><div class="g"><b>Backup</b><span>Chat history</span></div><em>Daily</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 06 WEATHER ---------------- */
  V.weather = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="we-city"><b>Mumbai</b><span>Maharashtra</span></div>' +
        '<div class="we-big">27°</div>' +
        '<div class="we-sun"><i></i><b></b></div>' +
        '<div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">Partly cloudy</div>' +
        '<div class="we-hrs"><div><span>9AM</span>26°</div><div><span>12PM</span>29°</div><div><span>3PM</span>31°</div><div><span>6PM</span>28°</div></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="we-city"><b>Hourly</b><span>Next 12 hours</span></div>' +
        '<div class="we-hrs" style="grid-template-columns:repeat(3,1fr)">' +
        '<div><span>9 AM</span>26°</div><div><span>10 AM</span>27°</div><div><span>11 AM</span>28°</div>' +
        '<div><span>12 PM</span>29°</div><div><span>1 PM</span>30°</div><div><span>2 PM</span>31°</div></div>' +
        '<div class="we-row"><span>3 PM</span><i style="width:80%"></i><b>31°</b></div>' +
        '<div class="we-row"><span>6 PM</span><i style="width:52%"></i><b>28°</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="we-city"><b>This week</b><span>7 days</span></div>' +
        '<div class="we-row"><span>Mon</span><i style="width:64%"></i><b>28° / 22°</b></div>' +
        '<div class="we-row"><span>Tue</span><i style="width:78%"></i><b>30° / 23°</b></div>' +
        '<div class="we-row"><span>Wed</span><i style="width:70%"></i><b>29° / 22°</b></div>' +
        '<div class="we-row"><span>Thu</span><i style="width:58%"></i><b>27° / 21°</b></div>' +
        '<div class="we-row"><span>Fri</span><i style="width:82%"></i><b>31° / 24°</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="we-city"><b>Places</b><span>4 saved</span></div>' +
        '<div class="we-hrs" style="grid-template-columns:repeat(2,1fr)">' +
        '<div><span>Mumbai</span>27°</div><div><span>Pune</span>24°</div>' +
        '<div><span>Delhi</span>33°</div><div><span>Bengaluru</span>25°</div></div>' +
        '<div class="we-row"><span>Home</span><i style="width:70%"></i><b>27°</b></div>' +
        '<div class="we-row"><span>Office</span><i style="width:62%"></i><b>26°</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 07 TRAVEL ---------------- */
  V.travel = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="tr-mast"><b>Voyage</b><span>Issue 07</span></div>' +
        '<div class="tr-hero"><b>Winter</b><span>Kyoto</span></div>' +
        '<span class="sub">Japan · 7 nights</span>' +
        '<div class="tr-strip">' +
        '<figure><span class="im" style="background:linear-gradient(160deg,#b9c9b3,#5f7a68)"></span><figcaption>Oslo</figcaption></figure>' +
        '<figure><span class="im" style="background:linear-gradient(160deg,#e5c9a8,#a9713f)"></span><figcaption>Cairo</figcaption></figure>' +
        '<figure><span class="im" style="background:linear-gradient(160deg,#a9c3d6,#4c6b86)"></span><figcaption>Lima</figcaption></figure>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Read the guide</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="tr-mast"><b>Search</b><span>Any week</span></div>' +
        '<div class="tr-res"><b>Kyoto, Japan</b><em>from $840</em></div>' +
        '<div class="tr-res"><b>Oslo, Norway</b><em>from $720</em></div>' +
        '<div class="tr-res"><b>Cairo, Egypt</b><em>from $610</em></div>' +
        '<div class="tr-res"><b>Lima, Peru</b><em>from $980</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Search stays</span><span class="btn o">Filters</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="tr-mast"><b>Your trips</b><span>2 upcoming</span></div>' +
        '<div class="tr-trip"><b>Kyoto</b><span>7 nights · Mar 12</span></div>' +
        '<div class="tr-trip"><b>Oslo</b><span>4 nights · Jun 03</span></div>' +
        '<div class="tr-trip"><b>Lima</b><span>9 nights · past</span></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Manage booking</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="tr-mast"><b>Traveller</b><span>Silver</span></div>' +
        '<div class="tr-res"><b>Raunak Raj</b><em>India</em></div>' +
        '<div class="tr-res"><b>Points</b><em>4,820</em></div>' +
        '<div class="tr-res"><b>Tier</b><em>Silver</em></div>' +
        '<div class="tr-res"><b>Saved guides</b><em>12</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit profile</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 08 SHOP ---------------- */
  V.shop = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="sh-top"><span>Shop</span>' + ic("search") + '</div>' +
        '<div class="sh-big"><i></i></div>' +
        '<div class="sh-line"><span>Field Jacket</span><em>$180</em></div>' +
        '<div class="sh-grid">' +
        '<figure><span class="im"><i></i></span><figcaption>Tee</figcaption></figure>' +
        '<figure><span class="im"><i></i></span><figcaption>Cap</figcaption></figure>' +
        '<figure><span class="im"><i></i></span><figcaption>Boot</figcaption></figure>' +
        '</div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="sh-top"><span>Field Jacket</span><em style="font-style:normal">$180</em></div>' +
        '<div class="sh-big" style="aspect-ratio:1/1"><i></i></div>' +
        '<span class="sub">Select size</span>' +
        '<div class="sh-sizes"><span>S</span><span class="on">M</span><span>L</span><span>XL</span></div>' +
        '<div class="sh-line"><span>Colour</span><em>Olive</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Add to bag</span><span class="btn o">Save</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="sh-top"><span>Your bag</span><em style="font-style:normal">2</em></div>' +
        '<div class="sh-line"><span>Field Jacket · M</span><em>$180</em></div>' +
        '<div class="sh-line"><span>Canvas Tee · M</span><em>$45</em></div>' +
        '<div class="sh-line"><span>Shipping</span><em>Free</em></div>' +
        '<div class="sh-line"><span>Total</span><em>$225</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Checkout</span><span class="btn o">Clear</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="sh-top"><span>Account</span>' + ic("user") + '</div>' +
        '<div class="sh-line"><span>Raunak Raj</span><em>Member</em></div>' +
        '<div class="sh-line"><span>Orders</span><em>6</em></div>' +
        '<div class="sh-line"><span>Address</span><em>Bandra</em></div>' +
        '<div class="sh-line"><span>Card</span><em>Visa 4821</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 09 CRYPTO ---------------- */
  V.crypto = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cr-head"><span>Portfolio</span><span>3 assets</span></div>' +
        '<div class="cr-worth"><span>Net worth</span><b>$8,214.90</b><i>+5.8% today</i></div>' +
        '<div class="cr-cs">' + [32, 54, 44, 70, 36, 62, 88, 50, 74, 96].map(function (h, k) { return '<i class="' + (k % 3 === 2 ? "dn" : "") + '" style="height:' + h + '%"></i>'; }).join("") + '</div>' +
        '<div class="cr-row"><b>BTC</b><span>42,180</span><b class="up">+2.41%</b></div>' +
        '<div class="cr-row"><b>ETH</b><span>2,240</span><b class="up">+1.08%</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cr-head"><span>Markets</span><span>24h</span></div>' +
        '<div class="cr-row"><b>BTC</b><span>42,180</span><b class="up">+2.41%</b></div>' +
        '<div class="cr-row"><b>ETH</b><span>2,240</span><b class="up">+1.08%</b></div>' +
        '<div class="cr-row"><b>SOL</b><span>118.40</span><b class="dn">-0.62%</b></div>' +
        '<div class="cr-row"><b>ADA</b><span>0.482</span><b class="up">+3.10%</b></div>' +
        '<div class="cr-row"><b>DOT</b><span>6.14</span><b class="dn">-1.24%</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cr-head"><span>Trade BTC</span><span>Market</span></div>' +
        '<div class="cr-seg"><span>Buy</span><span class="on">Sell</span><span>Swap</span></div>' +
        '<div class="cr-worth"><span>Amount</span><b>0.05000</b><i>≈ $2,109.00</i></div>' +
        '<div class="cr-row"><span>Price</span><b>42,180</b></div>' +
        '<div class="cr-row"><span>Fee</span><b>$2.10</b></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Confirm order</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cr-head"><span>Profile</span><span>Level 2</span></div>' +
        '<div class="cr-row"><b>KYC</b><span>Identity</span><b class="up">Verified</b></div>' +
        '<div class="cr-row"><b>2FA</b><span>Security</span><b class="up">On</b></div>' +
        '<div class="cr-row"><b>Currency</b><span>Display</span><b>USD</b></div>' +
        '<div class="cr-row"><b>Withdrawals</b><span>Limit</span><b>$10,000</b></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Verify</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 10 MEDITATION ---------------- */
  V.meditation = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<i class="md-blob" style="left:-30px;top:34%;width:120px;height:120px;background:#c9b6ff"></i>' +
        '<i class="md-blob" style="right:-24px;top:8%;width:96px;height:96px;background:#ffc7dd"></i>' +
        '<div class="hd" style="position:relative;z-index:1"><b class="ttl">Breathe</b><span class="sub">4-7-8</span></div>' +
        '<div class="md-ring"><b>04:32</b></div>' +
        '<div class="md-mid"><b>Inhale slowly</b><span>Cycle 3 of 6</span></div>' +
        '<span class="sp"></span>' +
        '<div class="btns" style="justify-content:center;position:relative;z-index:1"><span class="btn p">Start</span><span class="btn o">Sound</span></div>' +
        '</div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<i class="md-blob" style="right:-24px;top:6%;width:110px;height:110px;background:#c9b6ff"></i>' +
        '<div class="hd" style="position:relative;z-index:1"><b class="ttl">Sessions</b><span class="sub">12 guided</span></div>' +
        '<div class="md-card" style="position:relative;z-index:1"><i class="im"></i><div><b>Evening wind-down</b><span>12 min · Deep</span></div></div>' +
        '<div class="md-card" style="position:relative;z-index:1"><i class="im" style="background:linear-gradient(145deg,#8fd6ff,#4a9bff)"></i><div><b>Morning calm</b><span>8 min · Focus</span></div></div>' +
        '<div class="md-card" style="position:relative;z-index:1"><i class="im" style="background:linear-gradient(145deg,#ffc7dd,#f472b6)"></i><div><b>Deep focus</b><span>20 min · Silent</span></div></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<i class="md-blob" style="left:-30px;bottom:10%;width:120px;height:120px;background:#bcd6ff"></i>' +
        '<div class="hd" style="position:relative;z-index:1"><b class="ttl">Progress</b><span class="sub">September</span></div>' +
        '<div style="position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
        '<div class="md-card" style="margin:0"><div><b>9 days</b><span>Streak</span></div></div>' +
        '<div class="md-card" style="margin:0"><div><b>184 min</b><span>Total</span></div></div>' +
        '</div>' +
        '<span class="sub" style="position:relative;z-index:1;margin-top:4px">This week</span>' +
        '<div class="md-dots" style="position:relative;z-index:1">' + [1, 1, 1, 1, 1, 0, 0].map(function (v) { return '<i class="' + (v ? "on" : "") + '"></i>'; }).join("") + '</div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<i class="md-blob" style="right:-24px;top:10%;width:110px;height:110px;background:#ffc7dd"></i>' +
        '<div style="position:relative;z-index:1;display:grid;justify-items:center;gap:6px;padding:4px 0">' +
        '<i class="av" style="width:56px;height:56px"></i><b class="ttl">Raunak</b><span class="sub">Calm member</span></div>' +
        '<div class="md-card" style="position:relative;z-index:1"><div><b>Daily goal</b><span>Reminder 21:00</span></div><b>10 min</b></div>' +
        '<div class="md-card" style="position:relative;z-index:1"><div><b>Plan</b><span>Renews in March</span></div><b>Annual</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 11 PODCAST ---------------- */
  V.podcast = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<span class="pd-kick">Episode 42</span>' +
        '<div class="pd-disc"></div>' +
        '<div class="pd-pt"><b>Design systems, slowly</b><span>With Aarav Mehta</span></div>' +
        '<div class="pd-wave">' + [40, 72, 96, 58, 84, 46, 70, 38, 62, 30, 54, 26].map(function (h, k) { return '<i class="' + (k < 6 ? "on" : "") + '" style="height:' + h + '%"></i>'; }).join("") + '</div>' +
        '<div class="pd-bar"><i></i></div>' +
        '<div class="pd-ctrl"><span>' + ic("prev") + '</span><span class="pd-play">' + ic("play") + '</span><span>' + ic("next") + '</span></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Episodes</b><span class="sub">42 total</span></div>' +
        '<div class="pd-ep"><b>42</b><span>Design systems, slowly</span><em>42 min</em></div>' +
        '<div class="pd-ep"><b>41</b><span>The case for less motion</span><em>38 min</em></div>' +
        '<div class="pd-ep"><b>40</b><span>Type at small sizes</span><em>51 min</em></div>' +
        '<div class="pd-ep"><b>39</b><span>Build vs buy</span><em>44 min</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Saved</b><span class="sub">8 episodes</span></div>' +
        '<div class="pd-ep"><b>40</b><span>Type at small sizes</span><em>Saved</em></div>' +
        '<div class="pd-ep"><b>33</b><span>Colour in the dark</span><em>Saved</em></div>' +
        '<div class="pd-ep"><b>28</b><span>Grids that hold</span><em>Saved</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Download all</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><i class="av" style="width:44px;height:44px;background:linear-gradient(145deg,#e8a33d,#c9761f)"></i><div style="text-align:right"><b class="ttl">Raunak</b><span class="sub">Listener</span></div></div>' +
        '<div class="pd-ep"><b>Subs</b><span>Shows followed</span><em>6</em></div>' +
        '<div class="pd-ep"><b>Time</b><span>Listened</span><em>128 h</em></div>' +
        '<div class="pd-ep"><b>Auto</b><span>Play next</span><em>On</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 12 MAPS ---------------- */
  V.maps = [
    function (a, i) {
      return st() + '<i class="mp-me"></i><div class="bd">' +
        '<div class="mp-search">' + ic("search") + '<span>Search along the route</span></div>' +
        '<div class="mp-sheet"><span class="grab"></span>' +
        '<div><b style="font-size:11px">Bandra Kurla Complex</b><span class="sub" style="margin-top:2px">22 min · 8.4 km · arrive 9:42</span></div>' +
        '<div class="mp-go">Start navigation</div></div>' +
        '</div>' + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:9px 13px 7px"><b style="font-size:11px">Route to BKC</b><span class="sub" style="display:block;margin-top:2px">3 options</span></div>' +
        '<div class="mp-opt on"><i style="width:22px;height:22px;border-radius:7px;background:#1a73e8;flex:none"></i><div><b>Fastest</b><span>Via Sea Link</span></div><em>22 min</em></div>' +
        '<div class="mp-opt"><i style="width:22px;height:22px;border-radius:7px;background:#cfe0c2;flex:none"></i><div><b>Shortest</b><span>8.4 km</span></div><em>26 min</em></div>' +
        '<div class="mp-opt"><i style="width:22px;height:22px;border-radius:7px;background:#c5e2ef;flex:none"></i><div><b>No tolls</b><span>Avoids Sea Link</span></div><em>31 min</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn p">Start</span><span class="btn o">Alternate</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:9px 13px 7px"><b style="font-size:11px">Saved places</b><span class="sub" style="display:block;margin-top:2px">6 pins</span></div>' +
        '<div class="mp-opt"><i style="width:22px;height:22px;border-radius:7px;background:#cfe0c2;flex:none"></i><div><b>Home</b><span>Bandra West</span></div><em>Pin</em></div>' +
        '<div class="mp-opt"><i style="width:22px;height:22px;border-radius:7px;background:#c5e2ef;flex:none"></i><div><b>Office</b><span>BKC</span></div><em>Pin</em></div>' +
        '<div class="mp-opt"><i style="width:22px;height:22px;border-radius:7px;background:#ffd9cf;flex:none"></i><div><b>Gym</b><span>Khar</span></div><em>Pin</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn p">Add place</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:9px 13px 7px"><b style="font-size:11px">Raunak Raj</b><span class="sub" style="display:block;margin-top:2px">Local guide</span></div>' +
        '<div class="mp-opt"><div><b>Offline maps</b><span>Downloaded</span></div><em>2</em></div>' +
        '<div class="mp-opt"><div><b>Reviews</b><span>Written</span></div><em>14</em></div>' +
        '<div class="mp-opt"><div><b>Units</b><span>Distance</span></div><em>km</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 13 CALENDAR ---------------- */
  V.calendar = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cd-head"><b>September</b><span>2026</span></div>' +
        '<div class="cd-grid"><span class="dw">M</span><span class="dw">T</span><span class="dw">W</span><span class="dw">T</span><span class="dw">F</span><span class="dw">S</span><span class="dw">S</span>' +
        '<span class="cd-cell mute"></span><span class="cd-cell">1</span><span class="cd-cell">2</span><span class="cd-cell">3</span><span class="cd-cell">4</span><span class="cd-cell">5</span><span class="cd-cell">6</span>' +
        '<span class="cd-cell">7</span><span class="cd-cell">8</span><span class="cd-cell dot">9</span><span class="cd-cell">10</span><span class="cd-cell">11</span><span class="cd-cell">12</span><span class="cd-cell">13</span>' +
        '<span class="cd-cell">14</span><span class="cd-cell now">15</span><span class="cd-cell">16</span><span class="cd-cell dot">17</span><span class="cd-cell">18</span><span class="cd-cell">19</span><span class="cd-cell">20</span>' +
        '<span class="cd-cell">21</span><span class="cd-cell">22</span><span class="cd-cell">23</span><span class="cd-cell">24</span><span class="cd-cell">25</span><span class="cd-cell">26</span><span class="cd-cell mute">27</span>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">New event</span><span class="btn o">Today</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cd-head"><b>Wed 15 Sep</b><span>3 events</span></div>' +
        '<div class="cd-ev"><b>09:30</b><div><span>Studio standup</span><em>Design · 30 min</em></div></div>' +
        '<div class="cd-ev"><b>15:00</b><div><span>Design review</span><em>Client · 1 h</em></div></div>' +
        '<div class="cd-ev"><b>18:30</b><div><span>Ship gallery v2</span><em>Release · 45 min</em></div></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Add event</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cd-head"><b>Agenda</b><span>This week</span></div>' +
        '<div class="cd-ev"><b>Thu</b><div><span>Client call</span><em>11:00 · Zoom</em></div></div>' +
        '<div class="cd-ev"><b>Fri</b><div><span>Retro</span><em>16:00 · Studio</em></div></div>' +
        '<div class="cd-ev"><b>Mon</b><div><span>Sprint start</span><em>09:30 · Studio</em></div></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn o">Filter</span><span class="btn o">Print</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cd-head"><b>Raunak</b><span>Owner</span></div>' +
        '<div class="cd-ev"><b>Zone</b><div><span>Time zone</span><em>IST · GMT +5:30</em></div></div>' +
        '<div class="cd-ev"><b>Week</b><div><span>Starts on</span><em>Monday</em></div></div>' +
        '<div class="cd-ev"><b>Alerts</b><div><span>Notifications</span><em>On · 10 min before</em></div></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 14 CAMERA ---------------- */
  V.camera = [
    function (a, i) {
      return st() + '<i class="cm-focus"></i><div class="bd">' +
        '<div class="cm-bar"><span style="color:#ffd60a">RAW</span><span>1/125 · f1.8 · ISO 200</span></div>' +
        '<span class="sp"></span>' +
        '<div class="cm-exp"><span>EV</span><i></i><span>+0.3</span></div>' +
        '<div class="cm-modes"><span class="on">PHOTO</span><span>VIDEO</span><span>PORTRAIT</span></div>' +
        '<div class="cm-shut"><i class="cm-thumb"></i><i class="cm-btn"></i><i class="cm-flip">' + ic("flip") + '</i></div>' +
        '</div>' + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cm-bar"><span style="color:#ffd60a">MODES</span><span>4 available</span></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">' +
        '<span class="ft-box" style="border-color:#ffd60a;box-shadow:none;background:rgba(255,214,10,.12);color:#fff"><b style="color:#ffd60a">PHOTO</b><span style="color:rgba(255,255,255,.6)">Default</span></span>' +
        '<span class="ft-box" style="border-color:var(--line);box-shadow:none;background:rgba(255,255,255,.05);color:#fff"><b>VIDEO</b><span style="color:rgba(255,255,255,.6)">4K 60</span></span>' +
        '<span class="ft-box" style="border-color:var(--line);box-shadow:none;background:rgba(255,255,255,.05);color:#fff"><b>PORTRAIT</b><span style="color:rgba(255,255,255,.6)">f1.8</span></span>' +
        '<span class="ft-box" style="border-color:var(--line);box-shadow:none;background:rgba(255,255,255,.05);color:#fff"><b>NIGHT</b><span style="color:rgba(255,255,255,.6)">Long exp</span></span>' +
        '</div>' +
        '<span class="cm-modes" style="margin-top:auto">Set default · Edit</span>' +
        '</div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cm-bar"><span style="color:#ffd60a">GALLERY</span><span>24 shots</span></div>' +
        '<div class="cm-grid3">' + new Array(9).join("<span></span>") + '</div>' +
        '<span class="sp"></span>' +
        '<div class="cm-panel" style="background:none;border-top:none"><div class="cm-row"><span>IMG_4821</span><em>Today</em></div><div class="cm-row"><span>IMG_4820</span><em>Today</em></div></div>' +
        '</div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cm-bar"><span style="color:#ffd60a">SETTINGS</span><span>Camera app</span></div>' +
        '<div class="cm-panel" style="background:none;border-top:none;padding:0">' +
        '<div class="cm-row"><span>HDR</span><em>Auto</em></div>' +
        '<div class="cm-row"><span>Grid</span><em>On</em></div>' +
        '<div class="cm-row"><span>Storage</span><em>12 GB free</em></div>' +
        '<div class="cm-row"><span>Watermark</span><em>Off</em></div>' +
        '</div>' +
        '<span class="sp"></span>' +
        '<div class="cm-panel" style="background:none;border-top:none"><div class="cm-row"><span>Save</span><em>Reset</em></div></div>' +
        '</div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 15 HEALTH ---------------- */
  V.health = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Vitals</b><span class="sub">Today</span></div>' +
        '<div class="hl-g2">' +
        '<div class="hl-card"><span class="l2">Heart rate</span><b>72 <i>bpm</i></b><div class="hl-spark">' + [40, 66, 44, 78, 52, 62].map(function (h) { return '<i style="height:' + h + '%;background:#0ea5a0"></i>'; }).join("") + '</div></div>' +
        '<div class="hl-card"><span class="l2">SpO₂</span><b>98 <i>%</i></b><div class="hl-spark">' + [62, 58, 74, 66, 80, 70].map(function (h) { return '<i style="height:' + h + '%;background:#3b82f6"></i>'; }).join("") + '</div></div>' +
        '</div>' +
        '<div class="hl-g2">' +
        '<div class="hl-card"><span class="l2">Sleep</span><b>7h 20m</b></div>' +
        '<div class="hl-card"><span class="l2">Steps</span><b>8.2k</b></div>' +
        '</div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Trends</b><span class="sub">Last 30 days</span></div>' +
        '<div class="hl-ecg"><div class="t2"><span>Resting heart rate</span><span>Normal</span></div>' +
        '<svg viewBox="0 0 120 32" preserveAspectRatio="none"><polyline points="0,20 12,18 22,21 32,14 44,17 56,11 68,15 80,9 92,13 104,10 120,12" fill="none" stroke="#0ea5a0" stroke-width="1.6"/></svg></div>' +
        '<div class="hl-rec"><i class="ic" style="background:#e6f0fb"></i><div><b>Sleep average</b><span>7h 20m per night</span></div><b style="margin-left:auto;font-size:9px">+4%</b></div>' +
        '<div class="hl-rec"><i class="ic" style="background:#fdf1e3"></i><div><b>Steps average</b><span>8.4k per day</span></div><b style="margin-left:auto;font-size:9px">+11%</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Records</b><span class="sub">6 documents</span></div>' +
        '<div class="hl-rec"><i class="ic"></i><div><b>Blood test</b><span>Aug 2026 · Lab</span></div><b style="margin-left:auto;font-size:8px;color:var(--mut)">PDF</b></div>' +
        '<div class="hl-rec"><i class="ic" style="background:#fdf1e3"></i><div><b>ECG</b><span>Jul 2026 · Cardiology</span></div><b style="margin-left:auto;font-size:8px;color:var(--mut)">PDF</b></div>' +
        '<div class="hl-rec"><i class="ic" style="background:#e6f0fb"></i><div><b>Chest X-ray</b><span>May 2026 · Imaging</span></div><b style="margin-left:auto;font-size:8px;color:var(--mut)">IMG</b></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Upload</span><span class="btn o">Share</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><i class="av" style="width:44px;height:44px;background:linear-gradient(145deg,#38bdb8,#0ea5a0)"></i><div style="text-align:right"><b class="ttl">Raunak Raj</b><span class="sub">Patient</span></div></div>' +
        '<div class="hl-rec"><div><b>Age</b><span>Date of birth</span></div><b style="margin-left:auto;font-size:9px">29</b></div>' +
        '<div class="hl-rec"><div><b>Blood group</b><span>Recorded</span></div><b style="margin-left:auto;font-size:9px">O+</b></div>' +
        '<div class="hl-rec"><div><b>Doctor</b><span>Primary care</span></div><b style="margin-left:auto;font-size:9px">Dr. Rao</b></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 16 SOCIAL ---------------- */
  V.social = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="so-top"><b>Feed</b><span class="ic">' + ic("heart") + ic("send") + '</span></div>' +
        '<div class="so-rings">' +
        '<div><span class="so-ring"><i><em></em></i></span>Neha</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#b8e0c8,#5f9e7a)"></em></i></span>Arjun</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#e6c9f0,#a06fc0)"></em></i></span>Meera</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#f5d3a8,#c98b4a)"></em></i></span>Kabir</div>' +
        '</div>' +
        '<div class="so-pu"><i class="av"></i><div><b>neha.builds</b><span>Kyoto, Japan</span></div></div>' +
        '<div class="so-photo"></div>' +
        '<div class="so-acts">' + ic("heart") + ic("chat") + ic("send") + '</div>' +
        '<div class="so-cap">2,418 likes · Morning light on the old streets.</div>' +
        '</div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="so-top"><b>Stories</b><span class="ic">' + ic("plus") + '</span></div>' +
        '<div class="so-story"><span class="so-bars"><i class="on"></i><i></i><i></i></span><b>Neha · Kyoto</b></div>' +
        '<div class="so-rings" style="border-bottom:none;padding-top:9px">' +
        '<div><span class="so-ring"><i><em></em></i></span>Neha</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#b8e0c8,#5f9e7a)"></em></i></span>Arjun</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#e6c9f0,#a06fc0)"></em></i></span>Meera</div>' +
        '<div><span class="so-ring"><i><em style="background:linear-gradient(145deg,#f5d3a8,#c98b4a)"></em></i></span>Kabir</div>' +
        '</div>' +
        '</div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="so-top"><b>Activity</b><span class="ic">' + ic("heart") + '</span></div>' +
        '<div class="so-notif"><i class="av"></i><div><b>Neha liked your post</b><span>1h ago</span></div></div>' +
        '<div class="so-notif"><i class="av" style="background:linear-gradient(145deg,#b8e0c8,#5f9e7a)"></i><div><b>Arjun started following you</b><span>3h ago</span></div></div>' +
        '<div class="so-notif"><i class="av" style="background:linear-gradient(145deg,#e6c9f0,#a06fc0)"></i><div><b>Meera commented: “love this”</b><span>5h ago</span></div></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="so-top"><b>Profile</b><span class="ic">' + ic("plus") + '</span></div>' +
        '<div style="display:grid;justify-items:center;gap:6px;padding:4px 0 10px"><span class="so-ring" style="width:60px;height:60px"><i><em></em></i></span><b style="font-size:11px">raunak.raj</b><span class="sub">1.2k followers</span></div>' +
        '<div class="tiles" style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:0 14px">' +
        '<div style="text-align:center"><b style="display:block;font-size:12px">84</b><span class="sub">Posts</span></div>' +
        '<div style="text-align:center"><b style="display:block;font-size:12px">312</b><span class="sub">Following</span></div>' +
        '<div style="text-align:center"><b style="display:block;font-size:12px">96</b><span class="sub">Saved</span></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 14px"><span class="btn p">Edit profile</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 17 NOTES ---------------- */
  V.notes = [
    function (a, i) {
      return st() + '<div class="bd"><i class="nt-margin"></i>' +
        '<div class="nt-head"><b>Notes</b><span>12 notes</span></div>' +
        '<div class="nt-line">Gallery ideas</div>' +
        '<div class="nt-line" style="color:#a08f5e">Client kickoff</div>' +
        '<div class="nt-line">Shopping list</div>' +
        '<div class="nt-line" style="color:#a08f5e">Colour tests</div>' +
        '<div class="nt-line">Type pairings</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">New note</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd"><i class="nt-margin"></i>' +
        '<div class="nt-head"><b>Gallery ideas</b><span>Edited today</span></div>' +
        '<div class="nt-chk">' +
        '<div class="done"><b></b><span>Twenty faces, all different</span></div>' +
        '<div class="done"><b></b><span>Ship before the review</span></div>' +
        '<div><b></b><span>Write the case study</span></div>' +
        '<div><b></b><span>Post to the gallery</span></div>' +
        '<div><b></b><span>Ask Raunak for feedback</span></div>' +
        '<div><b></b><span>Send the link</span></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Save</span><span class="btn o">Share</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd"><i class="nt-margin"></i>' +
        '<div class="nt-head"><b>Tags</b><span>6 tags</span></div>' +
        '<div class="nt-tags"><span>Work</span><span>Studio</span><span>Ideas</span><span>Personal</span><span>Shopping</span><span>Archive</span></div>' +
        '<div class="nt-line" style="margin-top:8px">Work · 4 notes</div>' +
        '<div class="nt-line" style="color:#a08f5e">Studio · 3 notes</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">New tag</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd"><i class="nt-margin"></i>' +
        '<div class="nt-head"><b>Raunak</b><span>12 notes</span></div>' +
        '<div class="nt-line">Storage · 1.2 GB</div>' +
        '<div class="nt-line" style="color:#a08f5e">Sync · On</div>' +
        '<div class="nt-line">Font · Default</div>' +
        '<div class="nt-line" style="color:#a08f5e">Sort · Newest</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 18 RIDE ---------------- */
  V.ride = [
    function (a, i) {
      return st() + '<i class="rd-route"></i><i class="rd-car"></i><div class="bd">' +
        '<div class="rd-sheet"><span class="rd-grab"></span>' +
        '<div class="rd-drv"><i class="av"></i><div><b>Ravi · RJ 4821</b><span>Toyota Prius · 4.9★</span></div></div>' +
        '<div class="rd-eta"><div>Arrives<b>3 min</b></div><div>Trip<b>18 min</b></div><div>Fare<b>$12.40</b></div></div>' +
        '<div class="rd-go">Confirm pickup</div></div>' +
        '</div>' + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:10px 13px 8px;display:flex;align-items:center;gap:10px">' +
        '<i class="av" style="width:42px;height:42px;background:linear-gradient(145deg,#4a5a72,#22303f)"></i>' +
        '<div><b style="font-size:11px">Ravi Kumar</b><span class="sub" style="display:block;margin-top:2px">2,140 trips · 4.9★</span></div></div>' +
        '<div class="rd-trip"><div><b>Toyota Prius</b><span>White · MH 02 AB 4821</span></div><em>4 seats</em></div>' +
        '<div class="rd-trip"><div><b>Pickup</b><span>Bandra West · Gate 2</span></div><em>3 min</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn p">Call driver</span><span class="btn o">Message</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:10px 13px 8px"><b style="font-size:11px">Your trips</b><span class="sub" style="display:block;margin-top:2px">8 rides this month</span></div>' +
        '<div class="rd-trip"><div><b>Bandra → BKC</b><span>Today · 18 min</span></div><em>$12.40</em></div>' +
        '<div class="rd-trip"><div><b>Home → Airport</b><span>Sep 09 · 52 min</span></div><em>$28.00</em></div>' +
        '<div class="rd-trip"><div><b>Khar → Bandra</b><span>Sep 06 · 14 min</span></div><em>$9.10</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn o">Receipts</span><span class="btn o">Support</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div style="background:#fff;padding:10px 13px 8px"><b style="font-size:11px">Raunak Raj</b><span class="sub" style="display:block;margin-top:2px">Rider since 2023</span></div>' +
        '<div class="rd-trip"><div><b>Payment</b><span>Default method</span></div><em>Visa 4821</em></div>' +
        '<div class="rd-trip"><div><b>Home</b><span>Saved address</span></div><em>Bandra</em></div>' +
        '<div class="rd-trip"><div><b>Plan</b><span>Ride pass</span></div><em>Plus</em></div>' +
        '<span class="sp"></span><div class="btns" style="padding:0 12px 10px"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 19 COFFEE ---------------- */
  V.coffee = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cf-head"><b>Aurora Coffee</b><span>Gold</span></div>' +
        '<div class="cf-card"><span>Free drinks earned</span><b>03</b><em>Member since 2024</em></div>' +
        '<span class="sub">Stamp card · 6 of 10</span>' +
        '<div class="cf-stamps">' + [1, 1, 1, 1, 1, 1, 0, 0, 0, 0].map(function (v) { return '<span class="cf-stamp' + (v ? " on" : "") + '">' + (v ? ic("coffee") : "") + '</span>'; }).join("") + '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Scan to earn</span><span class="btn o">Top up</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cf-head"><b>Stamp card</b><span>6 / 10</span></div>' +
        '<div class="cf-stamps">' + [1, 1, 1, 1, 1, 1, 0, 0, 0, 0].map(function (v) { return '<span class="cf-stamp' + (v ? " on" : "") + '">' + (v ? ic("coffee") : "") + '</span>'; }).join("") + '</div>' +
        '<div class="cf-reward"><i class="ic"></i><div><b>Flat white</b><span>Sep 14 · Khar</span></div><em>+1</em></div>' +
        '<div class="cf-reward"><i class="ic"></i><div><b>Cold brew</b><span>Sep 11 · Khar</span></div><em>+1</em></div>' +
        '<div class="cf-reward"><i class="ic"></i><div><b>Espresso</b><span>Sep 08 · Bandra</span></div><em>+1</em></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cf-head"><b>Rewards</b><span>3 available</span></div>' +
        '<div class="cf-reward"><i class="ic"></i><div><b>Free drink</b><span>Any size</span></div><em>Ready</em></div>' +
        '<div class="cf-reward"><i class="ic" style="background:linear-gradient(145deg,#a8935f,#8a7b4e)"></i><div><b>Pastry 20%</b><span>On any bake</span></div><em>Ready</em></div>' +
        '<div class="cf-reward"><i class="ic" style="background:#e0d3bd"></i><div><b>Beans 10%</b><span>250 g bags</span></div><em>Locked</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Use reward</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="cf-head"><b>Raunak</b><span>Gold</span></div>' +
        '<div class="cf-reward"><div><b>Tier</b><span>Member level</span></div><em>Gold</em></div>' +
        '<div class="cf-reward"><div><b>Points</b><span>This year</span></div><em>1,240</em></div>' +
        '<div class="cf-reward"><div><b>Nearest</b><span>Open till 11 pm</span></div><em>Khar</em></div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Edit</span><span class="btn o">Sign out</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ---------------- 20 ANALYTICS ---------------- */
  V.analytics = [
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Overview</b><span class="sub">Last 7 days</span></div>' +
        '<div class="an-kpi">' +
        '<div><span class="l3">Visitors</span><b>24,812</b><em class="an-up">+18.2%</em></div>' +
        '<div><span class="l3">Revenue</span><b>$9.2k</b><em class="an-up">+6.4%</em></div>' +
        '</div>' +
        '<div class="an-panel"><div class="ct"><span>Traffic</span><span>Weekly</span></div>' +
        '<div class="an-bars"><i style="height:40%"></i><i class="a" style="height:58%"></i><i style="height:46%"></i><i class="b" style="height:72%"></i><i style="height:62%"></i><i class="c" style="height:84%"></i><i class="a" style="height:96%"></i></div></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Traffic</b><span class="sub">By source</span></div>' +
        '<div class="an-panel"><div class="an-donut"></div></div>' +
        '<div class="an-row"><span style="width:46px">Organic</span><i class="tk"><i style="width:88%"></i></i><b>12.4k</b></div>' +
        '<div class="an-row"><span style="width:46px">Direct</span><i class="tk"><i style="width:52%"></i></i><b>6.8k</b></div>' +
        '<div class="an-row"><span style="width:46px">Social</span><i class="tk"><i style="width:30%"></i></i><b>3.9k</b></div>' +
        '<span class="sp"></span></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Reports</b><span class="sub">4 saved</span></div>' +
        '<div class="an-kpi" style="grid-template-columns:1fr">' +
        '<div><span class="l3">Weekly traffic</span><b>24.8k</b><em class="an-up">Runs Monday</em></div>' +
        '<div><span class="l3">Revenue</span><b>$9.2k</b><em class="an-up">Runs Friday</em></div>' +
        '<div><span class="l3">Funnel</span><b>3.4%</b><em class="an-dn">Runs monthly</em></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">New report</span></div></div>' + nav(a, i) + hb();
    },
    function (a, i) {
      return st() + '<div class="bd">' +
        '<div class="hd"><b class="ttl">Settings</b><span class="sub">Workspace</span></div>' +
        '<div class="an-panel">' +
        '<div class="an-row"><span style="flex:1">Time zone</span><b>IST</b></div>' +
        '<div class="an-row"><span style="flex:1">Currency</span><b>USD</b></div>' +
        '<div class="an-row"><span style="flex:1">Alerts</span><b>Email</b></div>' +
        '<div class="an-row"><span style="flex:1">Members</span><b>4</b></div>' +
        '</div>' +
        '<span class="sp"></span><div class="btns"><span class="btn p">Save</span><span class="btn o">Reset</span></div></div>' + nav(a, i) + hb();
    }
  ];

  /* ============================================================
     5 · render primitives
     ============================================================ */
  function screenHTML(app, pi) {
    var fn = V[app.id] && V[app.id][pi];
    return fn ? fn(app, pi) : st() + '<div class="bd"></div>' + nav(app, pi) + hb();
  }

  function deviceHTML(app, pi, extra) {
    return (
      '<div class="device' + (extra ? " " + extra : "") + '"' +
      (app.dark ? ' data-dark="1"' : "") +
      ' data-app="' + app.id + '"><div class="scr">' +
      screenHTML(app, pi) +
      "</div></div>"
    );
  }

  function appById(id) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i];
    return null;
  }
  function indexOfId(id) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return i;
    return -1;
  }

  /* ============================================================
     6 · gallery index renderer
     ============================================================ */
  function cardHTML(app) {
    var n = indexOfId(app.id) + 1;
    return (
      '<a class="card-app reveal" href="app-face-' + n + '.html">' +
      '<span class="thumb">' +
      '<span class="num">' + pad(n) + "</span>" +
      '<span class="lv lv-' + app.level + '">' + esc(app.levelName) + "</span>" +
      deviceHTML(app, 0) +
      "</span>" +
      '<span class="body">' +
      "<h3>" + esc(app.name) + "</h3>" +
      '<span class="style">' + esc(app.style) + "</span>" +
      "<p>" + esc(app.blurb) + "</p>" +
      '<span class="go">Open face →</span>' +
      "</span></a>"
    );
  }

  function renderGallery() {
    var grid = document.getElementById("grid");
    if (!grid) return;

    var html = "";
    for (var c = 0; c < CATS.length; c++) {
      var cat = CATS[c];
      var cards = "";
      for (var k = 0; k < cat.ids.length; k++) {
        var app = appById(cat.ids[k]);
        if (app) cards += cardHTML(app);
      }
      html +=
        '<section class="cat cat-' + cat.id + '" id="cat-' + cat.id + '">' +
        '<div class="cat-head reveal">' +
        '<span class="ico">' + cat.icon + "</span>" +
        "<div>" +
        '<div class="kick">Category ' + pad(c + 1) + "</div>" +
        "<h2>" + esc(cat.name) + "</h2>" +
        "<p>" + esc(cat.tag) + "</p>" +
        "</div></div>" +
        '<div class="grid-apps">' + cards + "</div>" +
        "</section>";
    }
    grid.innerHTML = html;

    /* ---- category rail with scrollspy ---- */
    var rail = document.getElementById("rail");
    if (rail) {
      rail.innerHTML = CATS.map(function (cat) {
        return '<a href="#cat-' + cat.id + '">' + esc(cat.name) + "</a>";
      }).join("");

      var links = rail.querySelectorAll("a");
      var sections = [];
      for (var s = 0; s < CATS.length; s++) {
        var el = document.getElementById("cat-" + CATS[s].id);
        if (el) sections.push(el);
      }
      if ("IntersectionObserver" in window) {
        var spy = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (en) {
              if (!en.isIntersecting) return;
              Array.prototype.forEach.call(links, function (a) {
                a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id);
              });
            });
          },
          { rootMargin: "-40% 0px -55% 0px" }
        );
        sections.forEach(function (sec) { spy.observe(sec); });
      }
    }

    /* ---- reveal: stagger the cards inside each grid ---- */
    var reveals = document.querySelectorAll("#grid .reveal");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            if (en.target.classList.contains("card-app")) {
              var sibs = en.target.parentElement.querySelectorAll(".card-app");
              var i = Array.prototype.indexOf.call(sibs, en.target);
              en.target.style.transitionDelay = (i % 5) * 70 + "ms";
            }
            en.target.classList.add("in");
            io.unobserve(en.target);
          });
        },
        { threshold: 0.1 }
      );
      Array.prototype.forEach.call(reveals, function (r) { io.observe(r); });
    } else {
      Array.prototype.forEach.call(reveals, function (r) { r.classList.add("in"); });
    }

    /* ---- scroll progress + back to top ---- */
    var bar = document.getElementById("progress");
    var toTop = document.getElementById("toTop");
    function onScroll() {
      var h = document.documentElement;
      var scrollable = h.scrollHeight - h.clientHeight;
      if (bar) bar.style.width = (scrollable > 0 ? (h.scrollTop / scrollable) * 100 : 0) + "%";
      if (toTop) toTop.classList.toggle("show", window.scrollY > 500);
    }
    if (toTop) toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     7 · single-face page renderer
     ============================================================ */
  function renderFace(n) {
    var app = APPS[n - 1];
    if (!app) return;
    var cur = 0;

    var stage = document.getElementById("stage");
    var screens = document.getElementById("screens");
    var side = document.getElementById("side");
    var next = document.getElementById("next");

    function paintStage() {
      var dev = document.getElementById("stageDevice");
      if (dev) {
        dev.innerHTML = deviceHTML(app, cur);
        dev.classList.add("live");
      }
      var count = document.getElementById("stageCount");
      if (count) count.textContent = cur + 1 + " / " + app.pages.length;
      var tabs = document.querySelectorAll("#stage .face-tabs button");
      Array.prototype.forEach.call(tabs, function (b) {
        b.classList.toggle("on", Number(b.getAttribute("data-page")) === cur);
      });
      var figs = document.querySelectorAll("#screens [data-screen]");
      Array.prototype.forEach.call(figs, function (b) {
        b.classList.toggle("on", Number(b.getAttribute("data-screen")) === cur);
      });
    }

    function go(j) {
      var len = app.pages.length;
      cur = ((j % len) + len) % len;
      paintStage();
    }

    /* ---- the live stage ---- */
    if (stage) {
      stage.innerHTML =
        '<div class="face-stage">' +
        '<div id="stageDevice" class="live"></div>' +
        '<div class="face-ctl">' +
        '<button type="button" class="vnav" id="sprev" aria-label="Previous screen">‹</button>' +
        '<span class="count" id="stageCount">1 / ' + app.pages.length + "</span>" +
        '<button type="button" class="vnav" id="snext" aria-label="Next screen">›</button>' +
        "</div>" +
        '<div class="face-tabs">' +
        app.pages
          .map(function (p, j) {
            return '<button type="button" data-page="' + j + '">' + esc(p) + "</button>";
          })
          .join("") +
        "</div>" +
        '<p class="face-hint">Use the app\'s own <b>menu bar</b>, the chips above, or <b>← →</b>.</p>' +
        "</div>";

      document.getElementById("sprev").addEventListener("click", function () { go(cur - 1); });
      document.getElementById("snext").addEventListener("click", function () { go(cur + 1); });

      stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-page]");
        if (t && stage.contains(t)) go(Number(t.getAttribute("data-page")));
      });
    }

    /* ---- the four screens as a rail ---- */
    if (screens) {
      screens.innerHTML =
        '<div class="four">' +
        app.pages
          .map(function (p, j) {
            return (
              '<figure><button type="button" data-screen="' + j + '">' +
              deviceHTML(app, j) +
              '<span class="capt"><b>' + esc(p) + "</b><span>Screen " + (j + 1) + "</span></span>" +
              "</button></figure>"
            );
          })
          .join("") +
        "</div>";

      screens.addEventListener("click", function (e) {
        var b = e.target.closest("[data-screen]");
        if (!b) return;
        go(Number(b.getAttribute("data-screen")));
        if (stage) stage.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    /* ---- side panels ---- */
    if (side) {
      side.innerHTML =
        '<div class="face-panel">' +
        "<h3>Built from</h3>" +
        '<p class="lead">Components that belong to this app alone — nothing borrowed from the other nineteen faces.</p>' +
        '<div class="face-parts">' +
        app.parts.map(function (p) { return "<span>" + esc(p) + "</span>"; }).join("") +
        "</div></div>" +
        '<div class="face-panel">' +
        "<h3>Design notes</h3>" +
        '<ul class="face-notes">' +
        app.notes.map(function (t) {
          return '<li><span class="tic">✓</span>' + esc(t) + "</li>";
        }).join("") +
        "</ul></div>" +
        '<div class="face-panel">' +
        "<h3>Case</h3>" +
        '<div class="face-rows">' +
        "<div><span>Face</span><b>" + pad(n) + " of " + pad(APPS.length) + "</b></div>" +
        "<div><span>Screens</span><b>" + app.pages.length + "</b></div>" +
        "<div><span>Components</span><b>" + app.parts.length + "</b></div>" +
        "</div>" +
        '<div class="face-swatches" style="margin-top:18px">' +
        app.swatches.map(function (c) { return '<span style="--sw:' + c + '"></span>'; }).join("") +
        "</div></div>";
    }

    /* ---- previous / next face ---- */
    if (next) {
      var prevN = n === 1 ? APPS.length : n - 1;
      var nextN = n === APPS.length ? 1 : n + 1;
      next.innerHTML =
        '<a href="app-face-' + prevN + '.html">' +
        '<span class="lnk">← Previous face</span><b>' + pad(prevN) + " · " + esc(APPS[prevN - 1].name) + "</b></a>" +
        '<a class="side" href="app-face-' + nextN + '.html">' +
        '<span class="lnk">Next face →</span><b>' + pad(nextN) + " · " + esc(APPS[nextN - 1].name) + "</b></a>";
    }

    paintStage();

    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") go(cur - 1);
      else if (e.key === "ArrowRight") go(cur + 1);
    });
  }

  /* ============================================================
     8 · boot
     ============================================================ */
  window.AppFaces = {
    APPS: APPS,
    CATS: CATS,
    screenHTML: screenHTML,
    deviceHTML: deviceHTML,
    renderGallery: renderGallery,
    renderFace: renderFace
  };

  function boot() {
    injectSprite();
    var face = document.body.getAttribute("data-face");
    if (face) renderFace(Number(face));
    else renderGallery();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})(window, document);
