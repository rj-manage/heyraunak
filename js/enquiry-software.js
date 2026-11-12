/* ============================================================
   RJ - Category 02 data · Software & Product Development
   Registers with the shared enquiry engine (service-enquiry.js).
   30 services in four groups. Every form carries the same
   platform-selection step (Android / Windows / Linux / iOS, plus
   Web Browser and Not Sure Yet).
   ============================================================ */
(function () {
  "use strict";

  var DEPARTMENTS = [
    "Finance & Accounting", "Inventory & Warehouse", "Human Resources",
    "Procurement", "Sales & Purchase", "Production",
    "Customer Support", "Management & Reporting"
  ];

  var AI_CAPABILITIES = [
    "Chatbot / Assistant", "Document Processing", "Recommendations & Personalisation",
    "Forecasting & Prediction", "Image & Video Analysis", "Search & Classification"
  ];

  var SAAS_MODEL = ["Subscription", "Freemium", "Usage-based", "One-time Licence", "Not Sure Yet"];
  var SAAS_SCOPE = ["MVP", "Complete Product", "Phased Rollout", "Not Sure Yet"];
  var PORTAL_TYPE = ["Customer Portal", "Enterprise Portal", "Partner Portal", "Employee Portal", "Not Sure Yet"];
  var APP_TYPE = ["Native App", "Cross-platform App", "Progressive Web App (PWA)", "Not Sure Yet"];
  var API_TYPE = ["REST", "GraphQL", "REST + GraphQL", "Not Sure Yet"];
  var DB_TECH = ["MySQL", "PostgreSQL", "MongoDB", "Microsoft SQL Server", "Not Sure Yet"];

  window.RJEnquiry.define({
    id: "software",
    label: "Software & Product Development",
    dedupeOrg: true,
    steps: [
      { title: "Software Requirements", kind: "fields", fieldStep: 1 },
      { title: "Platform Selection", kind: "platform" },
      { title: "Budget & Timeline", kind: "budget" },
      { title: "Contact Information", kind: "contact" }
    ],
    platforms: {
      heading: "Which platform do you want your software for?",
      lead: "Select all platforms you want your solution to support.",
      options: ["Android", "Windows", "Linux", "iOS"],
      extras: ["Web Browser"],
      unsure: "Not Sure Yet"
    },
    services: [
      /* ---------- A. Custom Software & Business Systems ---------- */
      {
        id: "sw-custom-software",
        name: "Custom Software Development",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "software_name", l: "Software / Product Name", t: "text", req: true },
          { k: "industry", l: "Business / Industry", t: "text" },
          { k: "purpose", l: "Software Purpose", t: "textarea" },
          { k: "problem", l: "Problem You Want to Solve", t: "textarea" },
          { k: "target_users", l: "Target Users", t: "text" },
          { k: "features", l: "Required Features", t: "textarea" },
          { k: "functionalities", l: "Main Functionalities", t: "textarea" },
          { k: "roles", l: "User Roles & Permissions", t: "textarea" },
          { k: "database", l: "Database Requirements", t: "textarea" },
          { k: "integrations", l: "API / Third-Party Integrations", t: "textarea" },
          { k: "refs", l: "Reference Software", t: "text" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-crm",
        name: "CRM Development",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "business_type", l: "Business Type", t: "text" },
          { k: "expected_users", l: "Number of Expected Users", t: "text" },
          { k: "customer_mgmt", l: "Customer Management Requirements", t: "textarea" },
          { k: "lead_mgmt", l: "Lead Management Requirements", t: "textarea" },
          { k: "pipeline", l: "Sales Pipeline Requirements", t: "textarea" },
          { k: "contact_mgmt", l: "Contact Management", t: "textarea" },
          { k: "communication", l: "Communication Integration", t: "text" },
          { k: "followups", l: "Automated Follow-ups", t: "textarea" },
          { k: "reporting", l: "Reporting & Analytics", t: "textarea" },
          { k: "existing_crm", l: "Existing CRM (if any)", t: "text" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-erp",
        name: "ERP Development",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "text" },
          { k: "company_size", l: "Company Size", t: "text" },
          { k: "departments", l: "Required Departments", t: "multi", o: DEPARTMENTS },
          { k: "inventory", l: "Inventory Management", t: "textarea" },
          { k: "finance", l: "Finance & Accounting", t: "textarea" },
          { k: "hr", l: "HR Management", t: "textarea" },
          { k: "procurement", l: "Procurement Management", t: "textarea" },
          { k: "sales_purchase", l: "Sales & Purchase Management", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" },
          { k: "existing_systems", l: "Existing Systems", t: "text" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-business-mgmt",
        name: "Business Management Software",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "business_type", l: "Business Type", t: "text" },
          { k: "workflow", l: "Current Business Workflow", t: "textarea" },
          { k: "operations", l: "Operations to Manage", t: "textarea" },
          { k: "modules", l: "Required Modules", t: "textarea" },
          { k: "employee_access", l: "Employee Access Requirements", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" },
          { k: "automation", l: "Automation Requirements", t: "textarea" },
          { k: "existing_software", l: "Existing Software", t: "text" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-inventory",
        name: "Inventory Management Software",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "text" },
          { k: "sku_count", l: "Number of Products / SKUs", t: "text" },
          { k: "warehouse", l: "Warehouse Requirements", t: "textarea" },
          { k: "stock_tracking", l: "Stock Tracking Requirements", t: "textarea" },
          { k: "barcode", l: "Barcode / QR Code Requirements", t: "textarea" },
          { k: "suppliers", l: "Supplier Management", t: "textarea" },
          { k: "purchase_orders", l: "Purchase Order Management", t: "textarea" },
          { k: "alerts", l: "Stock Alerts", t: "text" },
          { k: "multi_location", l: "Multi-Location Inventory", t: "text" },
          { k: "existing_inventory", l: "Existing Inventory System", t: "text" }
        ]
      },
      {
        id: "sw-billing",
        name: "Billing & Invoicing Software",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "business_type", l: "Business Type", t: "text" },
          { k: "invoice_types", l: "Invoice Types", t: "text" },
          { k: "tax", l: "Tax / GST Requirements", t: "textarea" },
          { k: "payment_methods", l: "Payment Methods", t: "text" },
          { k: "recurring", l: "Recurring Billing", t: "text" },
          { k: "customer_mgmt", l: "Customer Management", t: "textarea" },
          { k: "expenses", l: "Expense Tracking", t: "textarea" },
          { k: "templates", l: "Invoice Templates", t: "text" },
          { k: "accounting", l: "Accounting Integration", t: "text" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-hr",
        name: "HR & Employee Management Software",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "employee_count", l: "Number of Employees", t: "text" },
          { k: "employee_mgmt", l: "Employee Management Requirements", t: "textarea" },
          { k: "attendance", l: "Attendance Tracking", t: "textarea" },
          { k: "leave", l: "Leave Management", t: "textarea" },
          { k: "payroll", l: "Payroll Requirements", t: "textarea" },
          { k: "recruitment", l: "Recruitment Management", t: "textarea" },
          { k: "performance", l: "Performance Tracking", t: "textarea" },
          { k: "self_service", l: "Employee Self-Service Portal", t: "textarea" },
          { k: "roles", l: "Role & Permission Management", t: "textarea" },
          { k: "existing_hr", l: "Existing HR Software", t: "text" }
        ]
      },
      {
        id: "sw-project-mgmt",
        name: "Project Management Software",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "team_size", l: "Team Size", t: "text" },
          { k: "project_types", l: "Project Types", t: "text" },
          { k: "task_mgmt", l: "Task Management", t: "textarea" },
          { k: "collaboration", l: "Team Collaboration", t: "textarea" },
          { k: "time_tracking", l: "Time Tracking", t: "textarea" },
          { k: "file_sharing", l: "File Sharing", t: "textarea" },
          { k: "reporting", l: "Project Reporting", t: "textarea" },
          { k: "notifications", l: "Notifications", t: "text" },
          { k: "roles", l: "User Roles", t: "textarea" },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea" }
        ]
      },
      {
        id: "sw-pos",
        name: "POS Software Development",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "business_type", l: "Business Type", t: "text" },
          { k: "outlet_count", l: "Number of Outlets", t: "text" },
          { k: "terminal_count", l: "Number of Terminals", t: "text" },
          { k: "payment_methods", l: "Payment Methods", t: "text" },
          { k: "billing", l: "Billing Requirements", t: "textarea" },
          { k: "inventory", l: "Inventory Integration", t: "textarea" },
          { k: "receipt", l: "Receipt Printing", t: "text" },
          { k: "barcode", l: "Barcode Scanner Integration", t: "text" },
          { k: "offline", l: "Offline Mode Requirements", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-dms",
        name: "Document Management Systems",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "document_types", l: "Document Types", t: "textarea" },
          { k: "document_volume", l: "Expected Document Volume", t: "text" },
          { k: "storage", l: "Document Storage Requirements", t: "textarea" },
          { k: "search", l: "Search & Filtering", t: "textarea" },
          { k: "permissions", l: "Document Permissions", t: "textarea" },
          { k: "approvals", l: "Approval Workflows", t: "textarea" },
          { k: "versioning", l: "Version Control", t: "text" },
          { k: "signatures", l: "Digital Signatures", t: "text" },
          { k: "security", l: "Security Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-workflow",
        name: "Workflow Management Systems",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "current_workflow", l: "Current Workflow", t: "textarea" },
          { k: "processes", l: "Processes to Automate", t: "textarea" },
          { k: "department_count", l: "Number of Departments", t: "text" },
          { k: "approvals", l: "Approval Requirements", t: "textarea" },
          { k: "task_assignment", l: "Task Assignment", t: "textarea" },
          { k: "notifications", l: "Notification Requirements", t: "textarea" },
          { k: "integrations", l: "Integration Requirements", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-ticketing",
        name: "Customer Support & Ticketing Systems",
        group: "A. Custom Software & Business Systems",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "agents", l: "Expected Support Agents", t: "text" },
          { k: "ticket_volume", l: "Expected Ticket Volume", t: "text" },
          { k: "ticket_categories", l: "Ticket Categories", t: "textarea" },
          { k: "customer_portal", l: "Customer Portal Requirements", t: "textarea" },
          { k: "live_chat", l: "Live Chat Requirements", t: "textarea" },
          { k: "email_int", l: "Email Integration", t: "text" },
          { k: "whatsapp_int", l: "WhatsApp Integration", t: "text" },
          { k: "auto_assignment", l: "Automated Ticket Assignment", t: "textarea" },
          { k: "sla", l: "SLA & Reporting Requirements", t: "textarea" }
        ]
      },

      /* ---------- B. SaaS & Digital Products ---------- */
      {
        id: "sw-saas",
        name: "SaaS Product Development",
        group: "B. SaaS & Digital Products",
        fields: [
          { k: "product_name", l: "Product Name", t: "text", req: true },
          { k: "product_desc", l: "Product Description", t: "textarea" },
          { k: "target_market", l: "Target Market", t: "text" },
          { k: "intended_users", l: "Intended Users", t: "text" },
          { k: "business_model", l: "SaaS Business Model", t: "select", o: SAAS_MODEL },
          { k: "plans", l: "Subscription Plans", t: "textarea" },
          { k: "roles", l: "User Roles", t: "textarea" },
          { k: "auth", l: "Authentication Requirements", t: "textarea" },
          { k: "dashboard", l: "Dashboard Requirements", t: "textarea" },
          { k: "multi_tenancy", l: "Multi-Tenancy Requirements", t: "textarea" },
          { k: "payments", l: "Payment & Subscription Integration", t: "textarea" },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea" },
          { k: "scope", l: "MVP or Complete Product", t: "select", o: SAAS_SCOPE },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-multi-tenant",
        name: "Multi-Tenant Software Development",
        group: "B. SaaS & Digital Products",
        fields: [
          { k: "product_name", l: "Product / Company Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "text" },
          { k: "org_count", l: "Number of Expected Organizations", t: "text" },
          { k: "isolation", l: "Tenant Isolation Requirements", t: "textarea" },
          { k: "admin_mgmt", l: "Admin Management", t: "textarea" },
          { k: "subscription_mgmt", l: "Subscription Management", t: "textarea" },
          { k: "org_permissions", l: "Organization-Level Permissions", t: "textarea" },
          { k: "data_separation", l: "Data Separation Requirements", t: "textarea" },
          { k: "scalability", l: "Scalability Requirements", t: "textarea" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-marketplace",
        name: "Multi-Vendor Marketplace Development",
        group: "B. SaaS & Digital Products",
        fields: [
          { k: "marketplace_name", l: "Marketplace Name", t: "text", req: true },
          { k: "marketplace_type", l: "Marketplace Type", t: "text" },
          { k: "categories", l: "Product / Service Categories", t: "text" },
          { k: "expected_vendors", l: "Expected Vendors", t: "text" },
          { k: "vendor_registration", l: "Vendor Registration", t: "textarea" },
          { k: "vendor_dashboard", l: "Vendor Dashboard", t: "textarea" },
          { k: "customer_accounts", l: "Customer Accounts", t: "textarea" },
          { k: "commissions", l: "Commission Management", t: "textarea" },
          { k: "payouts", l: "Payment & Payout Integration", t: "textarea" },
          { k: "orders", l: "Order Management", t: "textarea" },
          { k: "reviews", l: "Reviews & Ratings", t: "text" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-portals",
        name: "Customer & Enterprise Portals",
        group: "B. SaaS & Digital Products",
        fields: [
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "portal_type", l: "Portal Type", t: "select", o: PORTAL_TYPE },
          { k: "intended_users", l: "Intended Users", t: "text" },
          { k: "auth", l: "Authentication Requirements", t: "textarea" },
          { k: "dashboard", l: "User Dashboard", t: "textarea" },
          { k: "document_access", l: "Document Access", t: "textarea" },
          { k: "account_mgmt", l: "Account Management", t: "textarea" },
          { k: "communication", l: "Communication Features", t: "textarea" },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea" },
          { k: "permissions", l: "Access Permissions", t: "textarea" }
        ]
      },
      {
        id: "sw-analytics",
        name: "Dashboard & Analytics Software",
        group: "B. SaaS & Digital Products",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "industry", l: "Industry", t: "text" },
          { k: "data_sources", l: "Data Sources", t: "textarea" },
          { k: "metrics", l: "Metrics to Track", t: "textarea" },
          { k: "dashboard_type", l: "Dashboard Type", t: "text" },
          { k: "frequency", l: "Reporting Frequency", t: "text" },
          { k: "visualization", l: "Visualization Requirements", t: "textarea" },
          { k: "exports", l: "Export Requirements", t: "textarea" },
          { k: "roles", l: "User Roles", t: "textarea" },
          { k: "existing_tools", l: "Existing Analytics Tools", t: "text" }
        ]
      },
      {
        id: "sw-fintech",
        name: "FinTech Software Development",
        group: "B. SaaS & Digital Products",
        note: "Regulated financial functionality requires appropriate legal, compliance and security review before development begins.",
        fields: [
          { k: "company_name", l: "Company / Product Name", t: "text", req: true },
          { k: "product_type", l: "Financial Product Type", t: "text" },
          { k: "target_users", l: "Target Users", t: "text" },
          { k: "core_features", l: "Core Financial Features", t: "textarea" },
          { k: "payments", l: "Payment Integration", t: "textarea" },
          { k: "transactions", l: "Transaction Management", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" },
          { k: "identity", l: "Identity Verification Requirements", t: "textarea" },
          { k: "security", l: "Security & Compliance Requirements", t: "textarea" },
          { k: "api_integrations", l: "External API Integrations", t: "textarea" }
        ]
      },

      /* ---------- C. Industry-Specific Software ---------- */
      {
        id: "sw-school",
        name: "School & College Management Software",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "institution_name", l: "Institution Name", t: "text", req: true },
          { k: "institution_type", l: "Institution Type", t: "text" },
          { k: "student_count", l: "Number of Students", t: "text" },
          { k: "staff_count", l: "Number of Staff", t: "text" },
          { k: "admissions", l: "Admission Management", t: "textarea" },
          { k: "attendance", l: "Attendance Management", t: "textarea" },
          { k: "fees", l: "Fee Management", t: "textarea" },
          { k: "exams", l: "Examination Management", t: "textarea" },
          { k: "timetable", l: "Timetable Management", t: "textarea" },
          { k: "portal", l: "Parent / Student Portal", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-lms",
        name: "Learning Management System (LMS)",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "org_name", l: "Organization Name", t: "text", req: true },
          { k: "education_type", l: "Education Type", t: "text" },
          { k: "course_count", l: "Number of Courses", t: "text" },
          { k: "student_count", l: "Number of Students", t: "text" },
          { k: "course_mgmt", l: "Course Management", t: "textarea" },
          { k: "video", l: "Video Lessons", t: "textarea" },
          { k: "assessments", l: "Assessments & Quizzes", t: "textarea" },
          { k: "student_dashboard", l: "Student Dashboard", t: "textarea" },
          { k: "instructor_dashboard", l: "Instructor Dashboard", t: "textarea" },
          { k: "certificates", l: "Certificates", t: "text" },
          { k: "payments", l: "Subscription / Payment Requirements", t: "textarea" },
          { k: "live_classes", l: "Live Class Integration", t: "textarea" }
        ]
      },
      {
        id: "sw-healthcare",
        name: "Healthcare Management Software",
        group: "C. Industry-Specific Software",
        note: "Health data is sensitive and regulated - a privacy and regulatory compliance review is required before implementation.",
        fields: [
          { k: "healthcare_org", l: "Healthcare Organization", t: "text", req: true },
          { k: "facility_type", l: "Facility Type", t: "text" },
          { k: "staff_count", l: "Number of Doctors / Staff", t: "text" },
          { k: "patient_mgmt", l: "Patient Management", t: "textarea" },
          { k: "appointments", l: "Appointment Management", t: "textarea" },
          { k: "records", l: "Medical Records Requirements", t: "textarea" },
          { k: "billing", l: "Billing Requirements", t: "textarea" },
          { k: "pharmacy", l: "Pharmacy / Inventory Integration", t: "textarea" },
          { k: "portal", l: "Patient Portal", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" },
          { k: "security", l: "Security & Privacy Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-real-estate",
        name: "Real Estate Management Software",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "property_type", l: "Property Type", t: "text" },
          { k: "property_mgmt", l: "Property Management Requirements", t: "textarea" },
          { k: "property_count", l: "Number of Properties", t: "text" },
          { k: "agents", l: "Agent Management", t: "textarea" },
          { k: "leads", l: "Lead Management", t: "textarea" },
          { k: "tenants", l: "Tenant Management", t: "textarea" },
          { k: "rentals", l: "Rental Management", t: "textarea" },
          { k: "payments", l: "Payment Tracking", t: "textarea" },
          { k: "reporting", l: "Property Reporting", t: "textarea" },
          { k: "maps", l: "Map / Location Integration", t: "text" }
        ]
      },
      {
        id: "sw-restaurant",
        name: "Restaurant Management Software",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "restaurant_name", l: "Restaurant Name", t: "text", req: true },
          { k: "restaurant_type", l: "Restaurant Type", t: "text" },
          { k: "branch_count", l: "Number of Branches", t: "text" },
          { k: "orders", l: "Order Management", t: "textarea" },
          { k: "tables", l: "Table Management", t: "textarea" },
          { k: "kitchen", l: "Kitchen Display System", t: "textarea" },
          { k: "menu", l: "Menu Management", t: "textarea" },
          { k: "pos", l: "POS Integration", t: "textarea" },
          { k: "inventory", l: "Inventory Management", t: "textarea" },
          { k: "delivery", l: "Delivery Integration", t: "textarea" },
          { k: "staff", l: "Staff Management", t: "textarea" }
        ]
      },
      {
        id: "sw-logistics",
        name: "Logistics & Fleet Management Software",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "company_name", l: "Company Name", t: "text", req: true },
          { k: "fleet_size", l: "Fleet Size", t: "text" },
          { k: "vehicle_types", l: "Vehicle Types", t: "text" },
          { k: "drivers", l: "Driver Management", t: "textarea" },
          { k: "shipments", l: "Shipment Tracking", t: "textarea" },
          { k: "routes", l: "Route Optimization", t: "textarea" },
          { k: "delivery", l: "Delivery Management", t: "textarea" },
          { k: "gps", l: "GPS Tracking", t: "text" },
          { k: "fuel", l: "Fuel Management", t: "textarea" },
          { k: "maintenance", l: "Maintenance Scheduling", t: "textarea" },
          { k: "reporting", l: "Reporting Requirements", t: "textarea" }
        ]
      },
      {
        id: "sw-booking",
        name: "Booking & Reservation Software",
        group: "C. Industry-Specific Software",
        fields: [
          { k: "business_name", l: "Business Name", t: "text", req: true },
          { k: "booking_type", l: "Booking Type", t: "text" },
          { k: "service_count", l: "Number of Services", t: "text" },
          { k: "staff_count", l: "Number of Staff / Providers", t: "text" },
          { k: "calendar", l: "Calendar Management", t: "textarea" },
          { k: "availability", l: "Availability Management", t: "textarea" },
          { k: "accounts", l: "Customer Accounts", t: "textarea" },
          { k: "payments", l: "Online Payments", t: "textarea" },
          { k: "notifications", l: "Booking Notifications", t: "textarea" },
          { k: "cancellation", l: "Cancellation & Rescheduling", t: "textarea" },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea" }
        ]
      },

      /* ---------- D. Application & Technical Development ---------- */
      {
        id: "sw-desktop",
        name: "Desktop Application Development",
        group: "D. Application & Technical Development",
        fields: [
          { k: "app_name", l: "Application Name", t: "text", req: true },
          { k: "industry", l: "Business / Industry", t: "text" },
          { k: "purpose", l: "Application Purpose", t: "textarea" },
          { k: "target_users", l: "Target Users", t: "text" },
          { k: "features", l: "Required Features", t: "textarea" },
          { k: "offline", l: "Offline Functionality", t: "textarea" },
          { k: "local_database", l: "Local Database Requirements", t: "textarea" },
          { k: "file_mgmt", l: "File Management", t: "textarea" },
          { k: "hardware", l: "Hardware Integration", t: "textarea" },
          { k: "permissions", l: "User Permissions", t: "textarea" },
          { k: "refs", l: "Existing Application References", t: "text" }
        ]
      },
      {
        id: "sw-mobile",
        name: "Mobile Application Development",
        group: "D. Application & Technical Development",
        fields: [
          { k: "app_name", l: "App Name", t: "text", req: true },
          { k: "app_type", l: "Application Type", t: "select", o: APP_TYPE },
          { k: "audience", l: "Target Audience", t: "text" },
          { k: "features", l: "Core Features", t: "textarea" },
          { k: "auth", l: "User Authentication", t: "textarea" },
          { k: "push", l: "Push Notifications", t: "textarea" },
          { k: "location", l: "Location Services", t: "textarea" },
          { k: "payments", l: "Payment Integration", t: "textarea" },
          { k: "media", l: "Camera / Media Features", t: "textarea" },
          { k: "backend", l: "Backend Requirements", t: "textarea" },
          { k: "api_integrations", l: "API Integrations", t: "textarea" },
          { k: "refs", l: "Reference Applications", t: "text" }
        ]
      },
      {
        id: "sw-api-backend",
        name: "API & Backend Development",
        group: "D. Application & Technical Development",
        fields: [
          { k: "product_name", l: "Product / Company Name", t: "text", req: true },
          { k: "purpose", l: "Backend Purpose", t: "textarea" },
          { k: "technology", l: "Preferred Technology", t: "text" },
          { k: "api_type", l: "API Type", t: "select", o: API_TYPE },
          { k: "auth", l: "Authentication Requirements", t: "textarea" },
          { k: "traffic", l: "Expected Traffic", t: "text" },
          { k: "database", l: "Database Requirements", t: "textarea" },
          { k: "integrations", l: "Third-Party Integrations", t: "textarea" },
          { k: "realtime", l: "Real-Time Functionality", t: "textarea" },
          { k: "security", l: "Security Requirements", t: "textarea" },
          { k: "infrastructure", l: "Existing Infrastructure", t: "text" }
        ]
      },
      {
        id: "sw-database",
        name: "Database Design & Development",
        group: "D. Application & Technical Development",
        fields: [
          { k: "project_name", l: "Project / Company Name", t: "text", req: true },
          { k: "purpose", l: "Database Purpose", t: "textarea" },
          { k: "data_types", l: "Data Types", t: "textarea" },
          { k: "data_volume", l: "Approximate Data Volume", t: "text" },
          { k: "db_tech", l: "Preferred Database Technology", t: "select", o: DB_TECH },
          { k: "relationships", l: "Data Relationships", t: "textarea" },
          { k: "backups", l: "Backup Requirements", t: "textarea" },
          { k: "security", l: "Security Requirements", t: "textarea" },
          { k: "migration", l: "Migration Requirements", t: "textarea" },
          { k: "performance", l: "Performance Requirements", t: "textarea" },
          { k: "existing_db", l: "Existing Database (if any)", t: "text" }
        ]
      },
      {
        id: "sw-ai",
        name: "AI-Powered Software Solutions",
        group: "D. Application & Technical Development",
        note: "AI capabilities are assessed for technical feasibility before any commitment - we will confirm what is realistically achievable.",
        fields: [
          { k: "company_name", l: "Company / Product Name", t: "text", req: true },
          { k: "ai_type", l: "AI Solution Type", t: "text" },
          { k: "problem", l: "Problem to Solve", t: "textarea" },
          { k: "intended_users", l: "Intended Users", t: "text" },
          { k: "ai_capabilities", l: "Preferred AI Capabilities", t: "multi", o: AI_CAPABILITIES },
          { k: "data_sources", l: "Data Sources", t: "textarea" },
          { k: "document_processing", l: "Document Processing Requirements", t: "textarea" },
          { k: "chatbot", l: "Chatbot / Assistant Requirements", t: "textarea" },
          { k: "automation", l: "Automation Requirements", t: "textarea" },
          { k: "ai_integrations", l: "Third-Party AI Integrations", t: "textarea" },
          { k: "human_review", l: "Human Review Requirements", t: "textarea" },
          { k: "additional", l: "Additional Requirements", t: "textarea" }
        ]
      }
    ]
  });
})();
