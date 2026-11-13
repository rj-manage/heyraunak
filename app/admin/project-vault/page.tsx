import { requireVaultAdminPage } from "@/lib/rbac/guard";
import AdminShell from "@/components/admin/shell";
import HandoverList from "@/components/admin/handover-list";

export const metadata = { title: "Project Vault admin - RJ Studio", robots: { index: false, follow: false } };

export default async function AdminVaultPage() {
  await requireVaultAdminPage();
  return (
    <AdminShell active="/admin/project-vault">
      <HandoverList />
    </AdminShell>
  );
}
