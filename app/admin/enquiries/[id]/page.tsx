import { requireVaultAdminPage } from "@/lib/rbac/guard";
import AdminShell from "@/components/admin/shell";
import EnquiryDetail from "@/components/admin/enquiry-detail";

export const metadata = { title: "Enquiry - RJ Studio admin", robots: { index: false, follow: false } };

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireVaultAdminPage();
  const { id } = await params;
  return (
    <AdminShell active="/admin/enquiries">
      <EnquiryDetail id={id} />
    </AdminShell>
  );
}
