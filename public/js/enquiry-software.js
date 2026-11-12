/* ============================================================
   RJ - Category 02 data · Software & Product Development
   Registers with the shared enquiry engine (service-enquiry.js).
   Three steps for every service: Project Requirements ->
   Budget & Timeline -> Personal Information.
   The platform question is rendered at the end of step 1 for
   every service from the `platforms` block below.
   ============================================================ */
(function () {
  "use strict";

  function withDescription(fields) {
    return fields.concat([
      { k: "description", l: "Project Description", t: "textarea" }
    ]);
  }

  var SCALE = ["1-10", "11-50", "51-200", "200+"];
  var STAGE = ["Idea", "MVP", "Live product", "Scaling"];

  window.RJEnquiry.define({
    id: "software",
    label: "Software & Product Development",
    dedupeOrg: true,
    steps: [
      { title: "Project Requirements", kind: "fields", fieldStep: 1 },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Personal Information", kind: "contact" }
    ],
    platforms: {
      heading: "Which platform do you want your software for?",
      lead: "Select all platforms you want your solution to support.",
      options: ["Android", "Windows", "Linux", "iOS"],
      extras: ["Web Browser"],
      unsure: "Not Sure Yet"
    },
    services: [
      {
        id: "sw-custom-software",
        name: "Custom Software Development",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Product / Company Name", t: "text", req: true },
          { k: "stage", l: "What stage are you at", t: "select", o: STAGE },
          { k: "modules", l: "Key modules", t: "multi", o: [
            "User accounts", "Payments", "Dashboards", "Reports", "Notifications", "Integrations"
          ] }
        ])
      },
      {
        id: "sw-crm",
        name: "CRM Development",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "team_size", l: "Team size", t: "select", o: ["1-5", "6-20", "21-50", "50+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Lead tracking", "Sales pipeline", "Email sync", "Task reminders", "Reports"
          ] }
        ])
      },
      {
        id: "sw-erp",
        name: "ERP Development",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "company_size", l: "Company size", t: "select", o: SCALE },
          { k: "modules", l: "Modules needed", t: "multi", o: [
            "Finance", "Inventory", "HR", "Procurement", "Sales", "Reports"
          ] }
        ])
      },
      {
        id: "sw-business-mgmt",
        name: "Business Management Software",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "business_size", l: "Business size", t: "select", o: SCALE },
          { k: "modules", l: "Modules needed", t: "multi", o: [
            "Operations", "Staff", "Invoicing", "Inventory", "Scheduling", "Reports"
          ] }
        ])
      },
      {
        id: "sw-inventory",
        name: "Inventory Management Software",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "sku_range", l: "Number of products", t: "select", o: [
            "Under 100", "100-1,000", "1,000-10,000", "10,000+"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Barcode", "Multi-warehouse", "Supplier orders", "Stock alerts", "Reports"
          ] }
        ])
      },
      {
        id: "sw-billing",
        name: "Billing & Invoicing Software",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "volume", l: "Monthly invoices", t: "select", o: ["Under 50", "50-500", "500+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "GST / tax", "Recurring billing", "Payment links", "Expense tracking", "Reports"
          ] }
        ])
      },
      {
        id: "sw-hr",
        name: "HR & Employee Management Software",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "team_size", l: "Number of employees", t: "select", o: SCALE },
          { k: "features", l: "Key features", t: "multi", o: [
            "Attendance", "Leave", "Payroll", "Recruitment", "Performance", "Self-service"
          ] }
        ])
      },
      {
        id: "sw-project-mgmt",
        name: "Project Management Software",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "team_size", l: "Team size", t: "select", o: ["1-5", "6-20", "21-50", "50+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Tasks", "Time tracking", "File sharing", "Reports", "Notifications"
          ] }
        ])
      },
      {
        id: "sw-pos",
        name: "POS Software Development",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "outlets", l: "Number of outlets", t: "select", o: ["1", "2-5", "6-20", "20+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Billing", "Barcode", "Receipt printing", "Offline mode", "Inventory", "Reports"
          ] }
        ])
      },
      {
        id: "sw-dms",
        name: "Document Management Systems",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "volume", l: "Document volume", t: "select", o: [
            "Under 1,000", "1,000-10,000", "10,000-100,000", "100,000+"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Search", "Permissions", "Approvals", "Versioning", "E-signatures"
          ] }
        ])
      },
      {
        id: "sw-workflow",
        name: "Workflow Management Systems",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "departments", l: "Departments involved", t: "select", o: ["1-3", "4-10", "10+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Approvals", "Task assignment", "Notifications", "Integrations", "Reports"
          ] }
        ])
      },
      {
        id: "sw-ticketing",
        name: "Customer Support & Ticketing Systems",
        group: "Custom Software & Business Systems",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "volume", l: "Monthly tickets", t: "select", o: ["Under 100", "100-1,000", "1,000+"] },
          { k: "channels", l: "Support channels", t: "multi", o: [
            "Email", "WhatsApp", "Live chat", "Customer portal", "SLA reports"
          ] }
        ])
      },
      {
        id: "sw-saas",
        name: "SaaS Product Development",
        group: "SaaS & Digital Products",
        fields: withDescription([
          { k: "product_name", l: "Product Name", t: "text", req: true },
          { k: "stage", l: "Product stage", t: "select", o: STAGE },
          { k: "features", l: "Key features", t: "multi", o: [
            "Auth", "Billing", "Dashboard", "Multi-tenant", "Integrations", "Admin panel"
          ] }
        ])
      },
      {
        id: "sw-multi-tenant",
        name: "Multi-Tenant Software Development",
        group: "SaaS & Digital Products",
        fields: withDescription([
          { k: "company_name", l: "Product / Company Name", t: "text", req: true },
          { k: "org_range", l: "Expected organizations", t: "select", o: ["Under 10", "10-100", "100+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Tenant isolation", "Admin console", "Subscriptions", "Roles", "Reports"
          ] }
        ])
      },
      {
        id: "sw-marketplace",
        name: "Multi-Vendor Marketplace Development",
        group: "SaaS & Digital Products",
        fields: withDescription([
          { k: "marketplace_name", l: "Marketplace Name", t: "text", req: true },
          { k: "vendors", l: "Expected vendors", t: "select", o: ["Under 50", "50-500", "500+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Vendor registration", "Vendor dashboard", "Commissions", "Payouts", "Orders", "Reviews"
          ] }
        ])
      },
      {
        id: "sw-portals",
        name: "Customer & Enterprise Portals",
        group: "SaaS & Digital Products",
        fields: withDescription([
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "portal_type", l: "Portal type", t: "select", o: [
            "Customer Portal", "Enterprise Portal", "Partner Portal", "Employee Portal"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Login", "Dashboard", "Documents", "Messaging", "Permissions"
          ] }
        ])
      },
      {
        id: "sw-analytics",
        name: "Dashboard & Analytics Software",
        group: "SaaS & Digital Products",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "sources", l: "Where the data comes from", t: "select", o: [
            "Website", "Sales", "Marketing", "Multiple systems"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "KPIs", "Charts", "Filters", "Exports", "Scheduled reports"
          ] }
        ])
      },
      {
        id: "sw-fintech",
        name: "FinTech Software Development",
        group: "SaaS & Digital Products",
        note: "Regulated financial functionality requires appropriate legal, compliance and security review before development begins.",
        fields: withDescription([
          { k: "company_name", l: "Company / Product Name", t: "text", req: true },
          { k: "product_type", l: "Product type", t: "select", o: [
            "Payments", "Lending", "Investing", "Insurance", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Payments", "Transactions", "KYC", "Reports", "Compliance"
          ] }
        ])
      },
      {
        id: "sw-school",
        name: "School & College Management Software",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "institution_name", l: "Institution Name", t: "text", req: true },
          { k: "institution_type", l: "Institution type", t: "select", o: [
            "School", "College", "University", "Coaching centre", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Admissions", "Attendance", "Fees", "Exams", "Timetable", "Parent portal"
          ] }
        ])
      },
      {
        id: "sw-lms",
        name: "Learning Management System (LMS)",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "learners", l: "Number of learners", t: "select", o: ["Under 100", "100-1,000", "1,000+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Courses", "Video lessons", "Quizzes", "Certificates", "Live classes", "Payments"
          ] }
        ])
      },
      {
        id: "sw-healthcare",
        name: "Healthcare Management Software",
        group: "Industry-Specific Software",
        note: "Health data is sensitive and regulated - a privacy and regulatory compliance review is required before implementation.",
        fields: withDescription([
          { k: "healthcare_org", l: "Healthcare Organization", t: "text", req: true },
          { k: "facility_type", l: "Facility type", t: "select", o: [
            "Clinic", "Hospital", "Diagnostic centre", "Pharmacy", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Appointments", "Records", "Billing", "Pharmacy", "Patient portal"
          ] }
        ])
      },
      {
        id: "sw-real-estate",
        name: "Real Estate Management Software",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "property_range", l: "Number of properties", t: "select", o: ["Under 50", "50-500", "500+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Listings", "Tenants", "Rentals", "Payments", "Reports"
          ] }
        ])
      },
      {
        id: "sw-restaurant",
        name: "Restaurant Management Software",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "restaurant_name", l: "Restaurant Name", t: "text", req: true },
          { k: "branches", l: "Number of branches", t: "select", o: ["1", "2-5", "6-20", "20+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Orders", "Tables", "Kitchen display", "Menu", "POS", "Delivery"
          ] }
        ])
      },
      {
        id: "sw-logistics",
        name: "Logistics & Fleet Management Software",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "fleet", l: "Fleet size", t: "select", o: ["1-10", "11-50", "51-200", "200+"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Shipment tracking", "Routes", "Drivers", "GPS", "Fuel", "Maintenance"
          ] }
        ])
      },
      {
        id: "sw-booking",
        name: "Booking & Reservation Software",
        group: "Industry-Specific Software",
        fields: withDescription([
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "booking_type", l: "Booking type", t: "select", o: [
            "Appointments", "Classes", "Rooms", "Services", "Other"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Calendar", "Availability", "Payments", "Reminders", "Cancellations"
          ] }
        ])
      },
      {
        id: "sw-desktop",
        name: "Desktop Application Development",
        group: "Application & Technical Development",
        fields: withDescription([
          { k: "app_name", l: "Application Name", t: "text", req: true },
          { k: "offline", l: "Offline use", t: "select", o: [
            "Must work fully offline", "Partly offline", "Always online"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Local database", "File handling", "Hardware integration", "Multi-user", "Auto-update"
          ] }
        ])
      },
      {
        id: "sw-mobile",
        name: "Mobile Application Development",
        group: "Application & Technical Development",
        fields: withDescription([
          { k: "app_name", l: "App Name", t: "text", req: true },
          { k: "app_type", l: "Application type", t: "select", o: [
            "Native App", "Cross-platform App", "Progressive Web App (PWA)", "Not sure yet"
          ] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Login", "Push notifications", "Location", "Payments", "Camera", "Offline"
          ] }
        ])
      },
      {
        id: "sw-api-backend",
        name: "API & Backend Development",
        group: "Application & Technical Development",
        fields: withDescription([
          { k: "company_name", l: "Product / Company Name", t: "text", req: true },
          { k: "api_type", l: "API type", t: "select", o: ["REST", "GraphQL", "Both", "Not sure yet"] },
          { k: "features", l: "Key features", t: "multi", o: [
            "Auth", "Real-time", "Webhooks", "Rate limiting", "Logging"
          ] }
        ])
      },
      {
        id: "sw-database",
        name: "Database Design & Development",
        group: "Application & Technical Development",
        fields: withDescription([
          { k: "project_name", l: "Project / Company Name", t: "text", req: true },
          { k: "db_tech", l: "Preferred database", t: "select", o: [
            "MySQL", "PostgreSQL", "MongoDB", "Microsoft SQL Server", "Not sure yet"
          ] },
          { k: "features", l: "What you need", t: "multi", o: [
            "Schema design", "Migration", "Backups", "Security", "Performance"
          ] }
        ])
      },
      {
        id: "sw-ai",
        name: "AI-Powered Software Solutions",
        group: "Application & Technical Development",
        note: "AI capabilities are assessed for technical feasibility before any commitment - we will confirm what is realistically achievable.",
        fields: withDescription([
          { k: "company_name", l: "Company / Product Name", t: "text", req: true },
          { k: "data_ready", l: "How ready is your data", t: "select", o: [
            "Data ready", "Some data available", "No data yet"
          ] },
          { k: "capabilities", l: "AI capabilities", t: "multi", o: [
            "Chatbot", "Document processing", "Recommendations", "Forecasting", "Image analysis"
          ] }
        ])
      }
    ]
  });
})();
