import { listExpenses, listReimbursements } from "@/lib/store";
import { requireOnboarded } from "@/lib/auth";
import { ReimbursementList } from "@/components/dashboard/ReimbursementList";

export const dynamic = "force-dynamic";

export default async function ReimbursementsPage() {
  const creator = await requireOnboarded();
  const [expenses, unsorted] = await Promise.all([
    listExpenses(creator.id),
    listReimbursements(creator.id),
  ]);
  const reimbursements = unsorted
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return <ReimbursementList reimbursements={reimbursements} expenses={expenses} />;
}
