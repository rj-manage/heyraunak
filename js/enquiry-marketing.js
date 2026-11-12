/* ============================================================
   RJ - Category 03 data · Digital Marketing & Growth
   Registers with the shared enquiry engine (service-enquiry.js).

   24 services in the four approved groups. Category 03 has no
   per-service field specification yet, so every service shares one
   marketing brief - the same questions a marketing engagement
   needs whatever the channel. Replace BRIEF with per-service field
   sets when those are signed off; the engine needs no changes.
   ============================================================ */
(function () {
  "use strict";

  var BRIEF = [
    { k: "profile_url", l: "Website / Profile URL", t: "url" },
    { k: "presence", l: "Current Online Presence", t: "textarea" },
    { k: "audience", l: "Target Audience", t: "text" },
    { k: "goals", l: "Primary Goals & KPIs", t: "textarea" },
    { k: "competitors", l: "Main Competitors", t: "text" },
    { k: "additional", l: "Additional Requirements", t: "textarea" }
  ];

  window.RJEnquiry.define({
    id: "marketing",
    label: "Digital Marketing & Growth",
    steps: [
      { title: "Campaign Requirements", kind: "fields", fieldStep: 1 },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Contact Information", kind: "contact" }
    ],
    services: [
      /* ---------- Social Media Marketing ---------- */
      { id: "mkt-social-media", name: "Social Media Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-instagram", name: "Instagram Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-facebook", name: "Facebook Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-linkedin", name: "LinkedIn Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-youtube", name: "YouTube Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-x", name: "X (Twitter) Marketing", group: "Social Media Marketing", fields: BRIEF },
      { id: "mkt-pinterest", name: "Pinterest Marketing", group: "Social Media Marketing", fields: BRIEF },

      /* ---------- Paid Advertising ---------- */
      { id: "mkt-meta-ads", name: "Meta Ads Management", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-google-ads", name: "Google Ads Management", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-youtube-ads", name: "YouTube Advertising", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-linkedin-ads", name: "LinkedIn Advertising", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-display-ads", name: "Display Advertising", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-retargeting", name: "Remarketing & Retargeting", group: "Paid Advertising", fields: BRIEF },
      { id: "mkt-lead-gen", name: "Paid Lead Generation", group: "Paid Advertising", fields: BRIEF },

      /* ---------- Search Engine Optimization ---------- */
      { id: "mkt-onpage-seo", name: "On-Page SEO", group: "Search Engine Optimization (SEO)", fields: BRIEF },
      { id: "mkt-offpage-seo", name: "Off-Page SEO", group: "Search Engine Optimization (SEO)", fields: BRIEF },
      { id: "mkt-technical-seo", name: "Technical SEO", group: "Search Engine Optimization (SEO)", fields: BRIEF },
      { id: "mkt-local-seo", name: "Local SEO", group: "Search Engine Optimization (SEO)", fields: BRIEF },
      { id: "mkt-keyword-research", name: "Keyword Research", group: "Search Engine Optimization (SEO)", fields: BRIEF },
      { id: "mkt-seo-audit", name: "Website SEO Audit", group: "Search Engine Optimization (SEO)", fields: BRIEF },

      /* ---------- Email & Direct Marketing ---------- */
      { id: "mkt-email", name: "Email Marketing", group: "Email & Direct Marketing", fields: BRIEF },
      { id: "mkt-whatsapp", name: "WhatsApp Marketing", group: "Email & Direct Marketing", fields: BRIEF },
      { id: "mkt-sms", name: "SMS Marketing", group: "Email & Direct Marketing", fields: BRIEF },
      { id: "mkt-newsletter", name: "Newsletter Campaigns", group: "Email & Direct Marketing", fields: BRIEF }
    ]
  });
})();
