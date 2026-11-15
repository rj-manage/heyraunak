import { requireVaultAdminPage } from "@/lib/rbac/guard";
import AdminShell from "@/components/admin/shell";
import EnquiryList from "@/components/admin/enquiry-list";

export const metadata = { title: "Enquiries - RJ Studio admin", robots: { index: false, follow: false } };

export default async function AdminEnquiriesPage() {
  await requireVaultAdminPage();
  return (
    <AdminShell active="/admin/enquiries">
      <EnquiryList />
    </AdminShell>
  );
}
