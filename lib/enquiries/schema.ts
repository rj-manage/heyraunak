// ============================================================
// RJ Studio - service enquiry form schema (single source of truth)
// ------------------------------------------------------------
// One entry per service. The public popup fetches this (via
// GET /api/enquiry/schema?service=...) and the server validates
// submissions against the very same config, so the two can never
// drift apart.
//
// Field ids are stable keys stored in enquiries.project_details.
// Service names and categories must match the public site exactly.
// ============================================================

export type FieldType =
  | "text"
  | "textarea"
  | "phone"
  | "email"
  | "url"
  | "number"
  | "select"
  | "multi"
  | "radio"
  | "date"
  | "budget"
  | "slider"
  | "file";

export interface EnquiryField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  min?: number;
  max?: number;
  allowOther?: boolean;
  showIf?: { field: string; equals: string };
  /** Wizard step (1-3). 1 contact, 2 requirements, 3 budget & extras. */
  step?: number;
}

export interface ServiceForm {
  category: string;
  service: string;
  fields: EnquiryField[];
}

export const CATEGORIES = [
  "Website Development",
  "Software & App Development",
  "Digital Marketing",
  "Student Projects"
] as const;

/** Fields every service form carries. Name, WhatsApp and email are mandatory. */
export const COMMON_FIELDS: EnquiryField[] = [
  { id: "full_name", label: "Full Name", type: "text", required: true, placeholder: "Your full name", step: 1 },
  {
    id: "whatsapp",
    label: "WhatsApp Number",
    type: "phone",
    required: true,
    placeholder: "98765 43210",
    help: "Include your country code",
    step: 1
  },
  { id: "email", label: "Email Address", type: "email", required: true, placeholder: "you@company.com", step: 1 },
  { id: "company", label: "Company Name", type: "text", placeholder: "Optional", help: "Optional", step: 1 }
];

/* ---------- shared option sets ---------- */

const INDUSTRY = [
  "Professional services",
  "Retail & e-commerce",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Technology / SaaS",
  "Real estate",
  "Hospitality",
  "Finance",
  "Other"
];

const DESIGN_STYLE = ["Minimal", "Modern", "Corporate", "Bold", "Creative", "Dark", "Not sure yet"];

const PLATFORMS_SOCIAL = ["Instagram", "Facebook", "LinkedIn", "YouTube", "X (Twitter)", "Pinterest", "Other"];

const GENERIC_FEATURES = [
  "User accounts",
  "Search",
  "Notifications",
  "Payments",
  "Reports",
  "File uploads",
  "Messaging",
  "Analytics",
  "Multi-language",
  "Third-party integrations"
];

const OS_TARGETS = ["Windows", "macOS", "Linux", "Android", "iOS", "Web browser"];

const RANGE_USERS = ["1-10", "11-50", "51-200", "201-1,000", "1,000+"];
const RANGE_SMALL = ["Under 50", "50-200", "200-1,000", "1,000-10,000", "10,000+"];
const RANGE_DOCS = ["Under 1,000", "1,000-10,000", "10,000-100,000", "100,000+"];

const TIMELINE = [
  "As soon as possible",
  "Within 2 weeks",
  "Within 1 month",
  "1-3 months",
  "3-6 months",
  "Flexible / no fixed deadline"
];

const BUDGET_WEB = [
  "Under $500",
  "$500-$1,000",
  "$1,000-$2,500",
  "$2,500-$5,000",
  "$5,000-$10,000",
  "$10,000-$25,000",
  "$25,000+",
  "Not sure yet"
];
const BUDGET_SOFT = [
  "Under $1,000",
  "$1,000-$5,000",
  "$5,000-$10,000",
  "$10,000-$25,000",
  "$25,000-$50,000",
  "$50,000+",
  "Not sure yet"
];
const BUDGET_MKT = [
  "Under $250 / month",
  "$250-$500 / month",
  "$500-$1,000 / month",
  "$1,000-$2,500 / month",
  "$2,500-$5,000 / month",
  "$5,000+ / month",
  "Not sure yet"
];
const BUDGET_STUDENT = [
  "Under $100",
  "$100-$250",
  "$250-$500",
  "$500-$1,000",
  "$1,000-$2,500",
  "$2,500-$5,000",
  "$5,000+",
  "Not sure yet"
];

/* ---------- field builders ---------- */

function t(id: string, label: string, opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "text", ...opt };
}
function ta(id: string, label: string, opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "textarea", ...opt };
}
function url(id: string, label: string, opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "url", ...opt };
}
function num(id: string, label: string, opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "number", min: 0, ...opt };
}
function sel(id: string, label: string, options: string[], opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "select", options, ...opt };
}
/** Slider over ordered options. Every option except the trailing "Not sure yet"
 *  becomes a stop on the bar; the client renders that last one as a toggle. */
function sld(id: string, label: string, options: string[], opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "slider", options, ...opt };
}
function multi(id: string, label: string, options: string[], opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "multi", options, ...opt };
}
function rdo(id: string, label: string, options: string[], opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "radio", options, ...opt };
}
function yn(id: string, label: string, opt: Partial<EnquiryField> = {}): EnquiryField {
  return { id, label, type: "radio", options: ["Yes", "No"], ...opt };
}

/** Budget / timeline / reference / attachments block every form ends with. */
function tail(budgetOptions: string[]): EnquiryField[] {
  return [
    sld("budget", "Estimated Budget", budgetOptions, { required: true, step: 3 }),
    sel("timeline", "Expected Timeline", TIMELINE, { help: "Optional", step: 3 }),
    { id: "start_date", label: "Preferred Start Date", type: "date", help: "Optional", step: 3 },
    url("reference_link", "Reference Link", {
      placeholder: "https://example.com",
      help: "Optional - a site or example you like",
      step: 3
    }),
    {
      id: "attachments",
      label: "Reference Documents",
      type: "file",
      help: "Optional - PDF, Word or Excel. Up to 5 files, 10 MB each.",
      step: 3
    },
    ta("additional_notes", "Anything Else?", { placeholder: "Optional", help: "Optional", step: 3 })
  ];
}

const web = (service: string, fields: EnquiryField[]): ServiceForm => ({
  category: "Website Development",
  service,
  fields: [...fields, ...tail(BUDGET_WEB)]
});
const soft = (service: string, fields: EnquiryField[]): ServiceForm => ({
  category: "Software & App Development",
  service,
  fields: [...fields, ...tail(BUDGET_SOFT)]
});
const mkt = (service: string, fields: EnquiryField[]): ServiceForm => ({
  category: "Digital Marketing",
  service,
  fields: [...fields, ...tail(BUDGET_MKT)]
});
const stud = (service: string, fields: EnquiryField[]): ServiceForm => ({
  category: "Student Projects",
  service,
  fields: [...fields, ...tail(BUDGET_STUDENT)]
});

/* ============================================================
   CATEGORY 1 · WEBSITE DEVELOPMENT (20)
   ============================================================ */

const WEBSITE: ServiceForm[] = [
  web("Business Website Development", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    num("pages", "Number of Pages Required", { min: 1 }),
    sel("purpose", "Website Purpose", [
      "Lead generation",
      "Informational",
      "Online sales",
      "Showcase / portfolio",
      "Booking",
      "Other"
    ], { allowOther: true }),
    sel("domain_hosting", "Do You Have a Domain and Hosting?", [
      "Yes, both",
      "Domain only",
      "Hosting only",
      "No",
      "Not sure yet"
    ]),
    multi("features", "Required Website Features", [
      "Contact forms",
      "Blog",
      "Live chat",
      "Multi-language",
      "SEO setup",
      "E-commerce",
      "Booking",
      "Newsletter",
      "Analytics",
      "Social feed"
    ])
  ]),

  web("Corporate Website Development", [
    sel("industry", "Company Industry", INDUSTRY, { allowOther: true }),
    num("pages", "Number of Pages Required", { min: 1 }),
    multi("sections", "Required Website Sections", [
      "Home",
      "About",
      "Services",
      "Products",
      "Careers",
      "Blog",
      "Gallery",
      "Testimonials",
      "Contact"
    ]),
    rdo("branding", "Do You Have Existing Branding?", ["Yes, full brand guidelines", "Partial", "No"]),
    multi("integrations", "Required Integrations", [
      "CRM",
      "Email marketing",
      "Analytics",
      "Payment gateway",
      "Social media",
      "Live chat",
      "ERP",
      "Other"
    ])
  ]),

  web("E-Commerce Website Development", [
    sel("products", "Number of Products", RANGE_SMALL),
    t("product_categories", "Product Categories", { placeholder: "e.g. Clothing, Electronics, Home & Kitchen" }),
    multi("payments", "Payment Gateway Requirements", [
      "Credit / Debit cards",
      "UPI",
      "Net banking",
      "Wallets",
      "PayPal",
      "Stripe",
      "Razorpay",
      "Cash on delivery",
      "Other"
    ]),
    ta("shipping", "Shipping & Delivery Requirements", { placeholder: "Shipping zones, rates, pickup, local delivery…" }),
    sel("platform", "Preferred E-Commerce Platform", [
      "Shopify",
      "WooCommerce",
      "Magento",
      "Custom development",
      "Not sure yet"
    ], { allowOther: true })
  ]),

  web("Portfolio Website Development", [
    t("profession", "Profession or Industry", { placeholder: "e.g. Photographer, Architect, Designer" }),
    num("projects", "Number of Portfolio Projects", { min: 1 }),
    multi("sections", "Required Portfolio Sections", [
      "About",
      "Work gallery",
      "Services",
      "Testimonials",
      "Blog",
      "Resume / CV",
      "Pricing",
      "Contact form"
    ]),
    sel("content_ready", "Do You Have Project Images and Content?", [
      "Yes, ready",
      "Some of it",
      "No, need help"
    ]),
    sel("design_style", "Preferred Design Style", DESIGN_STYLE)
  ]),

  web("Personal Website Development", [
    sel("purpose", "Website Purpose", [
      "Personal brand",
      "Freelance services",
      "CV / resume",
      "Blog",
      "Portfolio",
      "Other"
    ], { allowOther: true }),
    t("profession", "Profession or Occupation"),
    multi("pages", "Required Pages", [
      "Home",
      "About",
      "Services",
      "Portfolio",
      "Blog",
      "Testimonials",
      "Contact"
    ]),
    ta("branding", "Personal Branding Requirements"),
    sel("design_style", "Preferred Design Style", DESIGN_STYLE)
  ]),

  web("Landing Page Development", [
    sel("purpose", "Landing Page Purpose", [
      "Product launch",
      "Lead capture",
      "Event promotion",
      "App signups",
      "Sales campaign",
      "Other"
    ], { allowOther: true }),
    t("audience", "Target Audience"),
    t("cta", "Primary Call-to-Action", { placeholder: "e.g. Book a demo, Get a quote" }),
    multi("leads", "Lead Collection Requirements", [
      "Name & phone",
      "Email",
      "Custom form fields",
      "WhatsApp click",
      "Brochure download",
      "Newsletter signup"
    ]),
    multi("ad_platform", "Advertising Platform", [
      "Google Ads",
      "Facebook / Instagram",
      "LinkedIn",
      "YouTube",
      "Email",
      "None yet"
    ])
  ]),

  web("Custom Website Development", [
    ta("description", "Project Description", { placeholder: "What are you building and why?" }),
    multi("features", "Required Features", GENERIC_FEATURES),
    num("pages", "Estimated Number of Pages", { min: 1 }),
    ta("reference", "Reference Websites", { placeholder: "Links to sites you like (optional)" }),
    ta("functionalities", "Special Functionalities", { placeholder: "Anything out of the ordinary" })
  ]),

  web("WordPress Website Development", [
    sel("purpose", "Website Purpose", [
      "Business",
      "Blog / news",
      "E-commerce",
      "Portfolio",
      "Membership",
      "Other"
    ], { allowOther: true }),
    t("pages", "Required Pages", { placeholder: "e.g. Home, About, Services, Blog, Contact" }),
    t("theme", "Preferred WordPress Theme (if any)", { placeholder: "Optional" }),
    multi("plugins", "Required Plugins or Features", [
      "SEO (Yoast / Rank Math)",
      "Contact forms",
      "WooCommerce",
      "Membership",
      "Multilingual",
      "Page builder",
      "Backups",
      "Security",
      "Caching"
    ]),
    yn("existing", "Do You Have an Existing WordPress Website?")
  ]),

  web("Web Application Development", [
    ta("purpose", "Application Purpose"),
    multi("roles", "Required User Roles", ["Admin", "Manager", "Staff", "Customer", "Vendor / Partner", "Guest"]),
    multi("features", "Core Application Features", [
      "Authentication",
      "Dashboard",
      "CRUD records",
      "Payments",
      "Notifications",
      "Reports",
      "File uploads",
      "Messaging",
      "Search",
      "API"
    ]),
    multi("integrations", "Third-Party Integrations", [
      "Payment gateway",
      "Email / SMS",
      "Analytics",
      "CRM",
      "ERP",
      "Maps",
      "Social login",
      "Other"
    ]),
    sel("users", "Expected Number of Users", RANGE_USERS)
  ]),

  web("Responsive Website Development", [
    url("site_url", "Existing Website URL", { placeholder: "https://example.com" }),
    multi("devices", "Devices to Support", ["Desktop", "Laptop", "Tablet", "Mobile", "Large screens"]),
    ta("issues", "Current Responsiveness Issues"),
    multi("improvements", "Required Improvements", [
      "Layout",
      "Navigation",
      "Images",
      "Typography",
      "Performance",
      "Forms"
    ]),
    { id: "deadline", label: "Preferred Deadline", type: "date", help: "Optional" }
  ]),

  web("CMS Website Development", [
    sel("purpose", "Website Purpose", [
      "Business",
      "Blog / news",
      "E-commerce",
      "Documentation",
      "Other"
    ], { allowOther: true }),
    sel("cms", "Preferred CMS", ["WordPress", "Drupal", "Joomla", "Headless CMS", "Custom", "Not sure yet"], {
      allowOther: true
    }),
    multi("content_types", "Content Types", ["Pages", "Blog posts", "News", "Products", "Events", "Media gallery", "Docs"]),
    ta("admin_users", "Admin User Requirements"),
    multi("features", "Required CMS Features", [
      "User roles",
      "SEO tools",
      "Media library",
      "Versioning",
      "Workflow / approvals",
      "Multilingual",
      "Forms",
      "Analytics"
    ])
  ]),

  web("Real Estate Website Development", [
    multi("property_types", "Property Types", ["Residential", "Commercial", "Rentals", "Land / plots", "Mixed"]),
    ta("listings", "Property Listing Requirements"),
    multi("filters", "Property Search Filters", ["Price", "Location", "Property type", "Bedrooms", "Area", "Amenities"]),
    rdo("map", "Map Integration Requirements", ["Yes, map search", "Yes, simple map", "No"]),
    ta("leads", "Lead Management Requirements")
  ]),

  web("Educational Website Development", [
    sel("institution", "Type of Educational Institution", [
      "School",
      "College",
      "University",
      "Coaching centre",
      "Training institute"
    ], { allowOther: true }),
    multi("features", "Required Features", [
      "Courses",
      "Admissions",
      "Student portal",
      "Results",
      "Timetable",
      "Faculty profiles",
      "Gallery",
      "News"
    ]),
    ta("registration", "Student Registration Requirements"),
    rdo("online_learning", "Online Learning Requirements", ["Yes", "No", "Maybe later"]),
    yn("fee_management", "Payment or Fee Management Requirements")
  ]),

  web("Blog & News Website Development", [
    sel("category", "Website Category", ["News", "Personal blog", "Magazine", "Niche blog", "Corporate blog"], {
      allowOther: true
    }),
    num("authors", "Expected Number of Authors", { min: 1 }),
    t("content_categories", "Required Content Categories", { placeholder: "e.g. Tech, Sports, Politics" }),
    rdo("comments", "Commenting Requirements", ["Yes, with moderation", "Yes, open", "No comments", "Not sure"]),
    yn("ads", "Advertisement Integration")
  ]),

  web("Booking & Appointment Website Development", [
    sel("booking_type", "Type of Booking Service", [
      "Appointments",
      "Classes",
      "Consultations",
      "Rooms",
      "Services",
      "Other"
    ], { allowOther: true }),
    ta("scheduling", "Appointment Scheduling Requirements"),
    yn("online_payment", "Online Payment Requirements"),
    rdo("calendar", "Calendar Integration", ["Google Calendar", "Outlook", "Custom", "No"]),
    multi("notifications", "Customer Notification Requirements", ["Email", "SMS", "WhatsApp", "Push", "None"])
  ]),

  web("Restaurant & Hotel Website Development", [
    rdo("business_type", "Business Type", ["Restaurant", "Hotel", "Both"]),
    ta("reservations", "Online Reservation Requirements"),
    ta("listings", "Menu or Room Listing Requirements"),
    yn("online_payment", "Online Payment Requirements"),
    multi("features", "Required Additional Features", [
      "Gallery",
      "Reviews",
      "Contact / map",
      "Offers",
      "Delivery info",
      "Blog",
      "Multi-language"
    ])
  ]),

  web("Membership Website Development", [
    sel("membership_type", "Membership Type", ["Free", "Paid", "Tiered", "Invite-only"], { allowOther: true }),
    num("plans", "Number of Membership Plans", { min: 1 }),
    yn("subscriptions", "Subscription Payment Requirements"),
    ta("dashboard", "Member Dashboard Requirements"),
    ta("restricted", "Restricted Content Requirements")
  ]),

  web("Website Redesign & Revamp", [
    url("site_url", "Existing Website URL", { placeholder: "https://example.com" }),
    ta("issues", "Current Website Issues"),
    sel("design_style", "Desired Design Style", DESIGN_STYLE),
    multi("features", "Required New Features", GENERIC_FEATURES),
    ta("reference", "Reference Websites", { placeholder: "Links to sites you like (optional)" })
  ]),

  web("Website Maintenance & Support", [
    url("site_url", "Existing Website URL", { placeholder: "https://example.com" }),
    sel("platform", "Website Platform", ["WordPress", "Shopify", "Wix", "Custom", "Other", "Not sure"], {
      allowOther: true
    }),
    multi("maintenance", "Type of Maintenance Required", [
      "Updates & fixes",
      "Security",
      "Backups",
      "Content updates",
      "SEO upkeep",
      "Performance",
      "Monthly reports"
    ]),
    ta("issues", "Current Technical Issues"),
    sel("frequency", "Required Support Frequency", ["One-time", "Weekly", "Monthly", "Quarterly", "As needed"])
  ]),

  web("Website Speed & Performance Optimization", [
    url("site_url", "Existing Website URL", { placeholder: "https://example.com" }),
    ta("issues", "Current Performance Issues"),
    sel("platform", "Website Platform", ["WordPress", "Shopify", "Custom", "Other", "Not sure"], { allowOther: true }),
    multi("optimization", "Optimization Requirements", [
      "Page speed",
      "Core Web Vitals",
      "Images",
      "Caching",
      "CDN",
      "Code optimization",
      "Database"
    ]),
    yn("speed_report", "Do You Have a Speed Test Report?")
  ])
];

/* ============================================================
   CATEGORY 2 · SOFTWARE & APP DEVELOPMENT (20)
   ============================================================ */

const SOFTWARE: ServiceForm[] = [
  soft("Android Application Development", [
    ta("purpose", "Application Purpose"),
    multi("features", "Required App Features", GENERIC_FEATURES),
    t("audience", "Target Audience"),
    yn("login", "User Login Requirements"),
    ta("backend", "Backend or API Requirements")
  ]),

  soft("Windows Application Development", [
    ta("purpose", "Application Purpose"),
    multi("features", "Required Software Features", GENERIC_FEATURES),
    multi("windows", "Target Windows Versions", ["Windows 10", "Windows 11", "Windows Server", "Older versions"]),
    sel("users", "Number of Users", RANGE_USERS),
    sel("database", "Database Requirements", ["Local database", "Cloud database", "Both", "Not sure"])
  ]),

  soft("Linux Application Development", [
    ta("purpose", "Application Purpose"),
    sel("distribution", "Target Linux Distribution", [
      "Ubuntu",
      "Debian",
      "Fedora",
      "CentOS / RHEL",
      "Arch",
      "Not sure"
    ], { allowOther: true }),
    multi("features", "Required Application Features", GENERIC_FEATURES),
    rdo("interface", "Command-Line or GUI Application", ["Command-line", "GUI", "Both"]),
    ta("hardware", "Hardware or System Requirements")
  ]),

  soft("Custom Software Development", [
    ta("purpose", "Software Purpose"),
    multi("features", "Required Features", GENERIC_FEATURES),
    multi("os", "Target Operating System", OS_TARGETS),
    sel("users", "Expected Number of Users", RANGE_USERS),
    ta("integrations", "Integration Requirements")
  ]),

  soft("Desktop Application Development", [
    ta("purpose", "Application Purpose"),
    multi("os", "Target Operating Systems", ["Windows", "macOS", "Linux"]),
    multi("features", "Required Features", GENERIC_FEATURES),
    rdo("connectivity", "Offline or Online Functionality", ["Offline", "Online", "Both"]),
    sel("database", "Database Requirements", ["Local", "Cloud", "Both", "Not sure"])
  ]),

  soft("Mobile Application Development", [
    ta("purpose", "Application Purpose"),
    rdo("platforms", "Target Platforms", ["Android", "iOS", "Both"]),
    multi("features", "Required Features", GENERIC_FEATURES),
    yn("registration", "User Registration Requirements"),
    multi("integrations", "Third-Party Integrations", [
      "Payments",
      "Maps",
      "Push notifications",
      "Social login",
      "Analytics",
      "Other"
    ])
  ]),

  soft("Cross-Platform Application Development", [
    ta("purpose", "Application Purpose"),
    multi("platforms", "Target Platforms", ["Android", "iOS", "Web", "Desktop"]),
    multi("features", "Required Features", GENERIC_FEATURES),
    sel("technology", "Preferred Technology (if any)", [
      "Flutter",
      "React Native",
      ".NET MAUI",
      "Ionic",
      "Not sure"
    ]),
    ta("backend", "Backend Requirements")
  ]),

  soft("Business Management Software", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    multi("processes", "Business Processes to Manage", [
      "Sales",
      "Inventory",
      "Invoicing",
      "HR",
      "Projects",
      "Finance",
      "Procurement",
      "Customer support"
    ]),
    multi("modules", "Required Modules", GENERIC_FEATURES),
    sel("employees", "Number of Employees", RANGE_USERS),
    ta("reporting", "Reporting Requirements")
  ]),

  soft("Inventory Management Software", [
    sel("inventory_type", "Type of Inventory", [
      "Retail",
      "Wholesale",
      "Manufacturing",
      "Food & beverage",
      "Pharma",
      "Other"
    ], { allowOther: true }),
    sel("products", "Number of Products or Items", RANGE_SMALL),
    ta("stock_tracking", "Stock Tracking Requirements"),
    rdo("warehouses", "Warehouse Management Requirements", ["Single location", "Multiple warehouses", "Not sure"]),
    yn("barcode", "Barcode or QR Code Integration")
  ]),

  soft("Billing & Invoice Software", [
    sel("business_type", "Business Type", [
      "Retail",
      "Wholesale",
      "Services",
      "Manufacturing",
      "Other"
    ], { allowOther: true }),
    ta("invoice_requirements", "Invoice Requirements"),
    yn("tax", "Tax and GST Requirements"),
    multi("payments", "Payment Integration", ["UPI", "Cards", "Net banking", "Wallets", "Bank transfer", "None"]),
    ta("customer_product", "Customer and Product Management Requirements")
  ]),

  soft("Point of Sale (POS) Software", [
    sel("business_type", "Business Type", [
      "Retail",
      "Restaurant",
      "Pharmacy",
      "Supermarket",
      "Other"
    ], { allowOther: true }),
    num("counters", "Number of Billing Counters", { min: 1 }),
    multi("hardware", "Hardware Requirements", [
      "Barcode scanner",
      "Receipt printer",
      "Cash drawer",
      "Card reader",
      "Touchscreen",
      "Label printer"
    ]),
    yn("inventory", "Inventory Integration"),
    multi("payment_methods", "Payment Methods", ["Cash", "Card", "UPI", "Wallets", "Credit"])
  ]),

  soft("Customer Relationship Management (CRM) Software", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    ta("leads", "Lead Management Requirements"),
    multi("customer_features", "Customer Management Features", [
      "Contact management",
      "Deal tracking",
      "Notes",
      "Documents",
      "Segmentation",
      "Tasks"
    ]),
    ta("pipeline", "Sales Pipeline Requirements"),
    multi("communication", "Communication Integrations", ["Email", "WhatsApp", "SMS", "Calls", "Calendar", "Social"])
  ]),

  soft("Enterprise Resource Planning (ERP) Software", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    multi("modules", "Required ERP Modules", [
      "Finance",
      "Inventory",
      "Sales",
      "Purchase",
      "HR",
      "Manufacturing",
      "CRM",
      "Reports"
    ]),
    num("departments", "Number of Departments", { min: 1 }),
    sel("users", "Number of Users", RANGE_USERS),
    ta("integrations", "Existing Software Integrations")
  ]),

  soft("School & College Management Software", [
    sel("institution", "Institution Type", ["School", "College", "University", "Coaching centre", "Other"], {
      allowOther: true
    }),
    sel("students", "Number of Students", RANGE_SMALL),
    multi("modules", "Required Modules", [
      "Admissions",
      "Attendance",
      "Fees",
      "Exams",
      "Timetable",
      "Library",
      "Transport",
      "Hostel",
      "Parent portal"
    ]),
    ta("attendance", "Attendance Management Requirements"),
    ta("fees", "Fee Management Requirements")
  ]),

  soft("Hospital & Clinic Management Software", [
    sel("facility", "Healthcare Facility Type", [
      "Clinic",
      "Hospital",
      "Diagnostic centre",
      "Pharmacy",
      "Nursing home"
    ], { allowOther: true }),
    num("doctors", "Number of Doctors", { min: 1 }),
    ta("patients", "Patient Management Requirements"),
    ta("appointments", "Appointment Management Requirements"),
    ta("billing_records", "Billing and Medical Records Requirements")
  ]),

  soft("Employee Management Software", [
    sel("employees", "Number of Employees", RANGE_USERS),
    multi("modules", "Required HR Modules", [
      "Employee records",
      "Attendance",
      "Leave",
      "Payroll",
      "Recruitment",
      "Performance",
      "Documents"
    ]),
    sel("attendance", "Attendance Tracking Requirements", [
      "Biometric",
      "App-based",
      "Web-based",
      "Manual",
      "Not sure"
    ]),
    ta("payroll", "Payroll Management Requirements"),
    ta("portal", "Employee Portal Requirements")
  ]),

  soft("Automation Software Development", [
    ta("process", "Process to Automate"),
    ta("workflow", "Current Workflow Description"),
    t("systems", "Applications or Systems Involved"),
    multi("features", "Expected Automation Features", [
      "Data entry",
      "Notifications",
      "Reports",
      "File processing",
      "Integration",
      "Scheduling"
    ]),
    sel("frequency", "Automation Frequency", ["Real-time", "Hourly", "Daily", "Weekly", "Monthly", "On demand"])
  ]),

  soft("Database Management Software", [
    ta("purpose", "Database Purpose"),
    sel("technology", "Preferred Database Technology", [
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "SQL Server",
      "Oracle",
      "Not sure"
    ], { allowOther: true }),
    sel("volume", "Estimated Data Volume", ["Under 1 GB", "1-10 GB", "10-100 GB", "100 GB+", "Not sure"]),
    multi("operations", "Required Database Operations", [
      "CRUD",
      "Search",
      "Reports",
      "Import / export",
      "Backup",
      "Migration",
      "Access control"
    ]),
    ta("security", "Backup and Security Requirements")
  ]),

  soft("API Development & Integration", [
    ta("purpose", "API Purpose"),
    rdo("kind", "Existing API or New API?", ["New API", "Extend existing", "Integrate third-party"]),
    t("systems", "Systems to Integrate"),
    multi("features", "Required API Functionality", [
      "Authentication",
      "CRUD endpoints",
      "Webhooks",
      "Rate limiting",
      "Documentation",
      "Versioning"
    ]),
    sel("auth", "Preferred Authentication Method", ["API key", "OAuth 2.0", "JWT", "Basic auth", "Not sure"])
  ]),

  soft("Software Maintenance & Technical Support", [
    t("software_name", "Existing Software Name"),
    t("platform", "Operating System or Platform"),
    ta("issues", "Current Technical Issues"),
    multi("support", "Type of Support Required", [
      "Bug fixes",
      "Updates",
      "Security",
      "Performance",
      "Feature additions",
      "Monitoring"
    ]),
    sel("duration", "Preferred Support Duration", [
      "One-time",
      "1 month",
      "3 months",
      "6 months",
      "12 months",
      "Ongoing"
    ])
  ])
];

/* ============================================================
   CATEGORY 3 · DIGITAL MARKETING (20)
   ============================================================ */

const MARKETING: ServiceForm[] = [
  mkt("Search Engine Optimization (SEO)", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    t("locations", "Target Locations", { placeholder: "e.g. Bengaluru, India, Global" }),
    ta("keywords", "Target Keywords (if known)"),
    multi("goals", "Main SEO Goals", [
      "Higher rankings",
      "More organic traffic",
      "More leads",
      "Local visibility",
      "Fix SEO issues"
    ])
  ]),

  mkt("Local SEO Optimization", [
    t("business_name", "Business Name"),
    url("site_url", "Business Website", { placeholder: "https://example.com" }),
    t("location", "Business Location"),
    url("gbp_url", "Google Business Profile URL", { placeholder: "Optional" }),
    t("service_areas", "Target Service Areas")
  ]),

  mkt("Social Media Marketing", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    multi("platforms", "Target Social Media Platforms", PLATFORMS_SOCIAL),
    t("audience", "Target Audience"),
    multi("goals", "Marketing Goals", ["Brand awareness", "Engagement", "Follower growth", "Lead generation", "Sales"]),
    { id: "ad_budget", label: "Monthly Advertising Budget", type: "budget", options: BUDGET_MKT, required: true }
  ]),

  mkt("Social Media Management", [
    ta("account_links", "Social Media Account Links"),
    multi("platforms", "Platforms to Manage", PLATFORMS_SOCIAL),
    num("posts", "Required Number of Posts", { min: 0, help: "Per month" }),
    multi("content", "Content Creation Requirements", [
      "Graphics",
      "Reels / videos",
      "Captions",
      "Story designs",
      "Carousels",
      "Not sure"
    ]),
    sel("frequency", "Posting Frequency", ["Daily", "3-4 per week", "Weekly", "Bi-weekly"])
  ]),

  mkt("Google Ads Campaign Management", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    t("products", "Products or Services to Advertise"),
    t("locations", "Target Locations"),
    { id: "ad_budget", label: "Monthly Advertising Budget", type: "budget", options: BUDGET_MKT, required: true },
    multi("goals", "Campaign Goals", ["Leads", "Sales", "Traffic", "Calls", "App installs"])
  ]),

  mkt("Facebook & Instagram Advertising", [
    url("site_url", "Business Website", { placeholder: "https://example.com" }),
    t("page_links", "Facebook or Instagram Page Links"),
    t("products", "Products or Services to Promote"),
    t("audience", "Target Audience"),
    { id: "ad_budget", label: "Monthly Advertising Budget", type: "budget", options: BUDGET_MKT, required: true }
  ]),

  mkt("YouTube Marketing", [
    url("channel_url", "YouTube Channel URL (if available)", { placeholder: "Optional" }),
    sel("category", "Business or Channel Category", INDUSTRY, { allowOther: true }),
    multi("goals", "Marketing Goals", ["Subscribers", "Views", "Leads", "Sales", "Brand awareness"]),
    multi("promotion", "Video Promotion Requirements", [
      "Video editing",
      "Thumbnails",
      "SEO",
      "Ads",
      "Content ideas",
      "Full production"
    ]),
    t("audience", "Target Audience")
  ]),

  mkt("Content Marketing", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    multi("content_types", "Content Types Required", [
      "Blog posts",
      "Articles",
      "Social posts",
      "Videos",
      "Infographics",
      "Newsletters"
    ]),
    t("audience", "Target Audience"),
    sel("frequency", "Content Publishing Frequency", ["Daily", "Weekly", "Bi-weekly", "Monthly"])
  ]),

  mkt("Email Marketing", [
    url("site_url", "Business Website", { placeholder: "https://example.com" }),
    sel("subscribers", "Existing Email Subscriber Count", [
      "Under 500",
      "500-2,000",
      "2,000-10,000",
      "10,000+",
      "None yet"
    ]),
    sel("platform", "Email Marketing Platform (if any)", [
      "Mailchimp",
      "Klaviyo",
      "Brevo",
      "HubSpot",
      "None",
      "Other"
    ], { allowOther: true }),
    multi("campaign", "Campaign Type", ["Newsletters", "Promotions", "Drip / automation", "Re-engagement", "Transactional"]),
    multi("goals", "Marketing Goals", ["Leads", "Sales", "Retention", "Brand awareness"])
  ]),

  mkt("WhatsApp Marketing", [
    t("business_name", "Business Name"),
    sel("account_status", "WhatsApp Business Account Status", ["Active", "Not set up yet", "Not sure"]),
    sel("contacts", "Approximate Customer Contact Count", ["Under 500", "500-2,000", "2,000-10,000", "10,000+"]),
    ta("campaign", "Campaign Requirements"),
    yn("automation", "Automation Requirements")
  ]),

  mkt("Influencer Marketing", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    t("product", "Product or Service to Promote"),
    t("audience", "Target Audience"),
    multi("influencer_category", "Preferred Influencer Category", [
      "Fashion",
      "Tech",
      "Food",
      "Travel",
      "Fitness",
      "Finance",
      "Lifestyle",
      "Gaming"
    ]),
    { id: "campaign_budget", label: "Campaign Budget", type: "budget", options: BUDGET_MKT, required: true }
  ]),

  mkt("Affiliate Marketing", [
    url("site_url", "Business Website", { placeholder: "https://example.com" }),
    t("products", "Products or Services"),
    sel("status", "Affiliate Program Status", [
      "Not started",
      "Planning",
      "Active, needs management",
      "Active, needs growth"
    ]),
    t("commission", "Commission Structure (if known)", { placeholder: "Optional" }),
    t("audience", "Target Affiliate Audience")
  ]),

  mkt("Pay-Per-Click (PPC) Advertising", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    t("products", "Products or Services to Advertise"),
    multi("platforms", "Preferred Advertising Platforms", [
      "Google Ads",
      "Facebook / Instagram",
      "LinkedIn",
      "YouTube",
      "Bing",
      "Display"
    ]),
    t("locations", "Target Locations"),
    { id: "ad_budget", label: "Monthly Advertising Budget", type: "budget", options: BUDGET_MKT, required: true }
  ]),

  mkt("Search Engine Marketing (SEM)", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    ta("keywords", "Target Keywords"),
    t("locations", "Target Locations"),
    { id: "ad_budget", label: "Advertising Budget", type: "budget", options: BUDGET_MKT, required: true }
  ]),

  mkt("Online Brand Management", [
    t("brand_name", "Brand or Business Name"),
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    multi("presence", "Existing Online Presence", [
      "Website",
      "Instagram",
      "Facebook",
      "LinkedIn",
      "YouTube",
      "X (Twitter)",
      "Google Business"
    ]),
    ta("challenges", "Current Brand Challenges"),
    multi("goals", "Brand Management Goals", ["Awareness", "Reputation", "Consistency", "Engagement", "Trust"])
  ]),

  mkt("Digital Marketing Strategy", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    multi("channels", "Current Marketing Channels", [
      "SEO",
      "Google Ads",
      "Social media",
      "Email",
      "Content",
      "Influencers",
      "Offline",
      "None"
    ]),
    t("audience", "Target Audience"),
    multi("goals", "Main Business Goals", ["Leads", "Sales", "Awareness", "Retention", "Launch"])
  ]),

  mkt("Lead Generation Campaigns", [
    sel("industry", "Business Industry", INDUSTRY, { allowOther: true }),
    t("products", "Products or Services"),
    sel("customer_type", "Target Customer Type", ["B2C", "B2B", "Both", "Government"]),
    t("locations", "Target Locations"),
    sel("leads", "Expected Number of Leads", ["Under 50 / month", "50-200 / month", "200-500 / month", "500+ / month"])
  ]),

  mkt("Conversion Rate Optimization (CRO)", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    sel("conversion_goal", "Website Conversion Goal", [
      "Purchases",
      "Leads",
      "Signups",
      "Demo bookings",
      "Downloads"
    ], { allowOther: true }),
    t("conversion_rate", "Current Conversion Rate (if known)", { placeholder: "Optional" }),
    ta("challenges", "Current Website Challenges"),
    multi("analytics", "Analytics Tools Used", ["Google Analytics", "Hotjar", "Clarity", "Mixpanel", "None", "Other"])
  ]),

  mkt("Marketing Analytics & Reporting", [
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    multi("platforms", "Marketing Platforms Used", [
      "Google Ads",
      "Meta",
      "LinkedIn",
      "SEO",
      "Email",
      "Social",
      "Content"
    ]),
    multi("tools", "Analytics Tools Available", [
      "Google Analytics",
      "Search Console",
      "Meta Business",
      "CRM",
      "Spreadsheets",
      "None"
    ]),
    multi("metrics", "Metrics to Track", ["Traffic", "Leads", "Sales", "ROI / ROAS", "Engagement", "Conversions"]),
    sel("frequency", "Reporting Frequency", ["Weekly", "Bi-weekly", "Monthly", "Quarterly"])
  ]),

  mkt("Online Reputation Management", [
    t("business_name", "Business Name"),
    url("site_url", "Website URL", { placeholder: "https://example.com" }),
    ta("review_links", "Review Platform Links"),
    ta("challenges", "Current Reputation Challenges"),
    multi("goals", "Reputation Management Goals", [
      "More positive reviews",
      "Handle negatives",
      "Respond to reviews",
      "Improve rating",
      "Brand monitoring"
    ])
  ])
];

/* ============================================================
   CATEGORY 4 · STUDENT PROJECTS (5)
   ------------------------------------------------------------
   Mini and major academic projects. The project kinds below match
   the ones on the student banner (websites, Android/iOS apps,
   Windows/Linux software, IoT, AR/VR).
   ============================================================ */

const PROJECT_KIND = ["Mini project", "Major project", "Final year project", "Other"];

const STUDENT_DELIVERABLES = [
  "Source code",
  "Report / documentation",
  "PPT / presentation",
  "Demo video",
  "Deployment / setup help"
];

const STUDENT: ServiceForm[] = [
  stud("Student Website Project", [
    sel("project_kind", "Project Type", PROJECT_KIND, { allowOther: true }),
    t("institution", "College / University Name", { placeholder: "e.g. RV College of Engineering" }),
    t("course", "Course & Branch", { placeholder: "e.g. B.Tech, Computer Science" }),
    multi("technology", "Preferred Technology", [
      "HTML / CSS / JavaScript",
      "React",
      "Next.js",
      "Node.js",
      "PHP",
      "Python (Django / Flask)",
      "Java (Spring)",
      "WordPress",
      "Other"
    ]),
    multi("features", "Required Website Features", [
      "Login / signup",
      "Admin panel",
      "Database",
      "Payments",
      "Search",
      "Chatbot",
      "Reports / dashboard",
      "Other"
    ]),
    multi("deliverables", "Expected Deliverables", STUDENT_DELIVERABLES),
    { id: "submission_deadline", label: "Submission Deadline", type: "date", help: "Optional", step: 2 }
  ]),

  stud("Student Android & iOS App Project", [
    sel("project_kind", "Project Type", PROJECT_KIND, { allowOther: true }),
    t("institution", "College / University Name", { placeholder: "e.g. RV College of Engineering" }),
    t("course", "Course & Branch", { placeholder: "e.g. B.Tech, Computer Science" }),
    rdo("platform", "Target Platform", ["Android", "iOS", "Both"]),
    multi("technology", "Preferred Technology", [
      "Java",
      "Kotlin",
      "Flutter",
      "React Native",
      "Swift",
      "Other"
    ]),
    multi("features", "Required App Features", [
      "Login / signup",
      "Backend / database",
      "Push notifications",
      "Maps",
      "Chat",
      "Payments",
      "Camera / sensors",
      "Other"
    ]),
    multi("deliverables", "Expected Deliverables", STUDENT_DELIVERABLES),
    { id: "submission_deadline", label: "Submission Deadline", type: "date", help: "Optional", step: 2 }
  ]),

  stud("Student Windows & Linux Software Project", [
    sel("project_kind", "Project Type", PROJECT_KIND, { allowOther: true }),
    t("institution", "College / University Name", { placeholder: "e.g. RV College of Engineering" }),
    t("course", "Course & Branch", { placeholder: "e.g. B.Tech, Computer Science" }),
    multi("os", "Target Operating System", ["Windows", "Linux", "Both"]),
    multi("technology", "Preferred Technology", [
      "Java",
      "Python",
      "C# / .NET",
      "C / C++",
      "Electron",
      "Other"
    ]),
    multi("features", "Required Software Features", [
      "Login / users",
      "Database",
      "File handling",
      "Reports",
      "Charts / dashboard",
      "Hardware / serial port",
      "Other"
    ]),
    multi("deliverables", "Expected Deliverables", STUDENT_DELIVERABLES),
    { id: "submission_deadline", label: "Submission Deadline", type: "date", help: "Optional", step: 2 }
  ]),

  stud("Student IoT Project", [
    sel("project_kind", "Project Type", PROJECT_KIND, { allowOther: true }),
    t("institution", "College / University Name", { placeholder: "e.g. RV College of Engineering" }),
    t("course", "Course & Branch", { placeholder: "e.g. B.Tech, Electronics" }),
    multi("board", "Target Board / Controller", [
      "Arduino",
      "Raspberry Pi",
      "ESP32 / ESP8266",
      "NodeMCU",
      "Not sure yet"
    ]),
    multi("sensors", "Sensors & Modules", [
      "Temperature / humidity",
      "Motion / PIR",
      "Ultrasonic distance",
      "Gas / smoke",
      "Light / LDR",
      "GPS",
      "RFID",
      "Heart rate",
      "Not sure yet"
    ]),
    multi("connectivity", "Connectivity", ["Wi-Fi", "Bluetooth", "GSM / 4G", "LoRa", "Zigbee", "None (offline)"]),
    rdo("interface", "Monitoring Interface", [
      "Cloud dashboard",
      "Mobile app",
      "Both",
      "Local display only"
    ]),
    multi("deliverables", "Expected Deliverables", STUDENT_DELIVERABLES),
    { id: "submission_deadline", label: "Submission Deadline", type: "date", help: "Optional", step: 2 }
  ]),

  stud("Student AR & VR Project", [
    sel("project_kind", "Project Type", PROJECT_KIND, { allowOther: true }),
    t("institution", "College / University Name", { placeholder: "e.g. RV College of Engineering" }),
    t("course", "Course & Branch", { placeholder: "e.g. B.Tech, Computer Science" }),
    multi("platform", "Target Platform", [
      "Android",
      "iOS",
      "Windows PC",
      "Web (browser)",
      "Meta Quest",
      "Other"
    ]),
    sel("technology", "Preferred Engine / Technology", [
      "Unity",
      "Unreal Engine",
      "WebXR",
      "ARCore",
      "ARKit",
      "Not sure yet"
    ], { allowOther: true }),
    ta("use_case", "Project Use Case", {
      placeholder: "e.g. education, training simulation, virtual tour, game"
    }),
    multi("features", "Required Features", [
      "3D models",
      "360° scenes",
      "Hand / gaze interaction",
      "Voice / audio",
      "Multiplayer",
      "Animations",
      "Other"
    ]),
    sel("assets_ready", "Do You Have 3D Assets and Content?", [
      "Yes, ready",
      "Some of it",
      "No, need help creating"
    ]),
    multi("deliverables", "Expected Deliverables", STUDENT_DELIVERABLES),
    { id: "submission_deadline", label: "Submission Deadline", type: "date", help: "Optional", step: 2 }
  ])
];

export const ALL_FORMS: ServiceForm[] = [...WEBSITE, ...SOFTWARE, ...MARKETING, ...STUDENT];

export const SERVICE_FORMS: Record<string, ServiceForm> = Object.fromEntries(
  ALL_FORMS.map((f) => [f.service, f])
);

export function getServiceForm(name: string): ServiceForm | null {
  return SERVICE_FORMS[name] ?? null;
}

export function serviceNames(): string[] {
  return ALL_FORMS.map((f) => f.service);
}

/** Fields marked allowOther get a companion "please specify" text field that
 *  appears (via showIf) only when "Other" is chosen. */
function expandOther(fields: EnquiryField[]): EnquiryField[] {
  const out: EnquiryField[] = [];
  for (const f of fields) {
    out.push(f);
    if (f.allowOther && (f.type === "select" || f.type === "radio")) {
      out.push({
        id: `${f.id}_other`,
        label: `${f.label} - please specify`,
        type: "text",
        help: "Optional",
        step: f.step,
        showIf: { field: f.id, equals: "Other" }
      });
    }
  }
  return out;
}

/** Full ordered field list for a service: common contact fields first, then the
 *  service-specific questions and the shared optional tail. Fields without an
 *  explicit step fall in the middle step (the service-specific requirements). */
export function fieldsForService(name: string): EnquiryField[] | null {
  const form = getServiceForm(name);
  if (!form) return null;
  return expandOther([...COMMON_FIELDS, ...form.fields]).map((f) => ({ ...f, step: f.step ?? 2 }));
}

/** Wizard step ids + display titles, shared by the client and tests. */
export const FORM_STEPS = [
  { step: 1, title: "Your details" },
  { step: 2, title: "Requirements" },
  { step: 3, title: "Budget & timeline" }
] as const;
