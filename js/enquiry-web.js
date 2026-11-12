/* ============================================================
   RJ - Category 01 data · Web Design & Development
   Registers with the shared enquiry engine (service-enquiry.js).
   ============================================================ */
(function () {
  "use strict";

  var FEATURES = [
    "Contact Forms", "WhatsApp Integration", "Appointment Booking",
    "Customer Dashboard", "Blog", "Testimonials", "Gallery", "Live Chat",
    "Payment Integration", "Multi-language Support", "SEO Setup"
  ];
  var PLATFORMS = ["Shopify", "WooCommerce", "Custom Development", "Other / Not Sure"];
  var CMS_OPTIONS = ["WordPress", "Webflow", "Shopify", "Headless CMS", "Custom CMS", "Other / Not Sure"];

  window.RJEnquiry.define({
    id: "web",
    label: "Web Design & Development",
    steps: [
      { title: "Project Details", kind: "fields", fieldStep: 1 },
      { title: "Features & Requirements", kind: "fields", fieldStep: 2 },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Contact Information", kind: "contact" }
    ],
    services: [
      {
        id: "business-corporate",
        name: "Business & Corporate Website",
        fields: [
          { k: "business_name", l: "Company / Business Name", t: "text", req: true },
          { k: "industry", l: "Industry / Business Type", t: "text" },
          { k: "purpose", l: "Website Purpose", t: "text" },
          { k: "pages", l: "Number of Pages Required", t: "text" },
          { k: "features", l: "Required Features", t: "multi", o: FEATURES, s: 2 },
          { k: "style", l: "Preferred Design Style", t: "text", s: 2 },
          { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "ecommerce",
        name: "E-commerce Website",
        fields: [
          { k: "brand_name", l: "Store / Brand Name", t: "text", req: true },
          { k: "category", l: "Product Category", t: "text" },
          { k: "product_count", l: "Approximate Number of Products", t: "text" },
          { k: "platform", l: "Preferred Platform", t: "select", o: PLATFORMS },
          { k: "gateways", l: "Required Payment Gateways", t: "text", s: 2 },
          { k: "shipping", l: "Shipping & Delivery Requirements", t: "textarea", s: 2 },
          { k: "inventory", l: "Inventory Management Requirements", t: "textarea", s: 2 },
          { k: "accounts", l: "Customer Account Requirements", t: "textarea", s: 2 },
          { k: "integrations", l: "Additional Integrations", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "portfolio",
        name: "Portfolio & Personal Website",
        fields: [
          { k: "name", l: "Name / Personal Brand", t: "text", req: true },
          { k: "profession", l: "Profession / Industry", t: "text" },
          { k: "purpose", l: "Website Purpose", t: "text" },
          { k: "project_count", l: "Number of Projects to Showcase", t: "text" },
          { k: "sections", l: "Required Sections", t: "textarea", s: 2 },
          { k: "gallery", l: "Portfolio Gallery Requirements", t: "textarea", s: 2 },
          { k: "resume", l: "Resume / CV Integration", t: "text", s: 2 },
          { k: "contact_form", l: "Contact Form Requirements", t: "text", s: 2 },
          { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "landing-page",
        name: "Landing Page Development",
        fields: [
          { k: "brand_name", l: "Brand / Business Name", t: "text", req: true },
          { k: "campaign", l: "Campaign Purpose", t: "text" },
          { k: "audience", l: "Target Audience", t: "text" },
          { k: "promoting", l: "Product / Service Being Promoted", t: "text" },
          { k: "cta", l: "Primary Call-to-Action", t: "text", s: 2 },
          { k: "sections", l: "Required Sections", t: "textarea", s: 2 },
          { k: "lead_capture", l: "Lead Capture Requirements", t: "textarea", s: 2 },
          { k: "ad_platform", l: "Advertising Platform", t: "text", s: 2 },
          { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "startup-saas",
        name: "Startup & SaaS Website",
        fields: [
          { k: "product_name", l: "Startup / Product Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "text" },
          { k: "product_desc", l: "Product Description", t: "textarea" },
          { k: "audience", l: "Target Audience", t: "text" },
          { k: "website_type", l: "Website Type", t: "text" },
          { k: "pages", l: "Required Pages", t: "textarea", s: 2 },
          { k: "pricing", l: "Pricing Page Requirements", t: "textarea", s: 2 },
          { k: "auth", l: "User Authentication Requirements", t: "textarea", s: 2 },
          { k: "dashboard", l: "Dashboard Requirements", t: "textarea", s: 2 },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "agency-studio",
        name: "Agency & Studio Website",
        fields: [
          { k: "agency_name", l: "Agency / Studio Name", t: "text", req: true },
          { k: "niche", l: "Industry / Creative Niche", t: "text" },
          { k: "services", l: "Services to Showcase", t: "textarea" },
          { k: "portfolio", l: "Portfolio Requirements", t: "textarea", s: 2 },
          { k: "team", l: "Team Section Requirements", t: "textarea", s: 2 },
          { k: "clients", l: "Client Showcase Requirements", t: "textarea", s: 2 },
          { k: "leads", l: "Contact / Lead Generation Features", t: "textarea", s: 2 },
          { k: "blog", l: "Blog Requirements", t: "textarea", s: 2 },
          { k: "refs", l: "Reference Websites", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "educational",
        name: "Educational Website",
        fields: [
          { k: "org_name", l: "Institution / Organization Name", t: "text", req: true },
          { k: "education_type", l: "Education Type", t: "text" },
          { k: "course_count", l: "Number of Courses", t: "text" },
          { k: "registration", l: "Student Registration Requirements", t: "textarea", s: 2 },
          { k: "lms", l: "LMS Requirements", t: "textarea", s: 2 },
          { k: "classes", l: "Online Classes Requirements", t: "textarea", s: 2 },
          { k: "payment", l: "Payment Integration", t: "text", s: 2 },
          { k: "student_dashboard", l: "Student Dashboard", t: "text", s: 2 },
          { k: "certificates", l: "Certificate Generation", t: "text", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "real-estate",
        name: "Real Estate Website",
        fields: [
          { k: "agency_name", l: "Company / Agency Name", t: "text", req: true },
          { k: "property_type", l: "Property Type", t: "text" },
          { k: "listing_count", l: "Approximate Number of Listings", t: "text" },
          { k: "listings", l: "Property Listing Requirements", t: "textarea", s: 2 },
          { k: "search", l: "Property Search & Filters", t: "textarea", s: 2 },
          { k: "maps", l: "Location / Map Integration", t: "text", s: 2 },
          { k: "enquiry_forms", l: "Property Enquiry Forms", t: "text", s: 2 },
          { k: "agents", l: "Agent / Broker Profiles", t: "text", s: 2 },
          { k: "crm", l: "CRM Integration", t: "text", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "restaurant",
        name: "Restaurant & Hospitality Website",
        fields: [
          { k: "restaurant_name", l: "Restaurant / Business Name", t: "text", req: true },
          { k: "business_type", l: "Business Type", t: "text" },
          { k: "menu", l: "Menu Management", t: "text", s: 2 },
          { k: "ordering", l: "Online Ordering Requirements", t: "textarea", s: 2 },
          { k: "reservations", l: "Table Reservation Requirements", t: "textarea", s: 2 },
          { k: "delivery", l: "Delivery Integration", t: "text", s: 2 },
          { k: "gallery", l: "Gallery Requirements", t: "textarea", s: 2 },
          { k: "maps", l: "Location & Map Integration", t: "text", s: 2 },
          { k: "whatsapp", l: "Contact / WhatsApp Integration", t: "text", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "booking",
        name: "Booking & Appointment Website",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "booking_type", l: "Booking Type", t: "text" },
          { k: "categories", l: "Appointment Categories", t: "text" },
          { k: "staff_count", l: "Number of Staff / Providers", t: "text" },
          { k: "calendar", l: "Calendar Integration", t: "text", s: 2 },
          { k: "availability", l: "Availability Management", t: "textarea", s: 2 },
          { k: "payments", l: "Online Payment Requirements", t: "textarea", s: 2 },
          { k: "notifications", l: "Automated Notifications", t: "text", s: 2 },
          { k: "accounts", l: "Customer Accounts", t: "text", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "cms",
        name: "CMS-Based Website",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "website_type", l: "Website Type", t: "text" },
          { k: "cms", l: "Preferred CMS", t: "select", o: CMS_OPTIONS },
          { k: "content_types", l: "Number of Content Types", t: "text" },
          { k: "content_mgmt", l: "Content Management Requirements", t: "textarea", s: 2 },
          { k: "admin_roles", l: "Admin Roles", t: "textarea", s: 2 },
          { k: "media", l: "Media Management Requirements", t: "textarea", s: 2 },
          { k: "publishing", l: "Blog / Publishing Requirements", t: "textarea", s: 2 },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "custom-app",
        name: "Custom Web Application",
        fields: [
          { k: "app_name", l: "Application Name", t: "text", req: true },
          { k: "industry", l: "Business / Industry", t: "text" },
          { k: "app_purpose", l: "Application Purpose", t: "textarea" },
          { k: "problem", l: "Problem the Application Will Solve", t: "textarea" },
          { k: "target_users", l: "Target Users", t: "text" },
          { k: "roles", l: "User Roles & Permissions", t: "textarea", s: 2 },
          { k: "modules", l: "Required Modules", t: "textarea", s: 2 },
          { k: "database", l: "Database Requirements", t: "textarea", s: 2 },
          { k: "integrations", l: "API / Third-Party Integrations", t: "textarea", s: 2 },
          { k: "admin_dashboard", l: "Admin Dashboard Requirements", t: "textarea", s: 2 },
          { k: "security", l: "Security Requirements", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "redesign",
        name: "Website Redesign",
        fields: [
          { k: "website_url", l: "Existing Website URL", t: "url", req: true },
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "platform", l: "Current Website Platform", t: "text" },
          { k: "improve", l: "What Needs Improvement", t: "textarea" },
          { k: "style", l: "Desired Design Style", t: "text" },
          { k: "new_features", l: "Required New Features", t: "textarea", s: 2 },
          { k: "migration", l: "Content Migration Requirements", t: "textarea", s: 2 },
          { k: "seo", l: "SEO Preservation Requirements", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "ui-ux",
        name: "Website UI/UX Design",
        fields: [
          { k: "brand_name", l: "Brand / Product Name", t: "text", req: true },
          { k: "design_type", l: "Design Type", t: "text" },
          { k: "app_type", l: "Website / Application Type", t: "text" },
          { k: "screen_count", l: "Number of Pages / Screens", t: "text" },
          { k: "audience", l: "Target Audience", t: "text" },
          { k: "style", l: "Preferred Design Style", t: "text" },
          { k: "wireframes", l: "Wireframe Requirements", t: "textarea", s: 2 },
          { k: "prototype", l: "Interactive Prototype Requirements", t: "textarea", s: 2 },
          { k: "design_system", l: "Design System Requirements", t: "textarea", s: 2 },
          { k: "reference_designs", l: "Reference Designs", t: "textarea", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      },
      {
        id: "maintenance",
        name: "Website Maintenance & Optimization",
        fields: [
          { k: "website_url", l: "Existing Website URL", t: "url", req: true },
          { k: "platform", l: "Website Platform", t: "text" },
          { k: "hosting", l: "Current Hosting Provider", t: "text" },
          { k: "maintenance_services", l: "Required Maintenance Services", t: "textarea", s: 2 },
          { k: "issues", l: "Current Website Issues", t: "textarea", s: 2 },
          { k: "performance", l: "Performance Optimization Requirements", t: "textarea", s: 2 },
          { k: "security_backup", l: "Security & Backup Requirements", t: "textarea", s: 2 },
          { k: "frequency", l: "Frequency of Maintenance", t: "text", s: 2 },
          { k: "description", l: "Project Description", t: "textarea", s: 2 }
        ]
      }
    ]
  });
})();
