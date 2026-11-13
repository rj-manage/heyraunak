import { requireVaultAdminPage } from "@/lib/rbac/guard";
import AdminShell from "@/components/admin/shell";
import HandoverDetail from "@/components/admin/handover-detail";

export const metadata = { title: "Handover - Project Vault admin", robots: { index: false, follow: false } };

export default async function HandoverPage({ params }: { params: Promise<{ id: string }> }) {
  await requireVaultAdminPage();
  const { id } = await params;
  return (
    <AdminShell active="/admin/project-vault">
      <HandoverDetail id={id} />
    </AdminShell>
  );
}
