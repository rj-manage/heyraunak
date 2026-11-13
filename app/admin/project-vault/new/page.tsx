import { requireVaultAdminPage } from "@/lib/rbac/guard";
import AdminShell from "@/components/admin/shell";
import HandoverForm from "@/components/admin/handover-form";

export const metadata = { title: "New handover - Project Vault admin", robots: { index: false, follow: false } };

export default async function NewHandoverPage() {
  await requireVaultAdminPage();
  return (
    <AdminShell active="/admin/project-vault/new">
      <div className="app-bar">
        <h1>New handover</h1>
        <a className="soft-btn ghost" href="/admin/project-vault">Back to list</a>
      </div>
      <HandoverForm />
    </AdminShell>
  );
}
