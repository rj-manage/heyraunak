/* ============================================================
   RJ - Category 03 data · Digital Marketing & Growth
   Registers with the shared enquiry engine (service-enquiry.js).
   Three steps for every service: Project Requirements ->
   Budget & Timeline -> Personal Information.

   Services in the Paid Advertising group carry adSpend: true, which
   adds a separate optional "Advertising Spend Budget" to step 2 so
   platform spend is never confused with the RJ service fee.
   ============================================================ */
(function () {
  "use strict";

  function withDescription(fields) {
    return fields.concat([
      { k: "requirements", l: "Campaign Requirements", t: "textarea" }
    ]);
  }

  var OBJECTIVE_SOCIAL = [
    "Brand awareness", "Engagement", "Follower growth", "Lead generation", "Sales"
  ];
  var OBJECTIVE_ADS = [
    "Lead generation", "Sales", "Website traffic", "Retargeting", "Brand awareness"
  ];
  var OBJECTIVE_SEO = [
    "Higher rankings", "More organic traffic", "More leads", "Local visibility", "Fixing SEO issues"
  ];
  var OBJECTIVE_DIRECT = [
    "Nurturing leads", "Retention", "Sales & offers", "Announcements"
  ];

  function service(id, name, group, objective, adSpend) {
    var svc = {
      id: id,
      name: name,
      group: group,
      fields: withDescription([
        { k: "profile_url", l: "Website / Social Profile URL", t: "url" },
        { k: "objective", l: "Marketing objective", t: "select", o: objective },
        { k: "audience", l: "Target audience", t: "text" }
      ])
    };
    if (adSpend) svc.adSpend = true;
    return svc;
  }

  window.RJEnquiry.define({
    id: "marketing",
    label: "Digital Marketing & Growth",
    dedupeOrg: true,
    steps: [
      { title: "Project Requirements", kind: "fields", fieldStep: 1 },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Personal Information", kind: "contact" }
    ],
    services: [
      /* ---------- Social Media Marketing ---------- */
      service("mkt-social-media", "Social Media Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-instagram", "Instagram Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-facebook", "Facebook Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-linkedin", "LinkedIn Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-youtube", "YouTube Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-x", "X (Twitter) Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),
      service("mkt-pinterest", "Pinterest Marketing", "Social Media Marketing", OBJECTIVE_SOCIAL),

      /* ---------- Paid Advertising ---------- */
      service("mkt-meta-ads", "Meta Ads Management", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-google-ads", "Google Ads Management", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-youtube-ads", "YouTube Advertising", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-linkedin-ads", "LinkedIn Advertising", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-display-ads", "Display Advertising", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-retargeting", "Remarketing & Retargeting", "Paid Advertising", OBJECTIVE_ADS, true),
      service("mkt-lead-gen", "Paid Lead Generation", "Paid Advertising", OBJECTIVE_ADS, true),

      /* ---------- Search Engine Optimization ---------- */
      service("mkt-onpage-seo", "On-Page SEO", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),
      service("mkt-offpage-seo", "Off-Page SEO", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),
      service("mkt-technical-seo", "Technical SEO", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),
      service("mkt-local-seo", "Local SEO", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),
      service("mkt-keyword-research", "Keyword Research", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),
      service("mkt-seo-audit", "Website SEO Audit", "Search Engine Optimization (SEO)", OBJECTIVE_SEO),

      /* ---------- Email & Direct Marketing ---------- */
      service("mkt-email", "Email Marketing", "Email & Direct Marketing", OBJECTIVE_DIRECT),
      service("mkt-whatsapp", "WhatsApp Marketing", "Email & Direct Marketing", OBJECTIVE_DIRECT),
      service("mkt-sms", "SMS Marketing", "Email & Direct Marketing", OBJECTIVE_DIRECT),
      service("mkt-newsletter", "Newsletter Campaigns", "Email & Direct Marketing", OBJECTIVE_DIRECT)
    ]
  });
})();
