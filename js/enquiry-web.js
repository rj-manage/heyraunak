/* ============================================================
   RJ - Category 01 data · Web Design & Development
   Registers with the shared enquiry engine (service-enquiry.js).
   Three steps for every service: Project Requirements ->
   Budget & Timeline -> Personal Information.
   ============================================================ */
(function () {
  "use strict";

  /* every service ends with one optional free-text description */
  function withDescription(fields) {
    return fields.concat([
      { k: "description", l: "Project Description", t: "textarea" }
    ]);
  }

  var INDUSTRY = [
    "Professional services", "Retail & e-commerce", "Healthcare",
    "Education", "Manufacturing", "Other"
  ];

  window.RJEnquiry.define({
    id: "web",
    label: "Web Design & Development",
    dedupeOrg: true,
    steps: [
      { title: "Project Requirements", kind: "fields", fieldStep: 1 },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Personal Information", kind: "contact" }
    ],
    services: [
      {
        id: "business-corporate",
        name: "Business & Corporate Website",
        fields: withDescription([
          { k: "business_name", l: "Company / Business Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "select", o: INDUSTRY },
          { k: "features", l: "What the site needs", t: "multi", o: [
            "Contact forms", "Blog", "Live chat", "Multi-language", "SEO setup"
          ] }
        ])
      },
      {
        id: "ecommerce",
        name: "E-commerce Website",
        fields: withDescription([
          { k: "brand_name", l: "Store / Brand Name", t: "text", req: true },
          { k: "platform", l: "Preferred platform", t: "select", o: [
            "Shopify", "WooCommerce", "Custom development", "Not sure yet"
          ] },
          { k: "features", l: "Store features", t: "multi", o: [
            "Payments", "Inventory sync", "Shipping", "Customer accounts", "Discounts"
          ] }
        ])
      },
      {
        id: "portfolio",
        name: "Portfolio & Personal Website",
        fields: withDescription([
          { k: "name", l: "Name / Personal Brand", t: "text", req: true },
          { k: "profession", l: "Profession", t: "text" },
          { k: "sections", l: "Sections you want", t: "multi", o: [
            "About", "Work gallery", "Services", "Testimonials", "Blog", "Contact form"
          ] }
        ])
      },
      {
        id: "landing-page",
        name: "Landing Page Development",
        fields: withDescription([
          { k: "brand_name", l: "Brand / Business Name", t: "text", req: true },
          { k: "goal", l: "Campaign goal", t: "select", o: [
            "Lead capture", "Sales", "App signups", "Event registrations", "Other"
          ] },
          { k: "sections", l: "Page elements", t: "multi", o: [
            "Hero form", "Video", "Testimonials", "Countdown timer", "FAQ"
          ] }
        ])
      },
      {
        id: "startup-saas",
        name: "Startup & SaaS Website",
        fields: withDescription([
          { k: "product_name", l: "Startup / Product Name", t: "text", req: true },
          { k: "site_type", l: "Website type", t: "select", o: [
            "Marketing site", "Product site", "Both"
          ] },
          { k: "pages", l: "Pages you need", t: "multi", o: [
            "Pricing", "Features", "About", "Blog", "Careers", "Contact"
          ] }
        ])
      },
      {
        id: "agency-studio",
        name: "Agency & Studio Website",
        fields: withDescription([
          { k: "agency_name", l: "Agency / Studio Name", t: "text", req: true },
          { k: "showcase", l: "What you want to showcase", t: "multi", o: [
            "Case studies", "Team", "Services", "Clients", "Blog"
          ] }
        ])
      },
      {
        id: "educational",
        name: "Educational Website",
        fields: withDescription([
          { k: "org_name", l: "Institution / Organization Name", t: "text", req: true },
          { k: "institution_type", l: "Institution type", t: "select", o: [
            "School", "College", "University", "Coaching centre", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Courses", "Admissions", "Student portal", "Payments", "Results"
          ] }
        ])
      },
      {
        id: "real-estate",
        name: "Real Estate Website",
        fields: withDescription([
          { k: "agency_name", l: "Company / Agency Name", t: "text", req: true },
          { k: "property_type", l: "Property type", t: "select", o: [
            "Residential", "Commercial", "Rentals", "Mixed", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Listings", "Search filters", "Map view", "Enquiry forms", "Agent profiles"
          ] }
        ])
      },
      {
        id: "restaurant",
        name: "Restaurant & Hospitality Website",
        fields: withDescription([
          { k: "restaurant_name", l: "Restaurant / Business Name", t: "text", req: true },
          { k: "business_type", l: "Business type", t: "select", o: [
            "Restaurant", "Cafe", "Bar", "Hotel", "Cloud kitchen"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Menu", "Online ordering", "Table booking", "Gallery", "WhatsApp"
          ] }
        ])
      },
      {
        id: "booking",
        name: "Booking & Appointment Website",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "booking_type", l: "What are you booking", t: "select", o: [
            "Appointments", "Classes", "Consultations", "Services", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Calendar", "Staff selection", "Online payments", "Reminders", "Customer accounts"
          ] }
        ])
      },
      {
        id: "cms",
        name: "CMS-Based Website",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "cms", l: "Preferred CMS", t: "select", o: [
            "WordPress", "Webflow", "Shopify", "Headless CMS", "Custom CMS", "Not sure yet"
          ] },
          { k: "content", l: "What you will publish", t: "multi", o: [
            "Blog articles", "Product pages", "Case studies", "News", "Media gallery"
          ] }
        ])
      },
      {
        id: "custom-app",
        name: "Custom Web Application",
        fields: withDescription([
          { k: "app_name", l: "Application Name", t: "text", req: true },
          { k: "roles", l: "Who will use it", t: "multi", o: [
            "Admin", "Staff", "Customers", "Partners"
          ] },
          { k: "dashboard", l: "Admin dashboard", t: "select", o: [
            "Full admin dashboard", "Basic dashboard", "None needed"
          ] }
        ])
      },
      {
        id: "redesign",
        name: "Website Redesign",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "website_url", l: "Existing website URL", t: "url" },
          { k: "improve", l: "What needs improving", t: "multi", o: [
            "Visual design", "Mobile experience", "Speed", "Content", "Navigation"
          ] }
        ])
      },
      {
        id: "ui-ux",
        name: "Website UI/UX Design",
        fields: withDescription([
          { k: "brand_name", l: "Brand / Product Name", t: "text", req: true },
          { k: "design_type", l: "What are we designing", t: "select", o: [
            "Website", "Web app", "Mobile app", "Dashboard"
          ] },
          { k: "deliverables", l: "Deliverables", t: "multi", o: [
            "Wireframes", "UI design", "Interactive prototype", "Design system"
          ] }
        ])
      },
      {
        id: "maintenance",
        name: "Website Maintenance & Optimization",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "website_url", l: "Existing website URL", t: "url" },
          { k: "services", l: "What you need", t: "multi", o: [
            "Updates & fixes", "Speed optimisation", "Security & backups",
            "SEO upkeep", "Monthly reports"
          ] }
        ])
      }
    ]
  });
})();
