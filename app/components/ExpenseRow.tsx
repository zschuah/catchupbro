import { FaMoneyBillTransfer } from "react-icons/fa6";
import { Link } from "react-router";
import { formatCurrency, resolveExpenseDisplay } from "~/utils/helpers";
import type { Expense, Member } from "~/utils/types";

interface ExpenseRowProps {
  id: string;
  expense: Expense;
  members: Record<string, Member>;
  currency: string;
  tripCode: string;
}

export function ExpenseRow({
  id,
  expense,
  members,
  currency,
  tripCode,
}: ExpenseRowProps) {
  const { category, label } = resolveExpenseDisplay(expense);
  const Icon = category.Icon;
  const paidByName = members[expense.paidBy]?.name ?? "Unknown";
  const splitCount = Object.keys(expense.splitAmong ?? {}).length;

  return (
    <Link
      to={`/trip/${tripCode}/expense/${id}`}
      className="bg-base-100 hover:bg-base-300 flex items-center gap-3 rounded-box p-3 transition-colors"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          expense.isPayment
            ? "bg-success/20 text-success"
            : "bg-primary/15 text-primary"
        }`}
      >
        {expense.isPayment ? <FaMoneyBillTransfer /> : <Icon />}
      </div>

      <div className="min-w-0 grow">
        <p className="truncate font-medium">{label}</p>
        <p className="text-base-content/60 text-sm">
          {expense.isPayment
            ? `${paidByName} paid`
            : `${paidByName} paid · split ${splitCount} way${splitCount === 1 ? "" : "s"}`}
        </p>
      </div>

      <span
        className={`shrink-0 font-semibold ${expense.isPayment ? "text-success" : ""}`}
      >
        {formatCurrency(expense.amount, currency)}
      </span>
    </Link>
  );
}
