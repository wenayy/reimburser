import { listExpenses, listReimbursements, listTemplates } from "@/lib/store";
import { requireOnboarded } from "@/lib/auth";
import { ExpenseManager } from "@/components/dashboard/ExpenseManager";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const creator = await requireOnboarded();
  const [expenses, reimbursements, templates] = await Promise.all([
    listExpenses(creator.id),
    listReimbursements(creator.id),
    listTemplates(creator.id),
  ]);

  return (
    <ExpenseManager
      expenses={expenses}
      reimbursements={reimbursements}
      templates={templates}
    />
  );
}
